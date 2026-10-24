import Fastify from "fastify";
import { describe, expect, it } from "vitest";

import { registerReadRoutes } from "../src/read-routes.js";
import { ReadApiError } from "../src/tenant-read-api.js";

describe("HTTP read adapter", () => {
  it("maps a documented GET route and forwards only the expected context", async () => {
    const server = Fastify();
    const requests: unknown[] = [];
    registerReadRoutes(server, async (request) => { requests.push(request); return { items: [], page: { hasMore: false } }; });
    try {
      const response = await server.inject({ method: "GET", url: "/api/v1/tenants/tenant/sites/site/assets?limit=10", headers: { authorization: "Bearer signed.token.value", "x-tenant-id": "attacker" } });
      expect(response.statusCode).toBe(200);
      expect(response.headers["cache-control"]).toBe("no-store");
      expect(requests[0]).toEqual({ operation: "listAssets", tenantId: "tenant", resourceId: "site", authorization: "Bearer signed.token.value", query: { limit: "10" } });
    } finally { await server.close(); }
  });
  it("returns safe Problem responses, challenges unauthorized callers and prevents caching", async () => {
    const server = Fastify();
    registerReadRoutes(server, async () => { throw new ReadApiError(401, "UNAUTHORIZED"); });
    try {
      const response = await server.inject({ method: "GET", url: "/api/v1/tenants/tenant" });
      expect(response.statusCode).toBe(401);
      expect(response.headers["www-authenticate"]).toBe("Bearer");
      expect(response.headers["content-type"]).toContain("application/problem+json");
      expect(response.json()).toMatchObject({ status: 401, code: "UNAUTHORIZED" });
    } finally { await server.close(); }
  });
});
