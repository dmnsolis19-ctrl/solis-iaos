export function ingestionConfiguration(source: NodeJS.ProcessEnv) {
  if (source.SOLIS_INGESTION_ENABLED === undefined || source.SOLIS_INGESTION_ENABLED === "false") return undefined;
  if (source.SOLIS_INGESTION_ENABLED !== "true") throw new Error("INVALID_INGESTION_FLAG");
  if (!["development", "test"].includes(source.NODE_ENV ?? "development")) throw new Error("INGESTION_REQUIRES_LOCAL_GATE");
  const databaseUrl = source.WORKER_DATABASE_URL ?? source.DATABASE_URL;
  if (!databaseUrl || !source.SQS_ENDPOINT || !source.SQS_QUEUE_URL) throw new Error("INGESTION_CONFIGURATION_REQUIRED");
  try {
    const db = new URL(databaseUrl);
    if (!["postgres:", "postgresql:"].includes(db.protocol) || !db.hostname || !db.username || decodeURIComponent(db.username) === "solis_owner") throw new Error();
    const endpoint = new URL(source.SQS_ENDPOINT);
    const queue = new URL(source.SQS_QUEUE_URL);
    const local = (host: string) => ["localhost", "127.0.0.1", "queue"].includes(host) || host.endsWith(".localhost.localstack.cloud");
    if ([endpoint, queue].some((url) => url.protocol !== "http:" || url.port !== "4566" || !local(url.hostname) || url.username || url.password || url.search || url.hash)) throw new Error();
  } catch { throw new Error("INVALID_LOCAL_INGESTION_CONFIGURATION"); }
  return { databaseUrl, endpoint: source.SQS_ENDPOINT, queueUrl: source.SQS_QUEUE_URL };
}
