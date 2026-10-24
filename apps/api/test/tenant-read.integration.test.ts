import { Client, migrateUp, seedSynthetic, syntheticTenants, withTenantTransaction } from "@solis/database";
import { beforeAll, describe, expect, it } from "vitest";

import { createTenantReadApi } from "../src/tenant-read-api.js";

const suite = process.env.TEST_DATABASE === "true" ? describe : describe.skip;
suite("real PostgreSQL read API authorization", () => {
  const own = syntheticTenants[0]!;
  const other = syntheticTenants[1]!;
  const subject = "api-integration-user";
  const pool = {
    async connect() {
      const client = new Client({}); await client.connect();
      await client.query("SET SESSION AUTHORIZATION solis_api_runtime");
      return { query: (sql: string, values?: unknown[]) => client.query(sql, values), release: () => { void client.end(); } };
    },
  };
  const execute = createTenantReadApi({
    authenticate: async () => ({ subject, issuer: "synthetic-test" }),
    transaction: (tenantId, operation) => withTenantTransaction(pool, { tenantId, role: "solis_api_runtime" }, operation),
  });
  beforeAll(async () => {
    await migrateUp({});
    await seedSynthetic({}, subject, { ...process.env, ALLOW_SYNTHETIC_SEED: "true" });
  });
  it("returns only assigned sites and the authorized asset with typed variables", async () => {
    const sites = await execute({ operation: "listSites", tenantId: own.tenantId }) as { items: { id: string }[] };
    expect(sites.items.map((site) => site.id)).toEqual([own.siteId]);
    const asset = await execute({ operation: "getAsset", tenantId: own.tenantId, resourceId: own.assetId }) as { id: string; variables: { id: string }[] };
    expect(asset.id).toBe(own.assetId);
    expect(asset.variables.map((variable) => variable.id)).toEqual([own.variableId]);
  });
  it("denies another tenant and hides an asset belonging to that tenant", async () => {
    await expect(execute({ operation: "listSites", tenantId: other.tenantId })).rejects.toMatchObject({ status: 403 });
    await expect(execute({ operation: "getAsset", tenantId: own.tenantId, resourceId: other.assetId })).rejects.toMatchObject({ status: 404 });
    await expect(execute({ operation: "listAssets", tenantId: own.tenantId, resourceId: other.siteId })).rejects.toMatchObject({ status: 403 });
  });
  it("revocation applies to the next request with the same authenticated subject", async () => {
    const client = new Client({}); await client.connect();
    try {
      await client.query("UPDATE control_plane.membership SET status='REVOKED' WHERE tenant_id=$1 AND user_subject=$2", [own.tenantId, subject]);
      await expect(execute({ operation: "listSites", tenantId: own.tenantId })).rejects.toMatchObject({ status: 403 });
    } finally {
      await client.query("UPDATE control_plane.membership SET status='ACTIVE' WHERE tenant_id=$1 AND user_subject=$2", [own.tenantId, subject]);
      await client.end();
    }
  });
});
