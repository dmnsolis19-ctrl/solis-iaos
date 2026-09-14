# Informe de cierre de Sprint 0A

| Campo | Valor |
|---|---|
| Código | SOLIS-IAOS-ARC-GATE-002 |
| Fecha | 26 de julio de 2026 |
| Baseline | V1.2 |
| Dictamen | GO condicionado para Sprint 0 — Foundation |

## Resumen ejecutivo

La V1.1 era una arquitectura implementable en dirección, pero conservaba
bloqueantes en contratos, modelo físico, proveedor, seguridad y capacity. V1.2
los convierte en artefactos verificables.

Ya no se justifica continuar únicamente con documentación. Sprint 0 puede crear
la plataforma base y staging sintético. Sin embargo, aún no existe autorización
para Pilot Production ni conexión a OT porque faltan decisiones externas.

## Entregables

| # | Entregable | Resultado |
|---:|---|---|
| 1 | Product Charter | completo; firma pendiente |
| 2 | Context/Container | completo y actualizado AWS |
| 3 | ADR | 026–041 listos |
| 4 | Modelo físico/RLS | DDL + 24 pruebas |
| 5 | SaaS roles | matriz completa |
| 6 | MQTT v1 | topics, ACL y 5 schemas |
| 7 | Telemetría | tipos, unidades, calidad, clock |
| 8 | OpenAPI | contrato inicial v1 |
| 9 | Threat model | 25 amenazas y mitigaciones |
| 10 | NFR/capacity | envelope piloto corregido |
| 11 | Despliegue | AWS `sa-east-1`, ECS/RDS/IoT |
| 12 | Backlog | 77 historias, 435 SP, RACI |

## Cambios de arquitectura

- IoT Core entrega a SQS antes del worker.
- RDS PostgreSQL nativo reemplaza extensión de series pendiente.
- raw baja a 30 días en piloto.
- capacity sostenido baja a 50/s; 1.000/s es stress breve.
- Cognito concreta OIDC.
- AWS São Paulo concreta región y topología.
- el sistema sigue sin control remoto.

## Riesgos residuales

| Riesgo | Estado | Bloquea |
|---|---|---|
| Planta/protocolo no nominal | Abierto | Sprint 3/conexión OT |
| Residencia Brasil no aprobada | Abierto | Pilot Production |
| Presupuesto no aprobado | Abierto | Pilot Production |
| Incident responders no nominales | Abierto | Pilot Production |
| Capacity/restore no medidos | Planificado | Pilot Production |
| ADR sin aceptación formal | Abierto | Sprint 1 funcional |

## Trabajo permitido

- monorepo;
- CI y contract validation;
- base local/efímera;
- migraciones y pruebas RLS;
- IaC nonprod;
- observabilidad;
- deploy vacío a staging sintético;
- simulador contractual.

## Trabajo prohibido

- datos reales;
- conexión a PLC/planta;
- Pilot Production;
- control remoto;
- módulo diferido;
- Kubernetes;
- bypass de RLS/ACL;
- ampliar protocol adapters.

## Recomendación

Comenzar Sprint 0 Foundation con FND-01 a FND-10. En paralelo, el Product Owner
debe cerrar OD-11, OD-12, OD-13 y OD-14; OD-01 debe cerrarse antes de Sprint 3.

Si una condición no se cumple, se detiene el hito correspondiente. No se debe
volver a una fase documental general: se resuelve la decisión concreta o se
ajusta el alcance mediante ADR.
