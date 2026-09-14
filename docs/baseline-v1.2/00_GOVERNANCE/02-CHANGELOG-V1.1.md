# Changelog V1.1

## Resumen

V1.1 corrige el sobrediseño del paquete V1.0 y establece una arquitectura
implementable sin abandonar la visión SOLIS IAOS.

## Cambios de arquitectura

| Área V1.0 | Cambio V1.1 | Motivo |
|---|---|---|
| Once microservicios | Monolito modular + worker de telemetría | Reducir fallos distribuidos y costo operativo |
| Base por servicio | Una base PostgreSQL con ownership lógico | Mantener transacciones y aislamiento verificable |
| Kubernetes como base | Contenedores sin Kubernetes en MVP | No existe requisito que justifique orquestación |
| MQTT para todo | MQTT reservado al plano Edge/nube | Evitar mezclar telemetría con eventos internos |
| Event Driven distribuido | Eventos internos + outbox | Conservar desacoplamiento sin infraestructura prematura |
| Control/commands | Excluidos del MVP | Proteger la frontera OT |
| Digital twin amplio | Representación digital compuesta | Evitar un motor innecesario |
| RBAC + ABAC general | RBAC con scope tenant/site | Reducir complejidad de autorización |
| Cinco protocolos | Simulador + un adaptador prioritario | Controlar riesgo de hardware e integración |
| Móvil equivalente | Consulta limitada; desktop/tablet prioritarios | Adecuación a operación industrial |

## Cambios de alcance

### Incluido

- tenant, membresías y roles;
- jerarquía industrial y activos;
- gateway, simulador y un adaptador;
- MQTT seguro y store-and-forward;
- telemetría, último valor e históricos;
- dashboard, tendencias y estados de calidad;
- reglas simples, alarmas y auditoría;
- exportación CSV y reporte fijo;
- backups, restauración y observabilidad.

### Diferido

- control remoto;
- IA/RAG y analítica avanzada;
- CMMS, órdenes de trabajo y repuestos;
- gestión documental completa;
- rule engine low-code;
- billing, licencias automáticas y marketplace;
- Kubernetes, multi-región y microservicios por capacidad;
- firmware OTA completo.

## ADR agregados

- ADR-026: monolito modular para el MVP.
- ADR-027: unidades desplegables del MVP.
- ADR-028: aislamiento multi-tenant compartido con RLS.
- ADR-029: MQTT limitado al plano industrial.
- ADR-030: control remoto excluido del MVP.
- ADR-031: PostgreSQL y series temporales.
- ADR-032: OIDC y RBAC con scope.
- ADR-033: Kubernetes diferido.
- ADR-034: alcance del gemelo digital.
- ADR-035: semántica de entrega de telemetría.

## Documentos V1.0 afectados

Los siguientes conceptos quedan reemplazados por esta baseline:

- `VOL2/01-Arquitectura-General.md`
- `VOL2/03-Arquitectura-Microservicios.md`
- `VOL2/04-Arquitectura-Backend.md`
- `VOL2/06-Comunicacion-Servicios.md`
- `VOL2/09-Message-Broker-Architecture.md`
- `VOL3/04-Digital-Twin-Architecture.md`
- `VOL3/08-Edge-Gateway-Architecture.md`
- `VOL3/11-MQTT-Industrial-Standard.md`
- `VOL3/12-Telemetry-Engine.md`
- `VOL4/07-Rule-Engine-Low-Code.md`
- `VOL4/09-CMMS-Architecture.md`
- `VOL5/18-MultiTenant-SaaS.md`
- `VOL6/04-Kubernetes-Architecture.md`
- `VOL7/02-MVP-Implementation-Plan.md`
- `VOL1/12_IMPLEMENTATION/MVP-SCOPE.md`

