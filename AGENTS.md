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

La baseline Sprint 0 Foundation y su validación Sprint 0B permanecen intactas.
ADR-042 autoriza además V0.3 como corte vertical local, sintético y aislado en
`infra/mvp`. Este prototipo no autoriza conexión OT, datos reales, control
remoto, staging ni Pilot Production.

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
- Node-RED e InfluxDB solo pueden usarse en el prototipo `infra/mvp`; no
  reemplazan la arquitectura de producto sin un nuevo ADR.

## Stop conditions

Detener el trabajo si una tarea introduce control remoto, acceso cross-tenant,
un servicio desplegable nuevo, un cambio contractual no versionado, una
conexión OT o una decisión de producto no aprobada.
