import { createServer } from "node:http";

import { parseServiceEnvironment } from "@solis/config";
import { createLogger, startTelemetry } from "@solis/observability";

import { checkQueueReadiness } from "./readiness.js";

const config = parseServiceEnvironment(Number(process.env.WORKER_PORT ?? 3001));
const logger = createLogger("solis-telemetry-worker", "0.2.0", config.LOG_LEVEL);
const telemetry = startTelemetry({
  serviceName: "solis-telemetry-worker",
  serviceVersion: "0.2.0",
  ...(config.OTEL_EXPORTER_OTLP_ENDPOINT === undefined
    ? {}
    : { endpoint: config.OTEL_EXPORTER_OTLP_ENDPOINT }),
  consoleExporter: config.OTEL_CONSOLE_EXPORTER === "true",
});

const server = createServer(async (request, response) => {
  response.setHeader("content-type", "application/json");

  if (request.url === "/health/live") {
    response.writeHead(200);
    response.end(JSON.stringify({ status: "ok", service: "solis-telemetry-worker" }));
    return;
  }

  if (request.url === "/health/ready") {
    const ready = await checkQueueReadiness({
      region: process.env.AWS_REGION ?? "sa-east-1",
      ...(process.env.SQS_QUEUE_URL === undefined ? {} : { queueUrl: process.env.SQS_QUEUE_URL }),
      ...(process.env.SQS_ENDPOINT === undefined ? {} : { endpoint: process.env.SQS_ENDPOINT }),
    });
    response.writeHead(ready ? 200 : 503);
    response.end(JSON.stringify({ status: ready ? "ok" : "not_ready", dependency: "sqs" }));
    return;
  }

  response.writeHead(404);
  response.end(JSON.stringify({ code: "NOT_FOUND" }));
});

server.listen(config.PORT, config.HOST, () => {
  logger.info({ port: config.PORT }, "Telemetry Worker foundation health server started");
});

const shutdown = async (): Promise<void> => {
  server.close();
  await telemetry.shutdown();
};

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
