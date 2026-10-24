export function readRuntimeConfiguration(source: NodeJS.ProcessEnv) {
  if (source.SOLIS_READ_API_ENABLED === undefined || source.SOLIS_READ_API_ENABLED === "false") {
    return undefined;
  }
  if (source.SOLIS_READ_API_ENABLED !== "true") throw new Error("INVALID_READ_API_FLAG");
  if (!["development", "test"].includes(source.NODE_ENV ?? "development")) {
    throw new Error("READ_API_REQUIRES_LOCAL_VALIDATION_GATE");
  }
  const { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID } = source;
  const DATABASE_URL = source.API_DATABASE_URL ?? source.DATABASE_URL;
  if (!DATABASE_URL || !COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID) {
    throw new Error("READ_API_CONFIGURATION_REQUIRED");
  }
  try {
    const url = new URL(DATABASE_URL);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.username) {
      throw new Error();
    }
    if (decodeURIComponent(url.username) === "solis_owner") throw new Error();
  } catch {
    throw new Error("INVALID_RUNTIME_DATABASE_CONFIGURATION");
  }
  return { databaseUrl: DATABASE_URL, userPoolId: COGNITO_USER_POOL_ID, clientId: COGNITO_CLIENT_ID };
}
