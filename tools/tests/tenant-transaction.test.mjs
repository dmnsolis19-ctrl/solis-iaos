import assert from "node:assert/strict";
import { test } from "node:test";

import { withTenantTransaction } from "../../packages/database/src/tenant-transaction.ts";

const tenantId = "018f47d2-f8a1-7c42-8e02-e8f1a2f4bf76";
const otherTenant = "018f47d2-f8a1-7c42-8e02-e8f1a2f4bf77";
const options = { tenantId, role: "solis_api_runtime" };

function fixture({ fail, session, effective } = {}) {
  const calls = [];
  const releases = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (fail?.(sql)) throw new Error("SIMULATED_DATABASE_FAILURE");
      if (sql.includes("rolname = session_user")) {
        return { rows: session ?? [{ rolsuper: false, rolbypassrls: false }] };
      }
      if (sql.includes("rolname = current_user")) {
        return {
          rows: effective ?? [
            { role_name: options.role, rolsuper: false, rolbypassrls: false },
          ],
        };
      }
      return { rows: [] };
    },
    release(destroy) {
      releases.push(destroy);
    },
  };
  const pool = {
    async connect() {
      return client;
    },
  };
  return { calls, releases, pool, client };
}

test("sets role and tenant locally before business SQL and commits on success", async () => {
  const f = fixture();
  const result = await withTenantTransaction(f.pool, options, async (client) => {
    await client.query("BUSINESS_QUERY", [tenantId]);
    return 42;
  });
  assert.equal(result, 42);
  const sql = f.calls.map((call) => call.sql);
  assert.ok(sql.indexOf("BEGIN") < sql.indexOf("SET LOCAL ROLE solis_api_runtime"));
  const context = f.calls.findIndex((call) => call.sql.includes("set_config('app.tenant_id'"));
  assert.deepEqual(f.calls[context].values, [tenantId, "10000"]);
  assert.ok(f.calls[context].sql.includes("$1, true"));
  assert.ok(context < sql.indexOf("BUSINESS_QUERY"));
  assert.equal(sql.at(-1), "COMMIT");
  assert.deepEqual(f.releases, [false]);
});

for (const invalid of ["", "tenant-a", `${tenantId}'; DROP TABLE control_plane.tenant; --`]) {
  test(`rejects invalid tenant context: ${invalid.slice(0, 12)}`, async () => {
    const f = fixture();
    await assert.rejects(
      withTenantTransaction(f.pool, { ...options, tenantId: invalid }, async () => null),
      /INVALID_TENANT_CONTEXT/,
    );
    assert.equal(f.calls.length, 0);
  });
}

test("rejects an arbitrary SQL role before connecting", async () => {
  const f = fixture();
  await assert.rejects(
    withTenantTransaction(f.pool, { ...options, role: "solis_owner; SELECT 1" }, async () => null),
    /INVALID_TENANT_CONTEXT/,
  );
  assert.equal(f.calls.length, 0);
});

for (const timeout of [0, -1, 1.5, 60_001, NaN, Infinity]) {
  test(`rejects invalid statement timeout: ${timeout}`, async () => {
    const f = fixture();
    await assert.rejects(
      withTenantTransaction(f.pool, { ...options, statementTimeoutMs: timeout }, async () => null),
      /INVALID_STATEMENT_TIMEOUT/,
    );
    assert.equal(f.calls.length, 0);
  });
}

for (const session of [
  [{ rolsuper: true, rolbypassrls: false }],
  [{ rolsuper: false, rolbypassrls: true }],
  [],
]) {
  test(`rejects unsafe or unresolved database login: ${JSON.stringify(session)}`, async () => {
    const f = fixture({ session });
    let called = false;
    await assert.rejects(
      withTenantTransaction(f.pool, options, async () => {
        called = true;
      }),
      /UNSAFE_DATABASE_LOGIN/,
    );
    assert.equal(called, false);
    assert.deepEqual(f.releases, [true]);
  });
}

test("rejects an altered runtime role before running business SQL", async () => {
  const f = fixture({
    effective: [{ role_name: options.role, rolsuper: false, rolbypassrls: true }],
  });
  await assert.rejects(
    withTenantTransaction(f.pool, options, async () => null),
    /UNSAFE_DATABASE_ROLE/,
  );
  assert.equal(f.calls.at(-1).sql, "ROLLBACK");
});

test("rolls back on business errors and preserves the original error", async () => {
  const f = fixture();
  const original = new Error("BUSINESS_ERROR");
  await assert.rejects(
    withTenantTransaction(f.pool, options, async () => {
      throw original;
    }),
    (e) => e === original,
  );
  assert.equal(f.calls.at(-1).sql, "ROLLBACK");
  assert.deepEqual(f.releases, [false]);
});

test("discards connections when rollback fails without masking the business error", async () => {
  const f = fixture({ fail: (sql) => sql === "ROLLBACK" });
  const original = new Error("BUSINESS_ERROR");
  await assert.rejects(
    withTenantTransaction(f.pool, options, async () => {
      throw original;
    }),
    (e) => e === original,
  );
  assert.deepEqual(f.releases, [true]);
});

for (const failedStep of ["BEGIN", "COMMIT"]) {
  test(`discards a connection after ${failedStep} failure`, async () => {
    const f = fixture({ fail: (sql) => sql === failedStep });
    await assert.rejects(withTenantTransaction(f.pool, options, async () => null));
    assert.deepEqual(f.releases, [true]);
  });
}

test("reused connections receive a fresh tenant context for each transaction", async () => {
  const f = fixture();
  await withTenantTransaction(f.pool, options, async () => null);
  await withTenantTransaction(f.pool, { ...options, tenantId: otherTenant }, async () => null);
  const contexts = f.calls.filter((call) => call.sql.includes("set_config('app.tenant_id'"));
  assert.deepEqual(contexts.map((call) => call.values[0]), [tenantId, otherTenant]);
  assert.equal(f.calls.filter((call) => call.sql === "COMMIT").length, 2);
});
