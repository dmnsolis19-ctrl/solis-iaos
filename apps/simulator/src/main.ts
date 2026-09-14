import { createServer } from "node:http";

import { parseServiceEnvironment } from "@solis/config";
import { createLogger, startTelemetry } from "@solis/observability";

const config = parseServiceEnvironment(Number(process.env.SIMULATOR_PORT ?? 3002));
const logger = createLogger("solis-simulator", "0.2.0", config.LOG_LEVEL);
const telemetry = startTelemetry({
  serviceName: "solis-simulator",
  serviceVersion: "0.2.0",
  ...(config.OTEL_EXPORTER_OTLP_ENDPOINT === undefined
    ? {}
    : { endpoint: config.OTEL_EXPORTER_OTLP_ENDPOINT }),
  consoleExporter: config.OTEL_CONSOLE_EXPORTER === "true",
});

const server = createServer((request, response) => {
  response.setHeader("content-type", "application/json");
  if (request.url === "/health/live" || request.url === "/health/ready") {
    response.writeHead(200);
    response.end(
      JSON.stringify({
        status: "ok",
        service: "solis-simulator",
        mode: "foundation-no-telemetry",
      }),
    );
    return;
  }

  response.writeHead(404);
  response.end(JSON.stringify({ code: "NOT_FOUND" }));
});

server.listen(config.PORT, config.HOST, () => {
  logger.info(
    { port: config.PORT, telemetryEnabled: false },
    "Simulator foundation scaffold started",
  );
});

const shutdown = async (): Promise<void> => {
  server.close();
  await telemetry.shutdown();
};

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
