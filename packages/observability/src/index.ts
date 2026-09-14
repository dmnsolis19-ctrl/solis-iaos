import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

import fastifyOtel from "@fastify/otel";
import { context, trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { NestInstrumentation } from "@opentelemetry/instrumentation-nestjs-core";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  type SpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import pino, { type Logger } from "pino";

interface RequestContext {
  correlationId: string;
}

const requestContext = new AsyncLocalStorage<RequestContext>();
const { FastifyOtelInstrumentation } = fastifyOtel;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function resolveCorrelationId(candidate: string | undefined): string {
  return candidate !== undefined && uuidPattern.test(candidate) ? candidate : randomUUID();
}

export function runWithCorrelation<T>(correlationId: string, callback: () => T): T {
  return requestContext.run({ correlationId }, callback);
}

export function currentCorrelationId(): string | undefined {
  return requestContext.getStore()?.correlationId;
}

export function currentTraceId(): string | undefined {
  const span = trace.getSpan(context.active());
  const traceId = span?.spanContext().traceId;
  return traceId !== undefined && !/^0+$/u.test(traceId) ? traceId : undefined;
}

export function createLogger(serviceName: string, serviceVersion: string, level: string): Logger {
  return pino({
    level,
    base: {
      service: serviceName,
      version: serviceVersion,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "req.headers.authorization",
        "authorization",
        "password",
        "secret",
        "token",
        "*.password",
        "*.secret",
        "*.token",
      ],
      censor: "[REDACTED]",
    },
    mixin() {
      return {
        correlation_id: currentCorrelationId(),
        trace_id: currentTraceId(),
      };
    },
  });
}

export interface TelemetryHandle {
  shutdown: () => Promise<void>;
}

export function startTelemetry(options: {
  serviceName: string;
  serviceVersion: string;
  endpoint?: string;
  consoleExporter?: boolean;
}): TelemetryHandle {
  let exporter: SpanExporter | undefined;

  if (options.endpoint !== undefined) {
    const baseUrl = options.endpoint.replace(/\/+$/u, "");
    exporter = new OTLPTraceExporter({ url: `${baseUrl}/v1/traces` });
  } else if (options.consoleExporter === true) {
    exporter = new ConsoleSpanExporter();
  }

  if (exporter === undefined) {
    return { shutdown: async () => Promise.resolve() };
  }

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: options.serviceName,
      [ATTR_SERVICE_VERSION]: options.serviceVersion,
      "deployment.environment.name": process.env.NODE_ENV ?? "development",
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
    instrumentations: [
      new HttpInstrumentation(),
      new UndiciInstrumentation(),
      new FastifyOtelInstrumentation({ registerOnInitialization: true }),
      new NestInstrumentation(),
      new PgInstrumentation(),
    ],
  });

  sdk.start();

  return {
    shutdown: async () => sdk.shutdown(),
  };
}
