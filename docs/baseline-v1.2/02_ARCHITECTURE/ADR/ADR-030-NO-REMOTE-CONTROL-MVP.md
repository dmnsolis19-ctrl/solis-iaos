# ADR-030 — Control remoto fuera del MVP

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 26-07-2026 |
| Relacionado | ADR-017 |

## Contexto

Comandos, setpoints o control desde nube amplían el riesgo OT y requieren
interlocks, expiración, autorización por acción, replay protection y evidencia
de ejecución.

## Decisión

El MVP es read-mostly. No envía comandos de proceso, no modifica setpoints y no
ejecuta lógica de control crítico. Las protecciones permanecen en PLC/SIS y
equipos locales.

Configuración de mapeos y parámetros del Edge Agent no se considera comando de
proceso, pero debe versionarse, validarse y poder revertirse.

## Consecuencias

- menor riesgo de seguridad y responsabilidad operacional;
- caso de uso inicial enfocado;
- no se validan flujos de mando remoto;
- arquitectura conserva un namespace futuro, pero no lo implementa.

## Gate futuro

Un ADR posterior deberá definir permisos por acción/activo, TTL, idempotencia,
acknowledgement, interlocks, auditoría, replay protection y evaluación formal
de seguridad.

