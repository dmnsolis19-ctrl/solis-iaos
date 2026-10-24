import { readFile } from "node:fs/promises";

import {
  ChangeMessageVisibilityCommand, DeleteMessageCommand, ReceiveMessageCommand, SQSClient,
} from "@aws-sdk/client-sqs";
import { createRuntimePool, withTenantTransaction } from "@solis/database";
import type { AnySchema } from "ajv";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { runConsumer } from "./consumer.js";
import { handleDelivery } from "./delivery.js";
import { ingestionConfiguration } from "./ingestion-runtime-config.js";
import { createTelemetryPersister } from "./persistence.js";
import { resolveTransportContext, type TelemetryEnvelope } from "./transport-context.js";

export async function configuredIngestion(
  source: NodeJS.ProcessEnv,
  observe: (event: Record<string, unknown>) => void,
) {
  const config = ingestionConfiguration(source);
  if (config === undefined) return undefined;
  let schema: AnySchema;
  try {
    schema = JSON.parse(await readFile(new URL("./contracts/telemetry-envelope.v1.schema.json", import.meta.url), "utf8")) as AnySchema;
  } catch {
    // Source development path; packaged builds carry the same canonical schema in dist/contracts.
    schema = JSON.parse(await readFile(new URL("../../../packages/contracts/mqtt/telemetry-envelope.v1.schema.json", import.meta.url), "utf8")) as AnySchema;
  }
  const ajv = new Ajv2020({ allErrors: false, strict: true, strictRequired: false });
  addFormats(ajv);
  const validate = ajv.compile<TelemetryEnvelope>(schema);
  const pool = createRuntimePool({ connectionString: config.databaseUrl, max: 3, connectionTimeoutMillis: 2_000, idleTimeoutMillis: 10_000 });
  pool.on("error", () => observe({ event: "telemetry.database", code: "POOL_ERROR" }));
  const ready = async () => {
    try {
      return await withTenantTransaction(pool, { tenantId: "00000000-0000-0000-0000-000000000000", role: "solis_worker_runtime" }, async (connection) => {
        const columns = await connection.query(`
          SELECT count(*)::integer AS count FROM information_schema.columns
          WHERE (table_schema,table_name,column_name) IN (
            ('connectivity','gateway','mqtt_topic_key'), ('connectivity','gateway','mqtt_client_id'),
            ('telemetry','ingested_message','payload_sha256'), ('telemetry','latest_value','session_id')
          )
        `);
        return columns.rows[0]?.count === 4;
      });
    } catch { return false; }
  };
  if (!(await ready())) { await pool.end(); throw new Error("TELEMETRY_DATABASE_NOT_READY"); }
  const sqs = new SQSClient({
    region: "sa-east-1", endpoint: config.endpoint, useQueueUrlAsEndpoint: false,
    credentials: { accessKeyId: "test", secretAccessKey: "test" }, maxAttempts: 1,
  });
  const abort = new AbortController();
  const persist = createTelemetryPersister({
    transaction: (tenantId, operation) => withTenantTransaction(pool, { tenantId, role: "solis_worker_runtime" }, operation),
    resolve: (body, findGateway) => resolveTransportContext(body, { findGateway, validateEnvelope: validate }),
  });
  const active = runConsumer({
    receive: async (signal) => {
      const response = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: config.queueUrl, MaxNumberOfMessages: 1, WaitTimeSeconds: 20, VisibilityTimeout: 60,
      }), { abortSignal: signal });
      return (response.Messages ?? []).map((message) => ({
        ...(message.MessageId === undefined ? {} : { messageId: message.MessageId }),
        ...(message.ReceiptHandle === undefined ? {} : { receiptHandle: message.ReceiptHandle }),
        ...(message.Body === undefined ? {} : { body: message.Body }),
      }));
    },
    handle: (message) => handleDelivery(message, {
      persist,
      acknowledge: async (receiptHandle) => {
        await sqs.send(new DeleteMessageCommand({ QueueUrl: config.queueUrl, ReceiptHandle: receiptHandle }), { abortSignal: AbortSignal.timeout(3_000) });
      },
      observe,
    }),
    renew: async (receiptHandle) => {
      await sqs.send(new ChangeMessageVisibilityCommand({ QueueUrl: config.queueUrl, ReceiptHandle: receiptHandle, VisibilityTimeout: 60 }), { abortSignal: AbortSignal.timeout(3_000) });
    },
    observe: (code) => observe({ event: "telemetry.consumer", code }),
  }, abort.signal);
  return {
    ready,
    async close() {
      abort.abort();
      await active;
      sqs.destroy();
      await pool.end();
    },
  };
}
