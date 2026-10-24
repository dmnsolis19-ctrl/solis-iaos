import assert from "node:assert/strict";
import { test } from "node:test";

import { createTenantReadApi } from "../../apps/api/src/tenant-read-api.ts";
import { readRuntimeConfiguration } from "../../apps/api/src/read-runtime-config.ts";

const tenantId = "018f47d2-f8a1-7c42-8e02-e8f1a2f4bf76";
const otherTenant = "018f47d2-f8a1-7c42-8e02-e8f1a2f4bf77";
const siteId = "11111111-1111-4111-8111-111111111111";
const outsideSite = "22222222-2222-4222-8222-222222222222";
const resourceId = "33333333-3333-4333-8333-333333333333";
const now = Date.parse("2026-10-24T20:00:00Z");

function fixture({ memberships, rows, unauthorized = false, queryFailure = false } = {}) {
  const calls = [];
  const events = [];
  const transactions = [];
  const connection = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (queryFailure) throw new Error("postgresql://private:password@internal");
      if (sql.includes("control_plane.membership m")) return {
        rows: memberships ?? [{ role_code: "OPERATOR", site_id: siteId }],
      };
      if (sql.includes("v.stale_after_seconds")) return { rows: [{ id: resourceId, stale_after_seconds: 300 }] };
      return { rows: typeof rows === "function" ? rows(sql, values) : rows ?? [] };
    },
    release() {},
  };
  const execute = createTenantReadApi({
    authenticate: async () => {
      if (unauthorized) throw new Error("raw-token-and-provider-details");
      return { subject: "user", issuer: "configured-provider" };
    },
    transaction: async (tenant, operation) => { transactions.push(tenant); return operation(connection); },
    now: () => now,
    observe(event) { events.push(event); },
  });
  return { calls, events, transactions, execute };
}

test("authentication failure never acquires a tenant database transaction", async () => {
  const f = fixture({ unauthorized: true });
  await assert.rejects(f.execute({ operation: "getTenant", tenantId }), { status: 401, code: "UNAUTHORIZED" });
  assert.deepEqual(f.transactions, []);
  assert.ok(!JSON.stringify(f.events).includes("raw-token"));
});

test("no active membership denies access before querying domain tables", async () => {
  const f = fixture({ memberships: [] });
  await assert.rejects(f.execute({ operation: "getTenant", tenantId: otherTenant }), { status: 403 });
  assert.equal(f.calls.length, 1);
  assert.deepEqual(f.calls[0].values, [otherTenant, "user"]);
  assert.ok(f.calls[0].sql.includes("m.valid_until > now()"));
  assert.ok(f.calls[0].sql.includes("m.status = 'ACTIVE'"));
});

test("PLATFORM_ADMIN is not a normal membership bypass", async () => {
  const f = fixture({ memberships: [{ role_code: "PLATFORM_ADMIN", site_id: null }] });
  await assert.rejects(f.execute({ operation: "listSites", tenantId }), { status: 403 });
});

test("site-scoped operators cannot enumerate another site's assets", async () => {
  const f = fixture();
  await assert.rejects(f.execute({ operation: "listAssets", tenantId, resourceId: outsideSite }), { status: 403 });
  assert.equal(f.calls.length, 1);
});

test("a membership with no sites never implicitly grants every site", async () => {
  const f = fixture({ memberships: [{ role_code: "INTEGRATOR_ENGINEER", site_id: null }] });
  await f.execute({ operation: "listSites", tenantId });
  assert.equal(f.calls[1].values[1], false);
  assert.deepEqual(f.calls[1].values[2], []);
});

test("Tenant Admin receives all sites of the selected tenant only", async () => {
  const f = fixture({ memberships: [{ role_code: "TENANT_ADMIN", site_id: null }] });
  await f.execute({ operation: "listAssets", tenantId, resourceId: outsideSite });
  assert.deepEqual(f.transactions, [tenantId]);
  assert.deepEqual(f.calls[1].values.slice(0, 2), [tenantId, outsideSite]);
});

test("membership is checked again for every request, including revocation", async () => {
  const memberships = [{ role_code: "OPERATOR", site_id: siteId }];
  const f = fixture({ memberships });
  await f.execute({ operation: "listSites", tenantId });
  memberships.length = 0;
  await assert.rejects(f.execute({ operation: "listSites", tenantId }), { status: 403 });
  assert.equal(f.calls.filter((call) => call.sql.includes("control_plane.membership m")).length, 2);
});

test("returns bounded keyset pagination without leaking lookahead rows", async () => {
  const f = fixture({ rows: [{ id: siteId }, { id: outsideSite }] });
  const result = await f.execute({ operation: "listSites", tenantId, query: { limit: "1" } });
  assert.deepEqual(result, { items: [{ id: siteId }], page: { hasMore: true, nextCursor: siteId } });
  assert.equal(f.calls[1].values.at(-1), 2);
  assert.deepEqual(f.calls[1].values[2], [siteId]);
});

for (const limit of ["0", "201", "-1", "1.5", "1;DROP", ["10"], 10]) {
  test(`rejects invalid pagination limits: ${JSON.stringify(limit)}`, async () => {
    const f = fixture();
    await assert.rejects(f.execute({ operation: "listSites", tenantId, query: { limit } }), { status: 400 });
    assert.equal(f.calls.length, 1);
  });
}

test("cursor is validated and supplied as a query parameter", async () => {
  const f = fixture();
  await f.execute({ operation: "listSites", tenantId, query: { cursor: siteId } });
  assert.equal(f.calls[1].values[3], siteId);
  await assert.rejects(f.execute({ operation: "listSites", tenantId, query: { cursor: "'; DROP" } }), { status: 400 });
});

test("search treats SQL metacharacters as data", async () => {
  const f = fixture();
  const q = "'; DROP TABLE asset_core.asset; --%_";
  await f.execute({ operation: "listAssets", tenantId, resourceId: siteId, query: { q } });
  assert.equal(f.calls[1].values[4], q);
  assert.ok(!f.calls[1].sql.includes(q));
});

for (const status of ["INACTIVE", "RETIRED"]) {
  test(`non-active resources require an explicit policy, not just a read membership: ${status}`, async () => {
    const f = fixture();
    await assert.rejects(f.execute({ operation: "listAssets", tenantId, resourceId: siteId, query: { status } }), { status: 403, code: "RESOURCE_STATE_NOT_ALLOWED" });
    assert.equal(f.calls.length, 1);
  });
}
test("rejects an array status instead of coercing it to a permitted string", async () => {
  const f = fixture();
  await assert.rejects(f.execute({ operation: "listAssets", tenantId, resourceId: siteId, query: { status: ["ACTIVE"] } }), { status: 400 });
});

test("asset lookup includes allowed sites and does not expose out-of-scope resources", async () => {
  const f = fixture();
  await assert.rejects(f.execute({ operation: "getAsset", tenantId, resourceId }), { status: 404 });
  assert.deepEqual(f.calls[1].values, [tenantId, resourceId, false, [siteId]]);
});

test("asset detail includes variables only after resolving an authorized asset", async () => {
  const f = fixture({ rows: (sql) => sql.includes("a.description") ? [{ id: resourceId, siteId }] : [{ id: "variable" }] });
  assert.deepEqual(await f.execute({ operation: "getAsset", tenantId, resourceId }), {
    id: resourceId, siteId, variables: [{ id: "variable" }],
  });
});

function latest(patch = {}) {
  return {
    dataType: "FLOAT64", quality: "GOOD", qualityDetail: "OK", unitCode: "kPa",
    sourceTime: new Date(now - 1000), ingestedAt: new Date(now), value_float64: 0,
    value_boolean: null, value_int64: null, value_string: null, state: "ONLINE", ...patch,
  };
}
for (const [patch, expected] of [
  [{ value_float64: 0 }, 0],
  [{ dataType: "BOOLEAN", value_boolean: false }, false],
  [{ dataType: "INT64", value_int64: "9223372036854775807" }, "9223372036854775807"],
  [{ dataType: "STRING", value_string: "" }, ""],
  [{ quality: "NO_DATA" }, null],
]) {
  test(`preserves typed telemetry values without numeric rounding: ${JSON.stringify(expected)}`, async () => {
    const f = fixture({ rows: [latest(patch)] });
    const result = await f.execute({ operation: "getLatestValue", tenantId, resourceId });
    assert.equal(result.value, expected);
  });
}
for (const [patch, expected] of [
  [{}, "ONLINE"], [{ sourceTime: new Date(now - 301_000) }, "STALE"],
  [{ quality: "BAD" }, "BAD_QUALITY"], [{ quality: "UNCERTAIN" }, "BAD_QUALITY"],
  [{ quality: "NO_DATA" }, "NO_DATA"], [{ state: "OFFLINE" }, "OFFLINE"],
]) {
  test(`computes availability separately from sample quality: ${expected}`, async () => {
    const f = fixture({ rows: [latest(patch)] });
    const result = await f.execute({ operation: "getLatestValue", tenantId, resourceId });
    assert.equal(result.state, expected);
    assert.equal(result.quality, patch.quality ?? "GOOD");
  });
}
test("empty telemetry never fabricates source timestamps", async () => {
  const f = fixture();
  await assert.rejects(f.execute({ operation: "getLatestValue", tenantId, resourceId }), { status: 404, code: "NO_TELEMETRY_DATA" });
});

test("database failures expose no credentials or SQL", async () => {
  const f = fixture({ queryFailure: true });
  await assert.rejects(f.execute({ operation: "getTenant", tenantId }), (error) => {
    assert.equal(error.code, "DEPENDENCY_UNAVAILABLE");
    assert.ok(!error.message.includes("password"));
    return true;
  });
});

test("read API is disabled by default and cannot be enabled in production", () => {
  assert.equal(readRuntimeConfiguration({}), undefined);
  assert.throws(() => readRuntimeConfiguration({ SOLIS_READ_API_ENABLED: "true", NODE_ENV: "production" }), /GATE/);
});
test("read API requires explicit runtime database and identity configuration", () => {
  assert.throws(() => readRuntimeConfiguration({ SOLIS_READ_API_ENABLED: "true" }), /CONFIGURATION_REQUIRED/);
  const config = { SOLIS_READ_API_ENABLED: "true", COGNITO_USER_POOL_ID: "sa-east-1_SYNTHETIC", COGNITO_CLIENT_ID: "syntheticclient123", DATABASE_URL: "postgresql://solis_api_login:local@localhost/solis_iaos" };
  assert.equal(readRuntimeConfiguration(config).clientId, "syntheticclient123");
  assert.throws(() => readRuntimeConfiguration({ ...config, DATABASE_URL: config.DATABASE_URL.replace("solis_api_login", "solis_owner") }), /INVALID_RUNTIME_DATABASE/);
});
