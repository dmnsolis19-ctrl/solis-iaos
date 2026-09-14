# ADR-037 — Cognito como proveedor OIDC inicial

| Campo | Valor |
|---|---|
| Estado | Propuesto para aceptación |
| Fecha | 26-07-2026 |
| Detalla | ADR-032 |

## Contexto

ADR-032 delega autenticación, pero deja abierto el proveedor. Autogestionar
Keycloak agrega parches, HA, correo y recuperación al MVP.

## Decisión

Usar Amazon Cognito User Pools:

- OIDC/OAuth 2.0;
- TOTP obligatorio para administradores locales;
- federation OIDC para clientes futuros;
- memberships, roles y site scopes permanecen en SOLIS IAOS;
- tokens no conceden tenant sin membership activa;
- configuración separada nonprod/prod.

## Alternativas

- Keycloak: diferido hasta existir requisito de autogestión.
- Auth0/Entra External ID: válidos, pero agregan proveedor al stack inicial.
- identidad propia: rechazada.

## Consecuencias

- menor operación de identidad;
- dependencia AWS controlada por OIDC;
- MFA de federados depende del IdP upstream y debe verificarse;
- bloqueo de membership se aplica en backend incluso con token vigente.

## Revisión

Cuando SSO Enterprise, residencia, costo de MAU o funciones B2B superen Cognito.

