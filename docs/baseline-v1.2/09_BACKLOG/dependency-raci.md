# Dependencias y RACI

## Roles

| Código | Rol |
|---|---|
| PO | Product Owner |
| ARCH | Arquitectura/CTO |
| BE | Backend/Data |
| FE | Frontend/UX |
| EDGE | Edge/Industrial |
| SEC | Seguridad |
| DEVOPS | Plataforma/DevOps |
| QA | QA |
| OT | Responsable de planta |

## Matriz

| Entregable | A | R | C | I |
|---|---|---|---|---|
| Alcance y exclusiones | PO | ARCH | OT, SEC | equipo |
| ADR | ARCH | ARCH | SEC, DEVOPS, EDGE | PO |
| OpenAPI | ARCH | BE | FE, SEC | QA |
| MQTT/telemetry contract | ARCH | EDGE, BE | SEC, OT | QA |
| Modelo físico/RLS | ARCH | BE | SEC | QA |
| Cognito/roles | SEC | BE, DEVOPS | PO | QA |
| PKI/ACL | SEC | EDGE, DEVOPS | ARCH, OT | QA |
| Landing zone/IaC | DEVOPS | DEVOPS | SEC, ARCH | PO |
| Capacity/load | ARCH | QA, BE, DEVOPS | EDGE | PO |
| Backup/restore | DEVOPS | DEVOPS, BE | SEC | PO |
| FAT Edge | EDGE | EDGE, QA | OT | ARCH |
| SAT piloto | PO | QA, OT | equipo | stakeholders |
| Go/No-Go beta | PO | ARCH | SEC, OT, DEVOPS | equipo |

`A` es único por fila. Una persona puede cubrir varios roles, pero la revisión
de seguridad y tenancy no debe ser solo del autor.

## Dependencias externas

| ID | Dependencia | Fecha necesaria | Bloquea |
|---|---|---|---|
| EXT-01 | cuenta AWS y billing | Sprint 0 | staging |
| EXT-02 | dominio/DNS/certificados web | Sprint 0 | OIDC/web |
| EXT-03 | tenant Cognito y MFA | Sprint 1 | identity |
| EXT-04 | acceso a AWS IoT Core | Sprint 3 | MQTT |
| EXT-05 | hardware/OS Edge aprobado | Sprint 3 | buffer/PKI |
| EXT-06 | planta, permiso y protocolo | antes Sprint 3 | adaptador/pilot |
| EXT-07 | responsable OT | antes Sprint 3 | threat/FAT/SAT |
| EXT-08 | presupuesto mensual | antes prod | Pilot Production |
| EXT-09 | términos/privacidad/retención | antes prod | datos reales |

## Stop conditions

- falta de OT owner;
- acceso a PLC sin ventana/permiso;
- necesidad de comando remoto;
- residencia de datos no aceptada;
- presupuesto no aprobado;
- RLS/ACL/restore fallidos;
- amenaza SEV-1 abierta.

