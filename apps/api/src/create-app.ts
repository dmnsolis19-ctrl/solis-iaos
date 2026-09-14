import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { parseServiceEnvironment } from "@solis/config";
import { createLogger, resolveCorrelationId, runWithCorrelation } from "@solis/observability";

import { FoundationModule } from "./foundation.module.js";
import { StructuredLogger } from "./structured-logger.js";

export async function createApp(): Promise<NestFastifyApplication> {
  const config = parseServiceEnvironment(3000);
  const logger = createLogger("solis-api", "0.2.0", config.LOG_LEVEL);
  const adapter = new FastifyAdapter({
    logger: false,
    trustProxy: true,
    bodyLimit: 1_048_576,
    requestTimeout: 15_000,
  });
  const fastify = adapter.getInstance();

  fastify.addHook("onRequest", (request, reply, done) => {
    const header = request.headers["x-correlation-id"];
    const candidate = Array.isArray(header) ? header[0] : header;
    const correlationId = resolveCorrelationId(candidate);
    reply.header("x-correlation-id", correlationId);
    runWithCorrelation(correlationId, done);
  });

  const app = await NestFactory.create<NestFastifyApplication>(FoundationModule, adapter, {
    bufferLogs: true,
  });
  app.useLogger(new StructuredLogger(logger));
  app.enableShutdownHooks();
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
  await app.register(cors, {
    origin: false,
  });

  return app;
}
