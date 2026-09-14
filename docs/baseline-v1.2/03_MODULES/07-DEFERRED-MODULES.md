# Módulos diferidos y condiciones de entrada

| Módulo | Fase mínima | Condición antes de iniciar |
|---|---|---|
| Documents | Post-MVP | modelo de metadatos, permisos y object storage aprobados |
| Maintenance/CMMS | Post-MVP | flujo validado con usuarios y límite frente a CMMS externo |
| Work Orders | Post-MVP | ownership, estados y evidencia definidos |
| Spare Parts | Posterior | integración o inventario maestro decidido |
| AI Engineer/RAG | Posterior | corpus gobernado, evaluación, privacidad y ADR |
| Anomaly Detection | Posterior | baseline de datos y tasa de falsos positivos |
| Predictive Maintenance | Posterior | histórico suficiente y validación de negocio |
| Asset Health Score | Posterior | fórmula explicable y gobernanza |
| Billing | Comercial | pricing y proveedor de pagos aprobados |
| Marketplace | Comercial | modelo de extensión y seguridad |
| Control remoto | Gate de seguridad OT | ADR completo, interlocks y piloto separado |
| Firmware OTA | Posterior | firma, rollback, compatibilidad y recuperación |
| Kubernetes | Escala/Enterprise | criterios ADR-033 satisfechos |

## Compatibilidad con la visión

Los módulos permanecen en el mapa de producto. No se crean stubs, tablas,
servicios ni dependencias anticipadas en el MVP. La compatibilidad se preserva
mediante:

- identificadores estables;
- ownership de datos;
- outbox;
- APIs versionadas;
- assets y plantillas versionados;
- auditoría;
- límites de módulo.

## Regla de activación

Cada módulo diferido requiere:

1. problema y usuario;
2. resultado medible;
3. alcance y exclusiones;
4. ADR;
5. modelo de datos;
6. threat model;
7. capacidad y operación;
8. backlog y criterios de aceptación.

