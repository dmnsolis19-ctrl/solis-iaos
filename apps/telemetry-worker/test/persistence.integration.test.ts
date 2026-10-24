import { randomUUID } from "node:crypto";

import { migrateUp, seedSynthetic, syntheticTenants, withTenantTransaction } from "@solis/database";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFile } from "node:fs/promises";
import { Client } from "@solis/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTelemetryPersister } from "../src/persistence.js";
import { resolveTransportContext, type TelemetryEnvelope } from "../src/transport-context.js";

const suite = process.env.TEST_DATABASE === "true" ? describe : describe.skip;
suite("real PostgreSQL telemetry persistence", () => {
  const fixture = syntheticTenants[0]!;
  const messages: string[] = [];
  const closing: Promise<void>[] = [];
  const pool = {
    async connect() {
      const client = new Client({});
      await client.connect();
      await client.query("SET SESSION AUTHORIZATION solis_worker_runtime");
      return {
        query: (sql: string, values?: unknown[]) => client.query(sql, values),
        release: () => { closing.push(client.end()); },
      };
    },
  };
  const ajv = new Ajv2020({ strict: true, strictRequired: false });
  addFormats(ajv);
  let validate: ReturnType<typeof ajv.compile<TelemetryEnvelope>>;
  const persist = createTelemetryPersister({
    transaction: (tenantId, operation) => withTenantTransaction(pool, { tenantId, role: "solis_worker_runtime" }, operation),
    resolve: (body, findGateway) => resolveTransportContext(body, { findGateway, validateEnvelope: validate }),
  });
  function body(value: number, ageMs = 0) {
    const messageId = randomUUID(); messages.push(messageId);
    return {
      schemaVersion: "1.0", messageId, gatewayId: fixture.gatewayId, sessionId: fixture.gatewayId,
      sequence: 1, sourceTime: new Date(Date.now() - ageMs).toISOString(), clockStatus: "SYNCED", configVersion: 1,
      samples: [{ sampleIndex: 0, variableId: fixture.variableId, mappingId: fixture.mappingId, dataType: "FLOAT64", value, unitCode: "kPa", quality: "GOOD", qualityDetail: "OK" }],
      mqtt_topic: `solis/v1/tenants/${fixture.tenantId}/gateways/${fixture.key}/telemetry`, mqtt_client_id: fixture.key, broker_timestamp: Date.now(),
    };
  }
  beforeAll(async () => {
    await migrateUp({});
    await seedSynthetic({}, "worker-integration-user", { ...process.env, ALLOW_SYNTHETIC_SEED: "true" });
    const schema = JSON.parse(await readFile(new URL("../../../packages/contracts/mqtt/telemetry-envelope.v1.schema.json", import.meta.url), "utf8"));
    validate = ajv.compile<TelemetryEnvelope>(schema);
  });
  afterAll(async () => {
    await Promise.all(closing);
    const client = new Client({}); await client.connect();
    try {
      await client.query("DELETE FROM telemetry.latest_value WHERE tenant_id=$1 AND variable_id=$2 AND message_id=ANY($3::uuid[])", [fixture.tenantId, fixture.variableId, messages]);
      await client.query("DELETE FROM telemetry.sample WHERE tenant_id=$1 AND message_id=ANY($2::uuid[])", [fixture.tenantId, messages]);
      await client.query("DELETE FROM telemetry.ingested_message WHERE tenant_id=$1 AND message_id=ANY($2::uuid[])", [fixture.tenantId, messages]);
    } finally { await client.end(); }
  });
  it("commits once, rejects content conflicts and does not regress latest on late samples", async () => {
    const fresh = body(100);
    expect(await persist(JSON.stringify(fresh))).toBe("accepted");
    expect(await persist(JSON.stringify(fresh))).toBe("duplicate");
    const conflicting = structuredClone(fresh); conflicting.samples[0]!.value = 200;
    await expect(persist(JSON.stringify(conflicting))).rejects.toThrow("MESSAGE_ID_CONTENT_CONFLICT");
    const old = body(50, 60_000);
    expect(await persist(JSON.stringify(old))).toBe("accepted");
    const client = new Client({}); await client.connect();
    try {
      expect((await client.query("SELECT value_float64 FROM telemetry.latest_value WHERE tenant_id=$1 AND variable_id=$2", [fixture.tenantId, fixture.variableId])).rows[0]?.value_float64).toBe(100);
      expect((await client.query("SELECT count(*)::integer AS count FROM telemetry.sample WHERE tenant_id=$1 AND message_id=ANY($2::uuid[])", [fixture.tenantId, [fresh.messageId, old.messageId]])).rows[0]?.count).toBe(2);
    } finally { await client.end(); }
  });
  it("rejects an invalid batch without committing either samples or the message claim", async () => {
    const invalid = body(10);
    invalid.samples.push({ ...invalid.samples[0]!, sampleIndex: 1, mappingId: randomUUID() });
    await expect(persist(JSON.stringify(invalid))).rejects.toThrow("UNKNOWN_MAPPING");
    const client = new Client({}); await client.connect();
    try {
      expect((await client.query("SELECT 1 FROM telemetry.ingested_message WHERE tenant_id=$1 AND message_id=$2", [fixture.tenantId, invalid.messageId])).rows).toEqual([]);
      expect((await client.query("SELECT 1 FROM telemetry.sample WHERE tenant_id=$1 AND message_id=$2", [fixture.tenantId, invalid.messageId])).rows).toEqual([]);
    } finally { await client.end(); }
  });
});
