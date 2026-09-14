import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const baseline = await readFile("docs/baseline-v1.2/06_DATA/schema-v1.sql");
const migration = await readFile("packages/database/migrations/0001_schema_v1.up.sql");
const digest = (value) => createHash("sha256").update(value).digest("hex");

const baselineDigest = digest(baseline);
const migrationDigest = digest(migration);

if (baselineDigest !== migrationDigest) {
  throw new Error(
    "Migration 0001 diverges from Baseline V1.2. Update the baseline deliberately before changing it.",
  );
}

process.stdout.write(
  `${JSON.stringify({
    event: "database.schema-synchronized",
    sha256: baselineDigest,
  })}\n`,
);
