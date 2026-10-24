import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import { currentCorrelationId } from "@solis/observability";

import { ReadApiError, type ReadOperation, type ReadRequest } from "./tenant-read-api.js";

export function registerReadRoutes(
  fastify: FastifyInstance,
  execute: (request: ReadRequest) => Promise<unknown>,
) {
  const routes: [string, ReadOperation, string?][] = [
    ["/api/v1/tenants/:tenantId", "getTenant"],
    ["/api/v1/tenants/:tenantId/sites", "listSites"],
    ["/api/v1/tenants/:tenantId/sites/:siteId/assets", "listAssets", "siteId"],
    ["/api/v1/tenants/:tenantId/assets/:assetId", "getAsset", "assetId"],
    ["/api/v1/tenants/:tenantId/variables/:variableId/latest", "getLatestValue", "variableId"],
  ];
  for (const [url, operation, resourceParameter] of routes) {
    fastify.get(url, async (request, reply) => {
      reply.header("cache-control", "no-store");
      const correlationId = currentCorrelationId() ?? randomUUID();
      reply.header("x-correlation-id", correlationId);
      const parameters = request.params as Record<string, string>;
      const authorization = request.headers.authorization;
      try {
        return await execute({
          operation,
          tenantId: parameters.tenantId!,
          ...(authorization === undefined ? {} : { authorization }),
          ...(resourceParameter === undefined ? {} : { resourceId: parameters[resourceParameter]! }),
          query: request.query as Record<string, unknown>,
        });
      } catch (error) {
        const safe = error instanceof ReadApiError ? error : new ReadApiError(503, "DEPENDENCY_UNAVAILABLE");
        if (safe.status === 401) reply.header("www-authenticate", "Bearer");
        return reply.code(safe.status).type("application/problem+json").send({
          type: `urn:solis-iaos:problem:${safe.code}`,
          title: safe.code,
          status: safe.status,
          code: safe.code,
          correlationId,
        });
      }
    });
  }
}
