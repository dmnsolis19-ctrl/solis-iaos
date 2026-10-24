import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { createTelemetryPersister, envelopeHash } from "../../apps/telemetry-worker/src/persistence.ts";
import { resolveTransportContext } from "../../apps/telemetry-worker/src/transport-context.ts";
import { ingestionConfiguration } from "../../apps/telemetry-worker/src/ingestion-runtime-config.ts";

const valid = JSON.parse(await readFile(new URL("../../packages/contracts/examples/telemetry-valid.json", import.meta.url), "utf8"));
const now = Date.parse("2026-10-24T20:00:00Z");
const tenantId = "018f47d2-f8a1-7c42-8e02-e8f1a2f4bf76";
const siteId = "11111111-1111-4111-8111-111111111111";
const key = "synthetic-gateway";
function fixture({ patch = {}, mappingPatch = {}, duplicate = false, conflict = false, missingMapping = false, failWrite = false } = {}) {
  const envelope = { ...structuredClone(valid), sourceTime: new Date(now).toISOString(), samples: [structuredClone(valid.samples[0])], ...patch };
  const sample = envelope.samples[0];
  const gateway = { id: envelope.gatewayId, tenantId, siteId, topicKey: key, clientId: key, lifecycleState: "ACTIVE", activeConfigVersion: envelope.configVersion };
  const mapping = { id: sample.mappingId.toLowerCase(), variable_id: sample.variableId.toLowerCase(), data_type: sample.dataType, variable_type: sample.dataType, unit_code: sample.unitCode ?? "kPa", variable_unit: sample.unitCode ?? "kPa", enabled: true, variable_status: "ACTIVE", asset_status: "ACTIVE", site_status: "ACTIVE", site_id: siteId, ...mappingPatch };
  const calls = [];
  const transactions = [];
  const connection = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes("FROM connectivity.gateway")) return { rows: [gateway] };
      if (sql.includes("FROM connectivity.signal_mapping")) return { rows: missingMapping ? [] : [mapping] };
      if (sql.includes("INSERT INTO telemetry.ingested_message")) return { rows: duplicate ? [] : [{ message_id: envelope.messageId }] };
      if (sql.includes("SELECT payload_sha256")) return { rows: [{ payload_sha256: conflict ? "different" : envelopeHash(envelope) }] };
      if (failWrite && sql.includes("INSERT INTO telemetry.sample")) throw new Error("DATABASE_UNAVAILABLE");
      return { rows: [] };
    },
    release() {},
  };
  const persist = createTelemetryPersister({
    transaction: async (tenant, operation) => {
      transactions.push(["begin", tenant]);
      try { const result = await operation(connection); transactions.push(["commit"]); return result; }
      catch (error) { transactions.push(["rollback"]); throw error; }
    },
    resolve: (body, findGateway) => resolveTransportContext(body, { findGateway, validateEnvelope: () => true }),
    now: () => now,
  });
  const body = JSON.stringify({ ...envelope, mqtt_topic: `solis/v1/tenants/${tenantId}/gateways/${key}/telemetry`, mqtt_client_id: key, broker_timestamp: now });
  return { persist, body, envelope, calls, transactions };
}

test("persists a validated batch, idempotency claim and latest value in one transaction", async () => {
  const f = fixture();
  assert.equal(await f.persist(f.body), "accepted");
  assert.deepEqual(f.transactions, [["begin", tenantId], ["commit"]]);
  const writes = f.calls.filter((call) => call.sql.includes("INSERT INTO"));
  assert.equal(writes.length, 3);
  assert.ok(writes[0].sql.includes("ingested_message"));
  assert.ok(writes[1].sql.includes("jsonb_to_recordset"));
  assert.ok(writes[2].sql.includes("ON CONFLICT"));
  const samples = JSON.parse(writes[1].values[0]);
  assert.equal(samples[0].tenant_id, tenantId);
  assert.equal(samples[0].site_id, siteId);
});

test("a missing mapping rejects the complete batch before any write", async () => {
  const f = fixture({ missingMapping: true });
  await assert.rejects(f.persist(f.body), /UNKNOWN_MAPPING/);
  assert.ok(!f.calls.some((call) => call.sql.includes("INSERT INTO")));
  assert.deepEqual(f.transactions.at(-1), ["rollback"]);
});

for (const mappingPatch of [
  { enabled: false }, { variable_id: tenantId }, { variable_type: "STRING" },
  { variable_status: "INACTIVE" }, { asset_status: "RETIRED" }, { site_status: "INACTIVE" },
  { site_id: tenantId }, { variable_unit: "wrong-unit" },
]) {
  test(`rejects invalid or cross-resource mapping: ${JSON.stringify(mappingPatch)}`, async () => {
    const f = fixture({ mappingPatch });
    await assert.rejects(f.persist(f.body), /MAPPING_MISMATCH/);
    assert.ok(!f.calls.some((call) => call.sql.includes("INSERT INTO")));
  });
}

test("duplicate messages with the same content produce no second sample/latest write", async () => {
  const f = fixture({ duplicate: true });
  assert.equal(await f.persist(f.body), "duplicate");
  assert.ok(!f.calls.some((call) => call.sql.includes("INSERT INTO telemetry.sample")));
});
test("reuse of message ID with different content fails instead of silently discarding data", async () => {
  const f = fixture({ duplicate: true, conflict: true });
  await assert.rejects(f.persist(f.body), /MESSAGE_ID_CONTENT_CONFLICT/);
  assert.deepEqual(f.transactions.at(-1), ["rollback"]);
});
test("database failure cannot commit the idempotency claim", async () => {
  const f = fixture({ failWrite: true });
  await assert.rejects(f.persist(f.body), /DATABASE_UNAVAILABLE/);
  assert.deepEqual(f.transactions.at(-1), ["rollback"]);
  assert.ok(!f.calls.some((call) => call.sql.includes("INSERT INTO telemetry.latest_value")));
});
test("duplicate sample indices reject the entire envelope", async () => {
  const original = fixture().envelope;
  const f = fixture({ patch: { samples: [original.samples[0], original.samples[0]] } });
  await assert.rejects(f.persist(f.body), /DUPLICATE_SAMPLE_INDEX/);
  assert.ok(!f.calls.some((call) => call.sql.includes("INSERT INTO")));
});

for (const sourceTime of [new Date(now + 300_001).toISOString(), new Date(now - 172_800_001).toISOString()]) {
  test(`rejects source time outside the local synthetic capacity window: ${sourceTime}`, async () => {
    const f = fixture({ patch: { sourceTime } });
    await assert.rejects(f.persist(f.body), /SOURCE_TIME_OUTSIDE_WINDOW/);
  });
}

test("INT64 overflow is rejected before PostgreSQL receives the batch", async () => {
  const original = fixture().envelope.samples[0];
  const f = fixture({ patch: { samples: [{ ...original, dataType: "INT64", value: "9223372036854775808" }] } });
  await assert.rejects(f.persist(f.body), /INT64_OUT_OF_RANGE/);
});

test("payload hashes are stable across JSON object and sample ordering", () => {
  const envelope = fixture().envelope;
  const reversed = Object.fromEntries(Object.entries(envelope).reverse());
  assert.equal(envelopeHash(envelope), envelopeHash(reversed));
  assert.notEqual(envelopeHash(envelope), envelopeHash({ ...envelope, sequence: envelope.sequence + 1 }));
  const multiple = { ...envelope, samples: [envelope.samples[0], { ...envelope.samples[0], sampleIndex: 1 }] };
  assert.equal(envelopeHash(multiple), envelopeHash({ ...multiple, samples: [...multiple.samples].reverse() }));
});

test("ingestion is disabled by default, gated to local/test and bound to LocalStack", () => {
  assert.equal(ingestionConfiguration({}), undefined);
  assert.throws(() => ingestionConfiguration({ SOLIS_INGESTION_ENABLED: "true", NODE_ENV: "production" }), /LOCAL_GATE/);
  const config = { SOLIS_INGESTION_ENABLED: "true", DATABASE_URL: "postgresql://worker_login:local@localhost/solis_iaos", SQS_ENDPOINT: "http://localhost:4566", SQS_QUEUE_URL: "http://localhost:4566/000000000000/telemetry" };
  assert.equal(ingestionConfiguration(config).endpoint, config.SQS_ENDPOINT);
  assert.throws(() => ingestionConfiguration({ ...config, SQS_QUEUE_URL: "https://sqs.sa-east-1.amazonaws.com/123/telemetry" }), /INVALID_LOCAL/);
});
