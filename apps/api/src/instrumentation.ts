import { startTelemetry } from "@solis/observability";

export const telemetry = startTelemetry({
  serviceName: "solis-api",
  serviceVersion: "0.2.0",
  ...(process.env.OTEL_EXPORTER_OTLP_ENDPOINT === undefined
    ? {}
    : { endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }),
  consoleExporter: process.env.OTEL_CONSOLE_EXPORTER === "true",
});
