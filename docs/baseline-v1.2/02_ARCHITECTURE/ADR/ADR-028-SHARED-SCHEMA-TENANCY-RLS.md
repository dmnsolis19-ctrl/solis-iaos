# ADR-028 — Esquema compartido con tenant_id y RLS

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 26-07-2026 |
| Detalla | ADR-002, ADR-019 |

## Contexto

V1.0 exige multi-tenant, pero no define aislamiento. Base por tenant incrementa
operación y migraciones; aislamiento solo en aplicación no ofrece defensa en
profundidad.

## Decisión

El MVP usa PostgreSQL compartido:

- `tenant_id` no nulo en datos tenant-owned;
- claves únicas y foráneas tenant-aware;
- RLS deny-by-default;
- rol de aplicación sin ownership ni BYPASSRLS;
- scopes en aplicación;
- pruebas automáticas negativas.

El integrador obtiene memberships explícitas.

## Alternativas

- Base por tenant: diferida a contratos Enterprise.
- Esquema por tenant: rechazada por migraciones y proliferación.
- Filtro solo en aplicación: rechazado por riesgo de fuga.

## Consecuencias

- menor costo operativo;
- consultas y migraciones uniformes;
- disciplina estricta en claves y jobs;
- pruebas de aislamiento obligatorias;
- operaciones administrativas excepcionales requieren rol y auditoría propios.

## Criterio de revisión

Evaluar base dedicada ante regulación, residencia, volumen o contrato que lo
justifique.

