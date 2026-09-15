import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const requiredFiles = [
  ".env.mvp.example",
  "infra/mvp/compose.yaml",
  "infra/mvp/mosquitto/Dockerfile",
  "infra/mvp/mosquitto/mosquitto.conf",
  "infra/mvp/mosquitto/entrypoint.sh",
  "infra/mvp/node-red/Dockerfile",
  "infra/mvp/node-red/settings.js",
  "infra/mvp/node-red/flows.json",
  "infra/mvp/gateway-simulator/Dockerfile",
  "infra/mvp/gateway-simulator/publish-telemetry.sh",
  "docs/vertical-slice-v0.4/ADR-043-VENDOR-NEUTRAL-GATEWAY-LAB.md",
  "docs/vertical-slice-v0.4/GATEWAY-CONTRACT.md",
  "docs/vertical-slice-v0.4/profiles/gateway-profiles.json",
  "docs/vertical-slice-v0.4/profiles/water-process-signals.json",
  "infra/mvp/grafana/provisioning/datasources/influxdb.yaml",
  "infra/mvp/grafana/provisioning/dashboards/dashboards.yaml",
  "infra/mvp/grafana/dashboards/solis-telemetry.json",
  "scripts/mvp-start.ps1",
  "scripts/mvp-smoke.ps1",
  "scripts/mvp-stop.ps1",
];

await Promise.all(requiredFiles.map((file) => access(resolve(root, file))));

const compose = await readFile(resolve(root, "infra/mvp/compose.yaml"), "utf8");
for (const service of ["mqtt", "influxdb", "node-red", "grafana", "simulator"]) {
  if (!new RegExp(`^  ${service}:`, "mu").test(compose)) {
    throw new Error(`Compose service is missing: ${service}`);
  }
}
if (/image:\s*\S*:latest(?:\s|$)/u.test(compose)) {
  throw new Error("MVP Compose must not use the latest image tag.");
}
if (!compose.includes('"${MQTT_PORT:-1883}:1884"')) {
  throw new Error("Authenticated gateway MQTT listener is not published.");
}
for (const localOnlyPort of ["INFLUXDB_PORT", "NODE_RED_PORT", "GRAFANA_PORT"]) {
  if (!compose.includes(`127.0.0.1:\${${localOnlyPort}`)) {
    throw new Error(`${localOnlyPort} must bind to localhost.`);
  }
}

const flows = JSON.parse(await readFile(resolve(root, "infra/mvp/node-red/flows.json"), "utf8"));
const transform = flows.find((node) => node.id === "fn-validate-transform");
if (transform?.type !== "function" || typeof transform.func !== "string") {
  throw new Error("Node-RED validation function is missing.");
}

const simulator = await readFile(
  resolve(root, "infra/mvp/gateway-simulator/publish-telemetry.sh"),
  "utf8",
);
if ((simulator.match(/\\"sampleIndex\\":/gu) ?? []).length !== 10) {
  throw new Error("Gateway laboratory simulator must publish ten samples.");
}
if (!simulator.includes('status_topic="solis/v1/tenants/')) {
  throw new Error("Gateway laboratory simulator must publish status heartbeats.");
}

const statusTransform = flows.find((node) => node.id === "fn-validate-status");
if (statusTransform?.type !== "function" || typeof statusTransform.func !== "string") {
  throw new Error("Node-RED gateway status validation function is missing.");
}

const executeTransform = new Function("msg", "env", "node", "Buffer", transform.func);
const environment = {
  get(name) {
    return {
      INFLUXDB_ORG: "solis",
      INFLUXDB_BUCKET: "solis_telemetry",
      INFLUXDB_ADMIN_TOKEN: "test-token",
    }[name];
  },
};
const node = { status() {}, warn() {} };
const validPayload = JSON.parse(
  await readFile(resolve(root, "packages/contracts/examples/telemetry-valid.json"), "utf8"),
);
const topic =
  `solis/v1/tenants/018f47d2-f8a1-7c42-8e02-e8f1a2f4bf76/gateways/` +
  `${validPayload.gatewayId}/telemetry`;
const validResult = executeTransform({ topic, payload: validPayload }, environment, node, Buffer);
if (validResult[0]?.payload?.includes("telemetry,tenant_id=") !== true || validResult[1] !== null) {
  throw new Error("A valid contract payload was not routed to telemetry.");
}

const invalidResult = executeTransform(
  { topic, payload: { invalid: true } },
  environment,
  node,
  Buffer,
);
if (
  invalidResult[0] !== null ||
  invalidResult[1]?.payload?.includes("ingestion_rejection") !== true
) {
  throw new Error("An invalid contract payload was not routed to rejection storage.");
}

const executeStatus = new Function("msg", "env", "node", "Buffer", statusTransform.func);
const validStatus = executeStatus(
  {
    topic: `solis/v1/tenants/018f47d2-f8a1-7c42-8e02-e8f1a2f4bf76/gateways/${validPayload.gatewayId}/status`,
    payload: {
      schemaVersion: "1.0",
      messageId: "10000000-0000-4000-8000-000000000001",
      gatewayId: validPayload.gatewayId,
      state: "ONLINE",
      occurredAt: "2026-09-14T00:00:00Z",
    },
  },
  environment,
  node,
  Buffer,
);
if (validStatus?.payload?.includes("gateway_status,tenant_id=") !== true) {
  throw new Error("A valid gateway heartbeat was not routed to status storage.");
}

const profiles = JSON.parse(
  await readFile(resolve(root, "docs/vertical-slice-v0.4/profiles/gateway-profiles.json"), "utf8"),
);
const requiredProfiles = [
  "wecon-h-ag",
  "siemens-s7",
  "mitsubishi-fx5u",
  "schneider-modicon",
  "allen-bradley",
  "generic-mqtt",
];
for (const profileId of requiredProfiles) {
  if (
    !profiles.profiles?.some(
      (profile) => profile.id === profileId && profile.certificationStatus === "UNVERIFIED",
    )
  ) {
    throw new Error(`Missing unverified gateway profile: ${profileId}`);
  }
}

const signalProfile = JSON.parse(
  await readFile(
    resolve(root, "docs/vertical-slice-v0.4/profiles/water-process-signals.json"),
    "utf8",
  ),
);
if (
  signalProfile.signals?.length !== 10 ||
  new Set(signalProfile.signals.map((signal) => signal.variableId)).size !== 10
) {
  throw new Error("Water process profile must contain ten unique signals.");
}

const dashboard = JSON.parse(
  await readFile(resolve(root, "infra/mvp/grafana/dashboards/solis-telemetry.json"), "utf8"),
);
if (dashboard.uid !== "solis-gateway-lab-v040" || dashboard.panels?.length < 9) {
  throw new Error("Provisioned Grafana dashboard is incomplete.");
}

console.log(
  JSON.stringify({
    event: "mvp.static-check",
    version: "0.4.0",
    services: 5,
    nodeRedPositiveRoute: "passed",
    nodeRedNegativeRoute: "passed",
    gatewayHeartbeatRoute: "passed",
    gatewayProfiles: profiles.profiles.length,
    processSignals: signalProfile.signals.length,
    grafanaPanels: dashboard.panels.length,
  }),
);
