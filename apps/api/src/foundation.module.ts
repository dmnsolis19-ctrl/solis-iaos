import { Controller, Get, Module, ServiceUnavailableException } from "@nestjs/common";
import { foundationReadiness } from "@solis/config";
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
  public ready() {
    const readiness = foundationReadiness(process.env.NODE_ENV ?? "development");
    if (!readiness.ready) {
      throw new ServiceUnavailableException({ status: "not_ready", ...readiness });
    }
    return { ...this.live(), ...readiness };
  }
}

@Module({
  controllers: [HealthController],
})
export class FoundationModule {}
