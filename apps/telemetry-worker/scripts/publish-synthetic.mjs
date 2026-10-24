import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { syntheticTenants } from "@solis/database";

import { ingestionConfiguration } from "../src/ingestion-runtime-config.ts";

const root = new URL("../../../", import.meta.url);
const envFile = fileURLToPath(new URL(".env", root));
if (existsSync(envFile)) process.loadEnvFile(envFile);
if (process.env.ALLOW_SYNTHETIC_PUBLISH !== "true") throw new Error("ALLOW_SYNTHETIC_PUBLISH=true is required");
const config = ingestionConfiguration(process.env);
if (config === undefined) throw new Error("Enable the local synthetic ingestion configuration first");
const mode = process.argv[2] ?? "new";
if (!["new", "replay"].includes(mode)) throw new Error("Use new or replay");
const fixture = syntheticTenants[0];
const path = new URL("artifacts/synthetic-message.json", root);
let body;
if (mode === "replay") body = await readFile(path, "utf8");
else {
  body = JSON.stringify({
    schemaVersion: "1.0", messageId: randomUUID(), gatewayId: fixture.gatewayId,
    sessionId: randomUUID(), sequence: 1, sourceTime: new Date().toISOString(),
    clockStatus: "SYNCED", configVersion: 1,
    samples: [{ sampleIndex: 0, variableId: fixture.variableId, mappingId: fixture.mappingId,
      dataType: "FLOAT64", value: 101.3, unitCode: "kPa", quality: "GOOD", qualityDetail: "OK" }],
    mqtt_topic: `solis/v1/tenants/${fixture.tenantId}/gateways/${fixture.key}/telemetry`,
    mqtt_client_id: fixture.key, broker_timestamp: Date.now(),
  });
  await mkdir(new URL("artifacts/", root), { recursive: true });
  await writeFile(path, body);
}
const client = new SQSClient({ region: "sa-east-1", endpoint: config.endpoint,
  useQueueUrlAsEndpoint: false, credentials: { accessKeyId: "test", secretAccessKey: "test" }, maxAttempts: 1 });
try {
  await client.send(new SendMessageCommand({ QueueUrl: config.queueUrl, MessageBody: body }), { abortSignal: AbortSignal.timeout(3_000) });
  console.log(JSON.stringify({ event: "synthetic.localstack.published", mode, tenantId: fixture.tenantId, variableId: fixture.variableId, identityTested: false }));
} finally { client.destroy(); }
