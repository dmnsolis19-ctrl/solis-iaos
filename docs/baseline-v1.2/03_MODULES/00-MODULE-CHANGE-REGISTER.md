# Registro de cambios por módulo V1.2

| Módulo V1.0 | Tratamiento V1.2 | Cambio |
|---|---|---|
| Identity Service | Integración + módulo | OIDC externo; authorization local |
| Tenant Service | Control Plane | Unido a memberships, roles, scopes y entitlements |
| Asset Service | Asset Core | Plantillas versionadas y ownership definido |
| Gateway Service | Connectivity | Identidad, mapping y configuración versionada |
| Telemetry Service | Worker + query module | Ingesta separada de consultas |
| Event Service | Operations | Unido a reglas y alarmas |
| Alarm Service | Operations | Mismo límite transaccional que eventos |
| Maintenance Service | Diferido | Fuera del MVP |
| Document Service | Diferido | Fuera del MVP |
| AI Service | Diferido | Fuera del MVP |
| Integration Service | Mínimo/diferido | Solo notificación esencial por outbox |
| Dashboard | Experience | SPA por funcionalidades, sin microfrontends |
| Report Engine | Reporting Basic | CSV y reporte fijo, sin motor genérico |

## Ajustes de Sprint 0A

| Módulo | Ajuste V1.2 |
|---|---|
| Control Plane | Cognito autentica; SOLIS mantiene memberships/scopes |
| Asset Core | DDL, FK tenant-aware y catálogo tipo/unidad |
| Connectivity | AWS IoT identity, X.509, ACL y config schemas |
| Telemetry | SQS desacopla broker/worker; raw particionado 30 días |
| Operations | estado/transition/outbox definidos físicamente |
| Reporting | jobs limitados y URLs temporales |
| Audit | append-only, redactado y con correlación |

## Principio

Los módulos son límites de responsabilidad y datos. Solo se convierten en
servicios desplegables cuando existe evidencia.

## Reglas de ownership

1. Un módulo es el único escritor de sus tablas.
2. Las invariantes se aplican dentro del módulo propietario.
3. Las consultas cruzadas no autorizan escrituras cruzadas.
4. Los eventos internos no sustituyen una transacción local.
5. Todo módulo tenant-owned aplica scope y RLS.
6. Los módulos diferidos no pueden ser dependencias del MVP.
