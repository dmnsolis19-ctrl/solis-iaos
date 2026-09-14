# Trazabilidad de decisiones

| Hallazgo de auditoría | Decisión | Documento ejecutable |
|---|---|---|
| Microservicios prematuros | ADR-026/027 | System Overview, Backend Architecture |
| Aislamiento tenant indefinido | ADR-028 | Data Architecture, SaaS & Security |
| MQTT con responsabilidades mezcladas | ADR-029 | Edge, MQTT & Telemetry |
| Riesgo de comandos hacia OT | ADR-030 | Edge, MQTT & Telemetry |
| Persistencia no definida | ADR-031 | Data Architecture |
| Autorización demasiado amplia | ADR-032 | SaaS & Security |
| Kubernetes sin requisito | ADR-033 | Deployment & DevOps |
| Digital twin ambiguo | ADR-034 | Asset Core Module |
| Duplicados y fuera de orden | ADR-035 | Telemetry Module |
| Plan MVP incompleto | Alcance V1.1 | MVP Scope, Implementation Plan |
| Alarmas sin sprint completo | Sprint 6 | Implementation Plan |
| Reporte sin planificación | Sprint 7 | Implementation Plan |
| Ausencia de gate | Sprint 0A | Architecture Gate Checklist |
| Proveedor/región abiertos | ADR-036 | Pilot Topology |
| OIDC sin seleccionar | ADR-037 | Authorization Matrix |
| Worker acoplado a MQTT | ADR-038 | Pilot Topology, MQTT ACL |
| Extensión de series abierta | ADR-039 | DDL, Retention |
| Envelope sobredimensionado | ADR-040 | Capacity Sizing |
| Planta/protocolo sin perfil | ADR-041 | Pilot Acceptance Plan |
| OpenAPI ausente | Contrato API v1 | `05_CONTRACTS/openapi-v1.yaml` |
| MQTT sin schemas | Contratos MQTT v1 | `05_CONTRACTS/mqtt/*.json` |
| Modelo físico/RLS ausente | DDL v1 | `06_DATA/schema-v1.sql` |
| Threat model parcial | Threat model V1.2 | `07_SECURITY/threat-model.md` |

## Relación con ADR anteriores

| ADR previo | Estado bajo V1.2 |
|---|---|
| ADR-001 y ADR-006 Asset First | Vigentes |
| ADR-002 y ADR-019 Multi-tenant | Vigentes, detallados por ADR-028 |
| ADR-003 Microservices | Reemplazado para MVP por ADR-026; conservado como opción futura |
| ADR-004 Event Driven | Vigente dentro de límites definidos por ADR-029 |
| ADR-005 Cloud Native | Vigente como portabilidad por contenedores; Kubernetes diferido por ADR-033 |
| ADR-007 Digital Twin | Acotado por ADR-034 |
| ADR-008 Edge Computing | Vigente |
| ADR-009 MQTT Backbone | Acotado al plano industrial por ADR-029 |
| ADR-010 Protocol Abstraction | Vigente |
| ADR-011 a ADR-015 Operación | Vigentes; CMMS diferido |
| ADR-016 RAG First | Vigente para fase IA, fuera del MVP |
| ADR-017 AI Not Control | Vigente |
| ADR-018 Zero Trust | Vigente como principio; controles en SaaS & Security |
| ADR-020 Module Marketplace | Visión futura, fuera del MVP |
| ADR-021 a ADR-025 Ingeniería | Vigentes; Kubernetes no es requisito del ADR-021 |

## Precedencia V1.2

- ADR-036 detalla despliegue de ADR-027/033.
- ADR-037 concreta el proveedor abierto por ADR-032.
- ADR-038 conserva MQTT industrial de ADR-029 y agrega backpressure durable.
- ADR-039 reemplaza para el MVP la extensión pendiente de ADR-031.
- ADR-040 reemplaza los números de NFR/retención V1.1.
- ADR-041 es condicionado y no autoriza una planta real.
