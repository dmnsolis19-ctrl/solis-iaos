import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { test } from "node:test";

import { createCognitoAuthenticator } from "../../apps/api/src/identity/cognito.ts";

const first = generateKeyPairSync("rsa", { modulusLength: 2048 });
const second = generateKeyPairSync("rsa", { modulusLength: 2048 });
const clientId = "syntheticclient123";
const userPoolId = "sa-east-1_SYNTHETIC";
const issuer = `https://cognito-idp.sa-east-1.amazonaws.com/${userPoolId}`;
const baseTime = Date.parse("2026-10-24T20:00:00Z");
const jwk = (pair, kid = "first") => ({
  ...pair.publicKey.export({ format: "jwk" }), kid, use: "sig", alg: "RS256",
});
function token({ claims = {}, header = {}, pair = first } = {}) {
  const head = Buffer.from(JSON.stringify({ alg: "RS256", kid: "first", ...header })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: "synthetic-user", username: "synthetic-user", token_use: "access",
    iss: issuer, client_id: clientId, iat: baseTime / 1000 - 10, exp: baseTime / 1000 + 300,
    ...claims,
  })).toString("base64url");
  return `${head}.${payload}.${sign("RSA-SHA256", Buffer.from(`${head}.${payload}`), pair.privateKey).toString("base64url")}`;
}
function fixture({ document, fetchFailure = false } = {}) {
  let time = baseTime;
  let current = document ?? { keys: [jwk(first)] };
  const requests = [];
  const authenticate = createCognitoAuthenticator({
    userPoolId, clientId, now: () => time,
    fetcher: async (url, options) => {
      requests.push({ url, options });
      if (fetchFailure) throw new Error("PROVIDER_INTERNAL_SECRET");
      return new Response(JSON.stringify(current));
    },
  });
  return {
    authenticate, requests,
    advance(ms) { time += ms; },
    rotate(next) { current = next; },
  };
}

test("verifies an actual RSA signature against the configured Cognito JWKS", async () => {
  const f = fixture();
  assert.deepEqual(await f.authenticate(`Bearer ${token()}`), { subject: "synthetic-user", issuer });
  assert.equal(f.requests[0].url, `${issuer}/.well-known/jwks.json`);
  assert.equal(f.requests[0].options.redirect, "error");
  assert.ok(f.requests[0].options.signal instanceof AbortSignal);
});

test("does not export tenant or role claims as authorization", async () => {
  const f = fixture();
  const principal = await f.authenticate(`Bearer ${token({ claims: { tenant_id: "other", role: "PLATFORM_ADMIN" } })}`);
  assert.deepEqual(Object.keys(principal).sort(), ["issuer", "subject"]);
});

for (const header of [undefined, "", "Basic secret", "Bearer x.y.z", "Bearer a.b.c extra", "Bearer ", "x".repeat(16_385)]) {
  test(`rejects malformed authorization: ${String(header).slice(0, 24)}`, async () => {
    const f = fixture();
    await assert.rejects(f.authenticate(header), /UNAUTHORIZED/);
    assert.equal(f.requests.length, 0);
  });
}

for (const claims of [
  { iss: "https://attacker.invalid/pool" }, { client_id: "otherclient" },
  { token_use: "id", aud: clientId },
]) {
  test(`rejects wrong provider/client/token use: ${JSON.stringify(claims)}`, async () => {
    const f = fixture();
    await assert.rejects(f.authenticate(`Bearer ${token({ claims })}`), /UNAUTHORIZED/);
    assert.equal(f.requests.length, 0);
  });
}

for (const header of [
  { alg: "none" }, { alg: "HS256" }, { alg: "PS256" }, { kid: "" },
  { typ: "at+jwt" }, { crit: ["other"] }, { jku: "https://attacker.invalid/keys" },
  { x5u: "https://attacker.invalid/cert" }, { b64: false },
]) {
  test(`rejects unsupported or token-selected crypto parameters: ${JSON.stringify(header)}`, async () => {
    const f = fixture();
    await assert.rejects(f.authenticate(`Bearer ${token({ header })}`), /UNAUTHORIZED/);
    assert.equal(f.requests.length, 0);
  });
}

test("rejects a forged signature from a different RSA key", async () => {
  const f = fixture();
  await assert.rejects(f.authenticate(`Bearer ${token({ pair: second })}`), /UNAUTHORIZED/);
});

test("rejects a payload changed after signing", async () => {
  const f = fixture();
  const parts = token().split(".");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  payload.sub = "administrator";
  parts[1] = Buffer.from(JSON.stringify(payload)).toString("base64url");
  await assert.rejects(f.authenticate(`Bearer ${parts.join(".")}`), /UNAUTHORIZED/);
});

for (const claims of [
  { exp: baseTime / 1000 }, { exp: "9999999999" }, { exp: undefined },
  { iat: baseTime / 1000 + 60 }, { iat: undefined },
  { exp: baseTime / 1000 + 5, iat: baseTime / 1000 + 10 },
  { nbf: baseTime / 1000 + 10 }, { nbf: "123" },
  { sub: "" }, { sub: "a\u0000b" }, { sub: "x".repeat(256) },
  { username: undefined }, { sub: clientId, username: undefined },
]) {
  test(`rejects expired/invalid time or non-human claims: ${JSON.stringify(claims).slice(0, 70)}`, async () => {
    const f = fixture();
    await assert.rejects(f.authenticate(`Bearer ${token({ claims })}`), /UNAUTHORIZED/);
  });
}

test("caches keys and shares a single request for concurrent verification", async () => {
  const f = fixture();
  await Promise.all(Array.from({ length: 8 }, () => f.authenticate(`Bearer ${token()}`)));
  assert.equal(f.requests.length, 1);
  await f.authenticate(`Bearer ${token()}`);
  assert.equal(f.requests.length, 1);
});

test("unknown key IDs cannot force unbounded JWKS fetches", async () => {
  const f = fixture();
  await f.authenticate(`Bearer ${token()}`);
  for (let i = 0; i < 10; i++) {
    await assert.rejects(f.authenticate(`Bearer ${token({ header: { kid: `unknown${i}` } })}`));
  }
  assert.equal(f.requests.length, 1);
});

test("refreshes for a rotated key after the cooldown", async () => {
  const f = fixture();
  await f.authenticate(`Bearer ${token()}`);
  f.advance(31_000);
  f.rotate({ keys: [jwk(second, "second")] });
  const result = await f.authenticate(`Bearer ${token({ pair: second, header: { kid: "second" } })}`);
  assert.equal(result.subject, "synthetic-user");
  assert.equal(f.requests.length, 2);
});

test("provider failures return a safe authorization error", async () => {
  const f = fixture({ fetchFailure: true });
  await assert.rejects(f.authenticate(`Bearer ${token()}`), (error) => {
    assert.equal(error.message, "UNAUTHORIZED");
    assert.ok(!JSON.stringify(error).includes("PROVIDER_INTERNAL_SECRET"));
    return true;
  });
});

for (const document of [
  { keys: [] }, { keys: "invalid" }, { keys: [jwk(first), jwk(first)] },
  { keys: [{ ...jwk(first), alg: "HS256" }] },
  { keys: [{ ...jwk(first), use: "enc" }] },
]) {
  test("rejects invalid/ambiguous JWKS documents", async () => {
    const f = fixture({ document });
    await assert.rejects(f.authenticate(`Bearer ${token()}`), /UNAUTHORIZED/);
  });
}

test("rejects JWKS responses beyond the bounded byte limit", async () => {
  const f = fixture({ document: { keys: [jwk(first)], padding: "x".repeat(262_144) } });
  await assert.rejects(f.authenticate(`Bearer ${token()}`), /UNAUTHORIZED/);
});

test("rejects a weak RSA signing key", async () => {
  const weak = generateKeyPairSync("rsa", { modulusLength: 1024 });
  const f = fixture({ document: { keys: [jwk(weak)] } });
  await assert.rejects(f.authenticate(`Bearer ${token({ pair: weak })}`), /UNAUTHORIZED/);
});
