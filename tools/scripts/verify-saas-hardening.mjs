import { spawnSync } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const tests = (await readdir(resolve(root, "tools/tests")))
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => `tools/tests/${name}`);
const commands = [
  ["--test", "--test-reporter=tap", ...tests],
  ["tools/scripts/check-contract-sync.mjs"],
  ["tools/scripts/check-schema-sync.mjs"],
  ["tools/scripts/check-rls-sql.mjs"],
  ["tools/scripts/check-mvp.mjs"],
  ["tools/scripts/check-aws-iot-readiness.mjs"],
];
const results = [];
for (const args of commands) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 60_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  const passed = result.status === 0 && result.error === undefined;
  results.push({
    args,
    status: passed ? "PASS" : "FAIL",
    exitCode: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    ...(result.error === undefined ? {} : { error: result.error.message }),
  });
  console.log(`${passed ? "PASS" : "FAIL"}: node ${args.join(" ")}`);
}
const report = {
  version: "0.8.0",
  executedAt: new Date().toISOString(),
  nodeVersion: process.version,
  scope: "local-behavior-and-static-contract-checks",
  verdict: results.every((result) => result.status === "PASS") ? "PASS" : "FAIL",
  productReady: false,
  notRun: [
    "workspace-format-lint-typecheck-build-and-security",
    "real-postgresql-rls-integration",
    "terraform-provider-validation-and-plan",
    "full-sprint0b-and-staging",
    "live-cognito-and-provider-security-review",
    "sdk-localstack-postgresql-end-to-end",
  ],
  results,
};
const destination = resolve(root, "artifacts/saas-v0.8");
await mkdir(destination, { recursive: true });
await writeFile(resolve(destination, "verification.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Scope: ${report.scope}. Product readiness has NOT been certified.`);
console.log("Report: artifacts/saas-v0.8/verification.json");
if (report.verdict !== "PASS") process.exitCode = 1;
