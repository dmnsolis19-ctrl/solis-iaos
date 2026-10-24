import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { resolveTransportContext } from "../../apps/telemetry-worker/src/transport-context.ts";

const envelope = JSON.parse(
  await readFile(
    new URL("../../packages/contracts/examples/telemetry-valid.json", import.meta.url),
    "utf8",
  ),
);
const tenantId = "018f47d2-f8a1-7c42-8e02-e8f1a2f4bf76";
const otherTenant = "018f47d2-f8a1-7c42-8e02-e8f1a2f4bf77";
const topicKey = "solis-gw-lab-001";
const topic = `solis/v1/tenants/${tenantId}/gateways/${topicKey}/telemetry`;
const gateway = {
  id: envelope.gatewayId,
  tenantId,
  topicKey,
  clientId: topicKey,
  lifecycleState: "ACTIVE",
  activeConfigVersion: envelope.configVersion,
};

function fixture({ patch = {}, identity = gateway, valid = true } = {}) {
  const lookups = [];
  const validations = [];
  const body = JSON.stringify({
    ...structuredClone(envelope),
    mqtt_topic: topic,
    mqtt_client_id: topicKey,
    broker_timestamp: 1_790_000_000_000,
    ...patch,
  });
  const ports = {
    async findGateway(...args) {
      lookups.push(args);
      return identity;
    },
    // Boundary tests inject this port. Full JSON Schema validation remains a separate gate.
    validateEnvelope(candidate) {
      validations.push(candidate);
      return valid;
    },
  };
  return { body, ports, lookups, validations };
}

test("resolves tenant and internal gateway ID from the identity registry", async () => {
  const f = fixture();
  const result = await resolveTransportContext(f.body, f.ports);
  assert.equal(result.tenantId, tenantId);
  assert.equal(result.gatewayId, gateway.id);
  assert.deepEqual(f.lookups, [[tenantId, topicKey]]);
  assert.deepEqual(f.validations, [envelope]);
  assert.equal(result.brokerTime, new Date(1_790_000_000_000).toISOString());
});

for (const patch of [
  { mqtt_topic: undefined },
  { mqtt_client_id: undefined },
  { mqtt_client_id: "" },
  { mqtt_client_id: "x".repeat(129) },
  { broker_timestamp: undefined },
  { broker_timestamp: "1790000000000" },
  { broker_timestamp: -1 },
  { broker_timestamp: 1.5 },
  { broker_timestamp: 8_640_000_000_000_001 },
]) {
  test(`rejects invalid transport metadata: ${JSON.stringify(patch)}`, async () => {
    const f = fixture({ patch });
    await assert.rejects(resolveTransportContext(f.body, f.ports), /INVALID_TRANSPORT/);
    assert.equal(f.lookups.length, 0);
  });
}

for (const badTopic of [
  topic.replace("/telemetry", "/status"),
  topic.replace(topicKey, "+"),
  topic.replace(topicKey, "#"),
  `${topic}/extra`,
  topic.replace("/tenants/", "/tenant/"),
  topic.replace("solis/v1", "SOLIS/v1"),
]) {
  test(`rejects a non-telemetry or wildcard topic: ${badTopic.split("/").at(-1)}`, async () => {
    const f = fixture({ patch: { mqtt_topic: badTopic } });
    await assert.rejects(resolveTransportContext(f.body, f.ports), /INVALID_TELEMETRY_TOPIC/);
  });
}

test("requires the canonical schema validation port to accept the envelope", async () => {
  const f = fixture({ valid: false });
  await assert.rejects(resolveTransportContext(f.body, f.ports), /INVALID_ENVELOPE/);
  assert.equal(f.lookups.length, 0);
});

for (const identity of [
  null,
  { ...gateway, tenantId: otherTenant },
  { ...gateway, id: "other" },
  { ...gateway, clientId: "spoofed" },
  { ...gateway, topicKey: "other" },
]) {
  test(`rejects unknown or conflicting gateway identity: ${JSON.stringify(identity)}`, async () => {
    const f = fixture({ identity: identity ?? undefined });
    // Set explicitly because fixture defaults only apply to absent values.
    f.ports.findGateway = async () => identity ?? undefined;
    await assert.rejects(resolveTransportContext(f.body, f.ports), /GATEWAY_IDENTITY_MISMATCH/);
  });
}

test("rejects a payload that claims another registered gateway", async () => {
  const f = fixture({ patch: { gatewayId: otherTenant } });
  await assert.rejects(resolveTransportContext(f.body, f.ports), /GATEWAY_IDENTITY_MISMATCH/);
});

for (const state of ["REGISTERED", "SUSPENDED", "REVOKED", "RETIRED"]) {
  test(`rejects non-active gateways: ${state}`, async () => {
    const f = fixture({ identity: { ...gateway, lifecycleState: state } });
    await assert.rejects(resolveTransportContext(f.body, f.ports), /GATEWAY_NOT_ACTIVE/);
  });
}

test("rejects an unconfirmed configuration version", async () => {
  const f = fixture({ identity: { ...gateway, activeConfigVersion: null } });
  await assert.rejects(resolveTransportContext(f.body, f.ports), /CONFIG_VERSION_MISMATCH/);
});

test("rejects sequence numbers already rounded by JSON parsing", async () => {
  const f = fixture({ patch: { sequence: 9_007_199_254_740_992 } });
  await assert.rejects(resolveTransportContext(f.body, f.ports), /UNSAFE_SEQUENCE/);
});

for (const malformed of ["{", "null", "[]", '"string"', "9"]) {
  test(`rejects malformed or non-object bodies: ${malformed}`, async () => {
    const f = fixture();
    await assert.rejects(resolveTransportContext(malformed, f.ports));
  });
}

test("enforces the transport byte limit before parsing JSON", async () => {
  const f = fixture();
  await assert.rejects(resolveTransportContext("é".repeat(131_073), f.ports), /MESSAGE_TOO_LARGE/);
});
