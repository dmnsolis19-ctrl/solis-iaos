# Changelog V1.2 — Sprint 0A

## Estado

| Campo | Valor |
|---|---|
| Fecha | 26 de julio de 2026 |
| Base | Architecture Baseline V1.1 |
| Resultado | GO condicionado para Sprint 0 Foundation |

## Decisiones

- AWS `sa-east-1`, ECS Fargate y tres cuentas.
- Cognito User Pools como OIDC inicial.
- AWS IoT Core con X.509 y ACL por gateway.
- IoT Rule → SQS Standard/DLQ → Telemetry Worker.
- RDS PostgreSQL 17 con particionado nativo.
- sin TimescaleDB, Kubernetes o control remoto en MVP.
- perfil piloto 50 muestras/s sostenidas, raw 30 días.
- perfil de referencia agua/bombeo con Modbus, condicionado a PO/OT.

## Nuevos artefactos

- OpenAPI v1.
- cinco JSON Schema MQTT.
- diccionario de tipos/unidades/calidad.
- namespace y matriz ACL.
- modelo físico y DDL v1.
- matriz de pruebas RLS.
- retención/particionado.
- matriz de autorización.
- threat model con 25 amenazas.
- PKI gateway y runbooks.
- topología AWS.
- capacity, backup/DR, SLO y costos.
- backlog de 77 historias/435 SP.
- RACI y plan FAT/SAT.
- ADR-036 a ADR-041.

## Correcciones

- 500 muestras/s y 90 días raw pasan de supuesto de piloto a horizonte de
  estrés/evolución.
- `system=ingeniero-ia` se corrige a `system=solis-iaos`.
- Telemetry Worker deja de depender de una sesión MQTT directa en producción.
- “PostgreSQL + extensión por definir” se concreta en PostgreSQL nativo.
- el gate separa inicio de Foundation de acceso a Pilot Production/OT.

## Compatibilidad

La visión Asset-First, Cloud+Edge, multi-tenant y SaaS industrial permanece. IA,
CMMS, documentos avanzados, marketplace, billing, control remoto y Kubernetes
siguen en roadmap, no en el MVP.
