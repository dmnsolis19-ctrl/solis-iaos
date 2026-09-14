# Sprint 0A — Cierre de arquitectura V1.2

## Objetivo

Convertir la baseline V1.1 en una decisión aprobada y completar los contratos que
bloquean el desarrollo. No incluye código de producto.

## Entregables y estado

| # | Entregable | Estado V1.2 | Trabajo restante |
|---:|---|---|---|
| 1 | Product Charter | Completo | Firma PO |
| 2 | Context/Container | Completo | Ninguno técnico |
| 3 | ADR corregidos | Completo 026–041 | Aceptación formal |
| 4 | Modelo físico de datos | Completo | Convertir DDL a migraciones en Sprint 0 |
| 5 | Modelo SaaS | Completo | Ninguno técnico |
| 6 | Contrato MQTT v1 | Completo | Tests CI en Sprint 0 |
| 7 | Contrato telemetría | Completo | Tests CI en Sprint 0 |
| 8 | OpenAPI inicial | Completo | Generar mocks/validación en Sprint 0 |
| 9 | Threat model | Completo diseño | Asignar personas y tabletop antes piloto |
| 10 | NFR/capacity envelope | Completo objetivo | Medir antes Pilot Production |
| 11 | Topología de despliegue | Completo | Aprobar residencia/costo |
| 12 | Backlog MVP | Completo, 77 historias | Calibrar velocidad del equipo |

## Actividades

1. Taller de producto y planta piloto.
2. Aprobación conjunta de ADR.
3. Modelado físico y pruebas de aislamiento.
4. Formalización de contratos API/MQTT/telemetría.
5. Threat modeling IT/OT.
6. Prueba rápida de compatibilidad PostgreSQL/series temporales.
7. Selección OIDC, cloud/región y broker.
8. Simulación del capacity envelope.
9. Conversión del plan macro en historias.
10. Revisión del gate.

## No permitido durante Sprint 0A

- implementar funcionalidades;
- crear microservicios;
- desplegar Kubernetes;
- incluir módulos diferidos;
- decidir control remoto por omisión;
- fijar proveedor sin registrar impacto.

Spikes desechables pueden utilizarse solo para validar compatibilidad; no forman
parte del producto ni fijan arquitectura por accidente.

## Resultado

- contratos, datos, seguridad, topología y backlog están cerrados técnicamente;
- Sprint 0 Foundation puede comenzar con GO condicionado;
- no se autoriza Pilot Production ni conexión OT;
- condiciones externas están registradas con dueño y fecha límite.

El dictamen está en `06-SPRINT-0A-CLOSURE-REPORT.md`.
