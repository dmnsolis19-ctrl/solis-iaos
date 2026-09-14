# Matriz de pruebas RLS y aislamiento

## Datos mínimos

- tenant A y tenant B;
- dos sitios por tenant;
- un usuario con membership solo A;
- un usuario con membership A limitada a site A1;
- un integrador delegado a A1 y B1;
- un usuario suspendido;
- un gateway por tenant;
- activos, variables, muestras y alarmas con códigos deliberadamente iguales.

## Casos

| ID | Actor/contexto | Operación | Resultado |
|---|---|---|---|
| RLS-001 | usuario A, tenant A | leer asset A | permitido |
| RLS-002 | usuario A, tenant A | leer asset B por UUID conocido | 404/0 filas |
| RLS-003 | usuario A, tenant A | actualizar asset B | 404/0 filas |
| RLS-004 | usuario A, tenant A | insertar hijo con parent B | FK/RLS rechaza |
| RLS-005 | sin `app.tenant_id` | listar cualquier tabla tenant-owned | 0 filas |
| RLS-006 | tenant vacío/inválido | iniciar operación | falla segura |
| RLS-007 | usuario A1 | leer asset A2 | 403 en aplicación |
| RLS-008 | integrador A1+B1 | leer A1 y B1 en transacciones separadas | permitido |
| RLS-009 | integrador A1+B1 | conservar tenant A al reutilizar conexión para B | imposible por `SET LOCAL` |
| RLS-010 | membership suspendida | leer datos antes permitidos | 403 |
| RLS-011 | rol app | ejecutar `SET row_security=off` | sin efecto/denegado |
| RLS-012 | rol app | consultar catálogo de secretos | denegado |
| RLS-013 | rol worker con tenant A | insertar muestra de variable B | FK/RLS rechaza |
| RLS-014 | payload A declara gateway B | ingestar | `IDENTITY_MISMATCH` |
| RLS-015 | job tenant A | procesar outbox B | 0 filas |
| RLS-016 | auditor A | leer auditoría B | 0 filas |
| RLS-017 | tenant A | exportar rango con variable B | 403/404 |
| RLS-018 | usuario A | usar cursor emitido para B | cursor inválido |
| RLS-019 | usuario A | buscar código común en A/B | solo A |
| RLS-020 | platform support sin elevación | leer tenant | denegado |
| RLS-021 | platform support con caso aprobado | acceso temporal | permitido y auditado |
| RLS-022 | rol runtime | `UPDATE audit.audit_entry` | denegado |
| RLS-023 | rol runtime | `DELETE telemetry.sample` | denegado |
| RLS-024 | request concurrente A/B mismo pool | 1.000 iteraciones | cero fugas |

## Criterios

- cero filas cross-tenant observadas;
- todos los intentos denegados generan métrica sin filtrar datos;
- los errores externos no confirman existencia de UUID ajeno;
- el test inspecciona que cada tabla tenant-owned tenga RLS `enabled` y
  `forced`;
- el test falla si un rol runtime tiene ownership o `rolbypassrls=true`;
- ejecución obligatoria en CI con PostgreSQL real.

## Query de control

Sprint 0 incorporará una prueba de catálogo que compare las tablas declaradas
tenant-owned con `pg_class.relrowsecurity`, `relforcerowsecurity`, policies,
grants y propietarios. Una tabla nueva sin clasificación hace fallar CI.

