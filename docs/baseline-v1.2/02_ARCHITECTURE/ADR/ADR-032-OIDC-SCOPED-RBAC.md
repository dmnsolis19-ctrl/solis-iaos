# ADR-032 — OIDC y RBAC con scope

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 26-07-2026 |
| Detalla | ADR-018 |

## Contexto

Construir identidad propia y aplicar RBAC+ABAC general eleva riesgo y esfuerzo.

## Decisión

- delegar autenticación humana a un proveedor OIDC;
- MFA para administradores;
- mantener memberships, roles y scopes tenant/site en SOLIS IAOS;
- RBAC con scope durante MVP;
- ABAC solo cuando una política concreta lo exija.

## Consecuencias

- menor superficie de contraseñas;
- dependencia controlada mediante estándar OIDC;
- backend sigue siendo autoridad de autorización de recursos;
- sincronización de lifecycle de identidad y membership;
- proveedor debe seleccionarse antes de Sprint 1.

## Criterio de conformidad

Ningún claim del token concede acceso a un tenant sin membership activa en
SOLIS IAOS.

