import type { LoggerService } from "@nestjs/common";
import type { Logger } from "pino";

export class StructuredLogger implements LoggerService {
  public constructor(private readonly logger: Logger) {}

  public log(message: unknown, context?: string): void {
    this.logger.info({ context, nest_message: message }, "Nest log");
  }

  public fatal(message: unknown, context?: string): void {
    this.logger.fatal({ context, nest_message: message }, "Nest fatal");
  }

  public error(message: unknown, trace?: string, context?: string): void {
    this.logger.error({ context, nest_message: message, trace }, "Nest error");
  }

  public warn(message: unknown, context?: string): void {
    this.logger.warn({ context, nest_message: message }, "Nest warning");
  }

  public debug(message: unknown, context?: string): void {
    this.logger.debug({ context, nest_message: message }, "Nest debug");
  }

  public verbose(message: unknown, context?: string): void {
    this.logger.trace({ context, nest_message: message }, "Nest verbose");
  }
}
