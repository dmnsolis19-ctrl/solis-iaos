import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const stack = "infra/terraform/iot-readiness";
const requiredFiles = [
  `${stack}/versions.tf`,
  `${stack}/variables.tf`,
  `${stack}/locals.tf`,
  `${stack}/identity.tf`,
  `${stack}/queues.tf`,
  `${stack}/ingestion.tf`,
  `${stack}/outputs.tf`,
  `${stack}/readiness.tfvars.example`,
  `${stack}/README.md`,
  "docs/vertical-slice-v0.5/ADR-044-AWS-IOT-READINESS.md",
  "docs/vertical-slice-v0.5/ARCHITECTURE.md",
  "docs/vertical-slice-v0.5/SECURITY-GATE.md",
  "docs/vertical-slice-v0.5/LOCAL-RUNBOOK.md",
  "docs/vertical-slice-v0.5/RELEASE-NOTES.md",
];

await Promise.all(requiredFiles.map((file) => access(resolve(root, file))));

const contents = (
  await Promise.all(
    requiredFiles
      .filter((file) => file.startsWith(stack) && file.endsWith(".tf"))
      .map((file) => readFile(resolve(root, file), "utf8")),
  )
).join("\n");

for (const resource of [
  'resource "aws_iot_thing" "gateway"',
  'resource "aws_iot_policy" "gateway_publish_only"',
  'resource "aws_iot_topic_rule" "telemetry"',
  'resource "aws_sqs_queue" "telemetry"',
  'resource "aws_sqs_queue" "telemetry_dlq"',
]) {
  if (!contents.includes(resource)) throw new Error(`Missing readiness resource: ${resource}`);
}

if (!contents.includes("enabled     = var.enable_ingestion")) {
  throw new Error("AWS IoT Rule must be controlled by the deployment gate.");
}
if (!contents.includes("condition     = var.enable_ingestion == false")) {
  throw new Error("V0.5 must statically prevent enabling cloud ingestion.");
}
if (!contents.includes('actions   = ["sqs:SendMessage"]')) {
  throw new Error("IoT Rule role must be limited to SQS SendMessage.");
}
if (!contents.includes("sqs_managed_sse_enabled")) {
  throw new Error("Readiness queues must enable encryption at rest.");
}
if (/resource\s+"aws_iot_certificate"/u.test(contents)) {
  throw new Error("Terraform must not generate gateway private keys or certificates.");
}
if (/aws_iot_policy_attachment|aws_iot_thing_principal_attachment/u.test(contents)) {
  throw new Error("Certificate attachments require the external activation gate.");
}
if (/\b(command|control|setpoint)\b/iu.test(contents)) {
  throw new Error("Remote-control topics are forbidden in V0.5 Terraform.");
}
if (/access_key|secret_key|BEGIN (?:RSA |EC )?PRIVATE KEY/iu.test(contents)) {
  throw new Error("Possible static credential or private key in readiness Terraform.");
}

console.log(
  JSON.stringify({
    event: "aws-iot-readiness.static-check",
    version: "0.5.0",
    region: "sa-east-1",
    mqttContract: "v1-unchanged",
    gatewayPolicy: "publish-only",
    ingestionEnabled: false,
    queues: 2,
    certificatesManagedByTerraform: false,
    deploymentPerformed: false,
  }),
);
