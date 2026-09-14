import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

async function digest(path) {
  return createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
}

const pairs = [
  [
    join(root, "docs", "baseline-v1.2", "05_CONTRACTS", "openapi-v1.yaml"),
    join(root, "packages", "contracts", "openapi", "openapi-v1.yaml"),
  ],
];

const canonicalMqtt = join(root, "docs", "baseline-v1.2", "05_CONTRACTS", "mqtt");
const packageMqtt = join(root, "packages", "contracts", "mqtt");
for (const file of (await readdir(canonicalMqtt)).filter((name) => name.endsWith(".json")).sort()) {
  pairs.push([join(canonicalMqtt, file), join(packageMqtt, file)]);
}

const mismatches = [];
for (const [canonical, packaged] of pairs) {
  if ((await digest(canonical)) !== (await digest(packaged))) {
    mismatches.push(basename(canonical));
  }
}

if (mismatches.length > 0) {
  throw new Error(`Contract copies diverge from Baseline V1.2: ${mismatches.join(", ")}`);
}

console.log(JSON.stringify({ event: "contracts.compatible", compared: pairs.length }));
