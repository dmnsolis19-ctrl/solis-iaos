import { Controller, Get, Module } from "@nestjs/common";
import { currentCorrelationId, currentTraceId } from "@solis/observability";

interface HealthResponse {
  status: "ok";
  service: "solis-api";
  version: "0.2.0";
  correlationId?: string;
  traceId?: string;
}

@Controller("health")
class HealthController {
  @Get("live")
  public live(): HealthResponse {
    const correlationId = currentCorrelationId();
    const traceId = currentTraceId();
    return {
      status: "ok",
      service: "solis-api",
      version: "0.2.0",
      ...(correlationId === undefined ? {} : { correlationId }),
      ...(traceId === undefined ? {} : { traceId }),
    };
  }

  @Get("ready")
  public ready(): HealthResponse {
    return this.live();
  }
}

@Module({
  controllers: [HealthController],
})
export class FoundationModule {}
