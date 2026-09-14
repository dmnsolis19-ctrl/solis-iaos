# SOLIS IAOS — Sprint 0A Closure Baseline V1.2

| Campo | Valor |
|---|---|
| Código documental | SOLIS-IAOS-MASTER-BASELINE-1.2 |
| Versión | 1.2 |
| Fecha | 26 de julio de 2026 |
| Estado | Cierre técnico de Sprint 0A; GO condicionado para Sprint 0 |
| Fuente | Baseline V1.1 + contratos y decisiones de Sprint 0A |
| Propietario | Arquitectura SOLIS IAOS |

## Propósito

Esta versión completa los bloqueantes técnicos de Sprint 0A y convierte la
visión de SOLIS IAOS en una baseline contractual para el MVP. Conserva la visión
**Industrial Asset Operating System**,
Asset-First, Cloud+Edge, multi-tenant y preparada para evolucionar hacia
mantenimiento, documentos, inteligencia artificial e integraciones.

La simplificación del MVP no elimina capacidades futuras. Separa:

- el **modelo de producto de largo plazo**;
- los **límites de dominio que deben preservarse**; y
- las **unidades que realmente deben desplegarse durante el MVP**.

## Decisión principal

El MVP se construirá como una plataforma de monitoreo industrial **read-mostly**:

- backend monolítico modular;
- worker independiente de ingesta de telemetría;
- aplicación web React;
- agente Edge con buffer local;
- AWS IoT Core MQTT 5 y cola duradera hacia el worker;
- RDS PostgreSQL con particionado nativo y agregados;
- Cognito OIDC y RBAC con scope;
- AWS `sa-east-1` sobre ECS Fargate;
- contenedores sin Kubernetes;
- sin control remoto ni IA en la ruta operacional.

## Orden de precedencia

Cuando exista una contradicción documental, se aplicará el siguiente orden:

1. ADR aceptado con número mayor que modifica o reemplaza una decisión previa.
2. Contratos y documentos de esta baseline V1.2.
3. Informe de revisión arquitectónica SOLIS-IAOS-ARC-REV-001.
4. Paquete maestro V1.0 como visión y referencia histórica.

No deben mantenerse dos documentos vigentes que definan de forma diferente la
misma decisión.

## Contenido

| Carpeta | Contenido |
|---|---|
| `00_GOVERNANCE` | Control documental, cambios, precedencia y trazabilidad |
| `01_PRODUCT` | Charter, alcance y matriz de módulos del MVP |
| `02_ARCHITECTURE` | Arquitectura objetivo, datos, Edge, seguridad y operación |
| `02_ARCHITECTURE/ADR` | Nuevas decisiones ADR-026 a ADR-035 |
| `03_MODULES` | Límites, ownership y cambios de módulos afectados |
| `04_IMPLEMENTATION` | Sprint 0A, plan de sprints, DoD y gate de arquitectura |
| `05_CONTRACTS` | OpenAPI, JSON Schema MQTT, ACL, tipos y unidades |
| `06_DATA` | Modelo físico, DDL, RLS, particionado y retención |
| `07_SECURITY` | Roles, threat model, PKI y runbooks |
| `08_OPERATIONS` | AWS, capacity, backup, observabilidad y costos |
| `09_BACKLOG` | Historias Sprint 0–8, RACI y aceptación del piloto |

## Dictamen

La arquitectura está lista para comenzar **Sprint 0 — Foundation** con GO
condicionado. Ya existen:

- OpenAPI y contratos MQTT v1;
- modelo físico/RLS y pruebas negativas;
- roles/scopes, threat model y PKI;
- proveedor, región y topología;
- capacity, retención, RPO/RTO y backup;
- backlog Sprint 0–8.

Siguen bloqueados Pilot Production y cualquier conexión OT hasta aprobar:

- planta y protocolo nominal;
- responsable OT y responsables de incidentes;
- residencia de datos en `sa-east-1`;
- presupuesto mensual;
- aceptación formal de ADR-026 a ADR-041.

El dictamen completo está en
`04_IMPLEMENTATION/06-SPRINT-0A-CLOSURE-REPORT.md`.
