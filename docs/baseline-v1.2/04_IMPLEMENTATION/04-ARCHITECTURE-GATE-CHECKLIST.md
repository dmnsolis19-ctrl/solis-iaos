# Gate para autorizar Sprint 0 — Evaluación V1.2

Leyenda: `[x]` completo; `[~]` completo técnicamente con aprobación/evidencia
externa pendiente; `[ ]` bloqueante no resuelto.

## Producto

- [~] Planta piloto representada por perfil agua/Modbus; planta nominal antes de Sprint 3.
- [x] Usuarios primarios definidos.
- [~] Promesa del MVP documentada; firma PO pendiente.
- [~] Inclusiones y exclusiones documentadas; firma PO pendiente.
- [x] Control remoto confirmado fuera de alcance.

## Arquitectura

- [~] ADR-026 a ADR-041 listos; aceptación formal pendiente.
- [x] Unidades desplegables definidas.
- [x] Límites de módulos revisados.
- [x] No hay decisiones técnicas críticas contradictorias vigentes.

## Datos y SaaS

- [x] Modelo físico inicial y DDL.
- [x] Estrategia RLS y matriz de 24 pruebas.
- [x] Matriz tenant/integrador/roles.
- [x] Retención V1.2 definida.
- [x] PostgreSQL nativo/particionado seleccionado.

## Contratos

- [x] OpenAPI v1 inicial.
- [x] JSON Schema MQTT v1.
- [x] Contrato de calidad/tipos/unidades.
- [x] Política de versionamiento.
- [x] Casos de duplicado, orden y clock documentados.

## Seguridad

- [x] Threat model con 25 amenazas.
- [x] Cognito seleccionado.
- [x] TOTP administrador definido.
- [x] PKI de gateway definida.
- [x] ACL y pruebas negativas definidas.
- [x] Secrets Manager y reglas de secreto definidos.
- [~] Runbooks definidos; personas nominales pendientes antes del piloto.

## Operación

- [x] AWS `sa-east-1` y topología elegidos.
- [x] Capacity envelope técnico V1.2.
- [x] RPO 15 min/RTO 4 h propuestos.
- [x] Backup/restore diseñado.
- [x] Métricas, SLO y alertas.
- [~] Rango de costo definido; techo PO/Finanzas pendiente antes de prod.

## Ejecución

- [x] Backlog Sprint 0–8 con 77 historias.
- [x] Dependencias y RACI.
- [x] Definition of Done.
- [x] Monorepo y trunk-based/main protegida definidos.
- [x] Criterio Go/No-Go definido.

## Decisión del 26 de julio de 2026

**GO condicionado para Sprint 0 — Foundation.**

Permite repositorio, CI, IaC nonprod, contratos, migraciones, observabilidad y
staging sintético. No permite datos reales, Pilot Production ni conexión a OT.

Condiciones con fecha:

| Condición | Dueño | Límite |
|---|---|---|
| Aceptar ADR y alcance | PO + Arquitectura | antes de merge funcional Sprint 1 |
| Confirmar planta/protocolo/OT owner | PO + OT | antes de Sprint 3 |
| Aprobar residencia en São Paulo | PO/Legal | antes de Pilot Production |
| Aprobar techo mensual/cuenta | PO/Finanzas | antes de Pilot Production |
| Nombrar incident roles | CTO/Security | antes de Pilot Production |
| Medir capacity y restore | QA/DevOps | antes de Pilot Production |

## Regla general

| Resultado | Regla |
|---|---|
| GO | Todos los bloqueantes en verde |
| GO condicionado | Solo pendientes no críticos con dueño y fecha |
| NO-GO | Falta alcance, tenancy, contratos, threat model o topología |

La aceptación formal debe registrar fecha, aprobadores, excepciones y
vencimiento. Incumplir una condición detiene el hito que bloquea, no autoriza
saltarla por implementación.
