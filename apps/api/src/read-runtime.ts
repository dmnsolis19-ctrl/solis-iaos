import { createRuntimePool, withTenantTransaction } from "@solis/database";

import { createCognitoAuthenticator } from "./identity/cognito.js";
import { readRuntimeConfiguration } from "./read-runtime-config.js";
import { createTenantReadApi } from "./tenant-read-api.js";

export function configuredReadRuntime(
  source: NodeJS.ProcessEnv,
  observe: (event: { operation: string; outcome: string; code: string }) => void,
) {
  const config = readRuntimeConfiguration(source);
  if (config === undefined) return undefined;
  const authenticate = createCognitoAuthenticator(config);
  const pool = createRuntimePool({
    connectionString: config.databaseUrl,
    max: 10,
    connectionTimeoutMillis: 2_000,
    idleTimeoutMillis: 10_000,
  });
  pool.on("error", () => observe({ operation: "database.pool", outcome: "failed", code: "POOL_ERROR" }));
  return {
    execute: createTenantReadApi({
      authenticate,
      transaction: (tenantId, operation) => withTenantTransaction(
        pool, { tenantId, role: "solis_api_runtime" }, operation,
      ),
      observe,
    }),
    close: () => pool.end(),
  };
}
