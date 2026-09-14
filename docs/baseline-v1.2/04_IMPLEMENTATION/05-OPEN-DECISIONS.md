# Decisiones abiertas y cerradas en Sprint 0A

| ID | Decisión | Estado | Resolución/fecha límite |
|---|---|---|---|
| OD-01 | Planta piloto y primer protocolo | Condicionada | Perfil agua/Modbus; nominal antes Sprint 3 |
| OD-02 | Proveedor OIDC | Cerrada | Cognito, ADR-037 |
| OD-03 | Cloud/región/contenedores | Cerrada | AWS `sa-east-1` + ECS Fargate, ADR-036 |
| OD-04 | Broker | Cerrada | AWS IoT Core + SQS, ADR-038 |
| OD-05 | Series temporales | Cerrada | RDS PostgreSQL nativo, ADR-039 |
| OD-06 | Retención | Cerrada | ADR-040 y retention-partitioning |
| OD-07 | Roles/scopes | Cerrada | authorization-matrix |
| OD-08 | RPO/RTO | Cerrada técnica | 15 min/4 h; aprobación contractual antes prod |
| OD-09 | Canal de notificación | Abierta no crítica | antes Sprint 6 |
| OD-10 | Límites exportación | Abierta no crítica | antes Sprint 7 |
| OD-11 | Residencia datos Brasil | Abierta bloqueante prod | PO/Legal antes prod |
| OD-12 | Techo mensual y cuenta AWS | Abierta bloqueante prod | PO/Finanzas antes prod |
| OD-13 | Personas de incident response | Abierta bloqueante prod | CTO/Security antes prod |
| OD-14 | Aceptación formal ADR/alcance | Abierta bloqueante funcional | PO/Arquitectura antes Sprint 1 |

## Regla

Las decisiones abiertas no bloquean Foundation cuando su fecha límite es
posterior. No pueden cerrarse por implementación accidental: deben actualizar
el documento canónico y, si cambian arquitectura, generar ADR.

