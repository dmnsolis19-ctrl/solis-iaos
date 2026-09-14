import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const migrationPath = resolve("packages/database/migrations/0001_schema_v1.up.sql");
const rolesPath = resolve("packages/database/migrations/0002_runtime_roles.up.sql");
const schemaSql = await readFile(migrationPath, "utf8");
const rolesSql = await readFile(rolesPath, "utf8");
const tablePattern =
  /CREATE TABLE\s+([a-z_]+\.[a-z_]+)\s*\(([\s\S]*?)\)\s*(?:PARTITION BY\s+[^;]+)?;/giu;
const tenantTables = [];

for (const match of schemaSql.matchAll(tablePattern)) {
  const [, table, body] = match;
  if (body.includes("tenant_id") || table === "control_plane.tenant") {
    tenantTables.push(table);
  }
}

if (tenantTables.length < 20) {
  throw new Error(`Expected at least 20 tenant-owned tables; found ${tenantTables.length}.`);
}

for (const table of tenantTables) {
  const requiredStatements = [
    `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;`,
    `CREATE POLICY tenant_isolation ON ${table}`,
  ];
  for (const statement of requiredStatements) {
    if (!schemaSql.includes(statement)) {
      throw new Error(`Missing RLS control for ${table}: ${statement}`);
    }
  }
}

const runtimeRoles = ["solis_api_runtime", "solis_worker_runtime", "solis_readonly_runtime"];
for (const role of runtimeRoles) {
  const rolePattern = new RegExp(
    `CREATE ROLE\\s+${role}\\s+NOLOGIN\\s+NOSUPERUSER\\s+NOCREATEDB\\s+NOCREATEROLE\\s+NOINHERIT\\s+NOBYPASSRLS`,
    "u",
  );
  if (!rolePattern.test(rolesSql)) {
    throw new Error(`${role} is missing the required non-privileged attributes.`);
  }
}

process.stdout.write(
  `${JSON.stringify({
    event: "database.rls-static-validated",
    tenantTables: tenantTables.length,
    runtimeRoles: runtimeRoles.length,
  })}\n`,
);
