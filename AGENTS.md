# SOLIS IAOS — reglas de implementación

## Autoridad

Leer, en orden:

1. `docs/baseline-v1.2/README.md`;
2. `docs/baseline-v1.2/01_PRODUCT/02-MVP-SCOPE.md`;
3. `docs/baseline-v1.2/02_ARCHITECTURE/01-SYSTEM-OVERVIEW.md`;
4. ADR aplicables;
5. documento del módulo afectado;
6. `docs/baseline-v1.2/04_IMPLEMENTATION/03-DEFINITION-OF-DONE.md`.

## Gate vigente

Este repositorio implementa únicamente Sprint 0 Foundation y su validación
local Sprint 0B. No contiene funcionalidades de negocio de Sprint 1+, conexión
OT, datos reales, control remoto ni Pilot Production.

## Reglas obligatorias

- Preservar el monolito modular y los límites `apps/` / `packages/`.
- Solo Telemetry Worker es una unidad de carga separada.
- MQTT se limita al plano industrial.
- Todo dato tenant-owned usa `tenant_id`, RLS forzada y pruebas negativas.
- No agregar Kubernetes, Kafka, Redis, MongoDB, microservicios ni módulos
  diferidos sin ADR aceptado.
- No incorporar secretos ni credenciales reales.
- OpenAPI y JSON Schema son contratos canónicos.
- Una historia no está terminada sin pruebas, observabilidad y documentación.
- No declarar cerrado Sprint 0B sin un `pnpm sprint0b` completo en `PASS`.

## Stop conditions

Detener el trabajo si una tarea introduce control remoto, acceso cross-tenant,
un servicio desplegable nuevo, un cambio contractual no versionado, una
conexión OT o una decisión de producto no aprobada.
