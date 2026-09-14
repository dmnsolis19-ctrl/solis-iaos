# Índice de ADR V1.2

| ADR | Decisión | Estado |
|---|---|---|
| 026 | Monolito modular para el MVP | Propuesto |
| 027 | Unidades desplegables mínimas | Propuesto |
| 028 | Esquema compartido, tenant_id y RLS | Propuesto |
| 029 | MQTT limitado al plano industrial | Propuesto |
| 030 | Control remoto fuera del MVP | Propuesto |
| 031 | PostgreSQL y series temporales | Propuesto |
| 032 | OIDC y RBAC con scope | Propuesto |
| 033 | Kubernetes diferido | Propuesto |
| 034 | Representación digital sin motor de twin | Propuesto |
| 035 | At-least-once e idempotencia de telemetría | Propuesto |
| 036 | Landing zone AWS `sa-east-1` | Propuesto |
| 037 | Cognito como proveedor OIDC inicial | Propuesto |
| 038 | AWS IoT Core → SQS → Telemetry Worker | Propuesto |
| 039 | RDS PostgreSQL particionado nativo | Propuesto |
| 040 | Capacity y retención acotados al piloto | Propuesto |
| 041 | Perfil de referencia agua/Modbus | Condicionado |

La aprobación debe realizarse como conjunto porque las decisiones son
interdependientes. Cambiar una requiere revisar el impacto sobre datos,
seguridad, Edge, DevOps y alcance.

ADR-041 requiere además aprobación de Product Owner y responsable OT; no
autoriza conexión a una planta real.
