# ADR-034 — Representación digital del activo en MVP

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 26-07-2026 |
| Acota | ADR-007 |

## Contexto

“Digital twin” en V1.0 agrupa identidad, variables, estado, historial,
documentos, mantenimiento y salud sin definir simulación, fidelidad o estado
deseado.

## Decisión

Durante el MVP, la representación digital es una vista compuesta de:

- identidad y jerarquía;
- plantilla/version;
- variables;
- último valor y calidad;
- conectividad;
- alarmas;
- histórico.

No existe un motor de twin, simulación física, estado deseado ni sincronización
bidireccional.

## Consecuencias

- lenguaje y alcance verificables;
- menor infraestructura;
- mantiene una base para analítica futura;
- documentación comercial debe evitar promesas de gemelo avanzado.

## Gate futuro

Un ADR definirá semántica de twin, fidelidad, sincronización y casos de uso antes
de crear un motor independiente.

