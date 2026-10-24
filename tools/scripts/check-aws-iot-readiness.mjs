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
  "docs/vertical-slice-v0.6/ADR-045-AWS-SANDBOX.md",
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
if (!contents.includes('variable "ingestion_activation_approved"')) {
  throw new Error("V0.6 must declare the independent activation approval gate.");
}
if (!contents.includes("var.ingestion_activation_approved == true")) {
  throw new Error("Cloud ingestion must require explicit V0.6 approval.");
}
if (!contents.includes('actions   = ["sqs:SendMessage"]')) {
  throw new Error("IoT Rule role must be limited to SQS SendMessage.");
}
if (!/error_action\s*\{\s*sqs\s*\{/u.test(contents)) {
  throw new Error("AWS IoT must preserve action failures in the existing DLQ.");
}
if (!contents.includes("aws:SourceAccount") || !contents.includes("aws:SourceArn")) {
  throw new Error("The IoT Rule trust policy must be scoped to its account and rule.");
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
    version: "0.7.0",
    region: "sa-east-1",
    mqttContract: "v1-unchanged",
    gatewayPolicy: "publish-only",
    ingestionEnabledByDefault: false,
    activationApprovalRequired: true,
    queues: 2,
    iotErrorAction: "existing-dlq",
    roleTrustScopedToRule: true,
    certificatesManagedByTerraform: false,
    runtimeStateEvaluated: false,
  }),
);
