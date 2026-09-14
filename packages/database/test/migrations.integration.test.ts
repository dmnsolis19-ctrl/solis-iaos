import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { migrateUp, migrationStatus } from "../src/index.js";

const hasDatabase = process.env.TEST_DATABASE === "true";
const describeWithDatabase = hasDatabase ? describe : describe.skip;

describeWithDatabase("PostgreSQL V1.2 migrations and RLS", () => {
  const config = {};
  const tenantA = "018f47d2-f8a1-7c42-8e02-e8f1a2f4bf76";
  const tenantB = "018f47d2-f8a1-7c42-8e02-e8f1a2f4bf77";
  const spoofTenant = "018f47d2-f8a1-7c42-8e02-e8f1a2f4bf78";

  beforeAll(async () => {
    await migrateUp(config);
    const client = new Client(config);
    await client.connect();
    await client.query(
      `INSERT INTO control_plane.tenant (id, code, name, status)
       VALUES ($1, 'TENANT_A', 'Tenant A', 'ACTIVE'), ($2, 'TENANT_B', 'Tenant B', 'ACTIVE')
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [tenantA, tenantB],
    );
    await client.end();
  });

  afterAll(async () => {
    const client = new Client(config);
    await client.connect();
    await client.query("DELETE FROM control_plane.tenant WHERE id = ANY($1::uuid[])", [
      [tenantA, tenantB, spoofTenant],
    ]);
    await client.end();
  });

  it("is idempotent and keeps migration checksums synchronized", async () => {
    expect(await migrateUp(config)).toEqual([]);
    const status = await migrationStatus(config);

    expect(status).toHaveLength(2);
    expect(status.every((migration) => migration.applied)).toBe(true);
    expect(status.every((migration) => migration.appliedChecksum === migration.checksum)).toBe(
      true,
    );
  });

  it("enables, forces and policies RLS on every tenant-owned table", async () => {
    const client = new Client(config);
    await client.connect();
    const result = await client.query<{
      schema_name: string;
      table_name: string;
      relrowsecurity: boolean;
      relforcerowsecurity: boolean;
      policy_count: string;
    }>(`
      SELECT n.nspname AS schema_name,
             c.relname AS table_name,
             c.relrowsecurity,
             c.relforcerowsecurity,
             count(p.polname)::text AS policy_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN information_schema.columns col
        ON col.table_schema = n.nspname
       AND col.table_name = c.relname
       AND col.column_name = 'tenant_id'
      LEFT JOIN pg_policy p ON p.polrelid = c.oid
      WHERE c.relkind IN ('r', 'p')
        AND n.nspname IN (
          'platform', 'control_plane', 'asset_core', 'connectivity',
          'telemetry', 'operations', 'audit'
        )
        AND (
          col.column_name IS NOT NULL
          OR (n.nspname = 'control_plane' AND c.relname = 'tenant')
        )
      GROUP BY n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity
      ORDER BY n.nspname, c.relname
    `);
    await client.end();

    expect(result.rows.length).toBeGreaterThan(20);
    expect(result.rows.every((row) => row.relrowsecurity && row.relforcerowsecurity)).toBe(true);
    expect(result.rows.every((row) => Number(row.policy_count) >= 1)).toBe(true);
  });

  it("does not allow runtime roles to bypass RLS", async () => {
    const client = new Client(config);
    await client.connect();
    const result = await client.query<{
      rolname: string;
      rolsuper: boolean;
      rolbypassrls: boolean;
    }>(`
      SELECT rolname, rolsuper, rolbypassrls
      FROM pg_roles
      WHERE rolname IN ('solis_api_runtime', 'solis_worker_runtime', 'solis_readonly_runtime')
      ORDER BY rolname
    `);
    await client.end();

    expect(result.rows).toHaveLength(3);
    expect(result.rows.every((role) => !role.rolsuper && !role.rolbypassrls)).toBe(true);
  });

  it("isolates two tenants and clears transaction-local context", async () => {
    const client = new Client(config);
    await client.connect();
    try {
      await client.query("SET ROLE solis_api_runtime");
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantA]);
      const tenantAResult = await client.query<{ id: string }>(
        "SELECT id FROM control_plane.tenant",
      );
      await client.query("COMMIT");

      const noContextResult = await client.query<{ id: string }>(
        "SELECT id FROM control_plane.tenant",
      );

      expect(tenantAResult.rows.map((row) => row.id)).toEqual([tenantA]);
      expect(noContextResult.rows).toEqual([]);
    } finally {
      await client.query("ROLLBACK").catch(() => undefined);
      await client.query("RESET ROLE").catch(() => undefined);
      await client.end();
    }
  });

  it("blocks cross-tenant insert, update and delete attempts", async () => {
    const client = new Client(config);
    await client.connect();
    try {
      await client.query("SET ROLE solis_api_runtime");
      await client.query("SELECT set_config('app.tenant_id', $1, false)", [tenantA]);

      await expect(
        client.query(
          `INSERT INTO control_plane.tenant (id, code, name, status)
           VALUES ($1, 'TENANT_SPOOF', 'Tenant Spoof', 'ACTIVE')`,
          [spoofTenant],
        ),
      ).rejects.toMatchObject({ code: "42501" });

      const updateResult = await client.query(
        "UPDATE control_plane.tenant SET name = 'Compromised' WHERE id = $1",
        [tenantB],
      );
      const deleteResult = await client.query("DELETE FROM control_plane.tenant WHERE id = $1", [
        tenantB,
      ]);

      expect(updateResult.rowCount).toBe(0);
      expect(deleteResult.rowCount).toBe(0);
    } finally {
      await client.query("RESET ROLE").catch(() => undefined);
      await client.end();
    }

    const owner = new Client(config);
    await owner.connect();
    const preserved = await owner.query<{ name: string }>(
      "SELECT name FROM control_plane.tenant WHERE id = $1",
      [tenantB],
    );
    await owner.end();
    expect(preserved.rows).toEqual([{ name: "Tenant B" }]);
  });
});
