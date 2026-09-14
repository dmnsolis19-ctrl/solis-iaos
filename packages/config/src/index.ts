import { z } from "zod";

const baseEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  SERVICE_NAME: z.string().min(1).default("solis-iaos"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
  OTEL_CONSOLE_EXPORTER: z.enum(["true", "false"]).default("false"),
});

const serviceEnvironmentSchema = baseEnvironmentSchema.extend({
  HOST: z.string().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65_535),
});

export type BaseEnvironment = z.infer<typeof baseEnvironmentSchema>;
export type ServiceEnvironment = z.infer<typeof serviceEnvironmentSchema>;

export function parseBaseEnvironment(source: NodeJS.ProcessEnv = process.env): BaseEnvironment {
  return baseEnvironmentSchema.parse(source);
}

export function parseServiceEnvironment(
  defaultPort: number,
  source: NodeJS.ProcessEnv = process.env,
): ServiceEnvironment {
  return serviceEnvironmentSchema.parse({
    ...source,
    PORT: source.PORT ?? defaultPort,
  });
}
