# SOLIS IAOS — Reglas para agentes en ChatGPT Work

## Autoridad documental

Antes de actuar, leer:

1. `README.md`
2. `01_PRODUCT/02-MVP-SCOPE.md`
3. `02_ARCHITECTURE/01-SYSTEM-OVERVIEW.md`
4. ADR aplicables
5. documento del módulo afectado
6. `04_IMPLEMENTATION/03-DEFINITION-OF-DONE.md`

Cuando exista conflicto, aplicar el orden de precedencia del README.

## Regla de inicio

El gate V1.2 permite únicamente Sprint 0 Foundation y staging sintético. No
generar funcionalidad de negocio de Sprint 1+, conectar OT, usar datos reales o
abrir Pilot Production hasta cumplir las condiciones del gate.

## Restricciones arquitectónicas

- Preservar Asset-First.
- Backend monolítico modular.
- Solo Telemetry Worker se separa por perfil de carga.
- MQTT se limita al plano industrial.
- PostgreSQL es la fuente transaccional.
- Todo dato tenant-owned incluye aislamiento y pruebas.
- Control remoto está excluido.
- No agregar Kubernetes, Kafka, Redis, MongoDB, vector DB, microfrontends o
  microservicios sin ADR y necesidad demostrada.
- No crear stubs de módulos diferidos.
- No modificar un ADR aceptado para cambiar su decisión.

## Formato mínimo de una tarea

- objetivo;
- contexto y ADR;
- archivos afectados;
- módulos y datos propietarios;
- criterios de aceptación;
- amenazas y permisos;
- pruebas;
- observabilidad;
- documentación a actualizar.

## Stop conditions

Detener y escalar cuando:

- una tarea contradice alcance o ADR;
- afecta seguridad OT;
- permite acceso cross-tenant;
- requiere un nuevo servicio desplegable;
- cambia contrato API/MQTT;
- cambia retención/RPO/RTO;
- introduce control remoto;
- no existe una decisión de producto necesaria.

## Cierre

No declarar una tarea completa hasta cumplir Definition of Done y registrar:

- pruebas ejecutadas;
- resultado;
- riesgos residuales;
- documentación modificada;
- decisión o excepción aprobada.
