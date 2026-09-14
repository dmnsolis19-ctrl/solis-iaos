# Informe de validación de Baseline V1.2

| Campo | Resultado |
|---|---|
| Fecha | 26 de julio de 2026 |
| Archivos fuente validados | 81 antes de este informe |
| Markdown | PASS |
| ADR | PASS, secuencia 026–041 |
| OpenAPI | PASS |
| JSON Schema | PASS |
| Ejemplos contractuales | PASS |
| DDL | revisión estructural; ejecución real pendiente Sprint 0 |

## OpenAPI

- parser YAML: correcto;
- OpenAPI 3.1;
- 15 paths;
- 23 component schemas;
- lint con Redocly CLI: válido, cero warnings;
- no existen rutas de command, setpoint, start/stop o bypass.

## JSON Schema

Los cinco schemas MQTT compilaron con:

- JSON Schema Draft 2020-12;
- AJV;
- formatos UUID/date-time.

Pruebas:

- telemetry válido: aceptado;
- config desired válido: aceptado;
- telemetry `NO_DATA` con valor: rechazado como se esperaba.

## Documentación

- 71 Markdown antes de este informe;
- un H1 por archivo;
- cercos de código/Mermaid balanceados;
- no se detectaron links Markdown relativos inexistentes;
- sin tipos de archivo inesperados.

## Consistencia

- ADR consecutivos 026–041;
- MQTT no se usa como bus interno;
- control remoto permanece excluido;
- `system=solis-iaos` es el tag canónico;
- capacity/retención V1.2 reemplazan V1.1;
- Pilot Production y OT permanecen bloqueados por el gate.

## Limitación deliberada

`06_DATA/schema-v1.sql` es DDL de referencia. No se ejecutó contra PostgreSQL
porque Sprint 0 debe convertirlo en migraciones incrementales, fijar el minor de
PostgreSQL 17, crear particiones y comprobar RLS/grants con roles runtime reales.
El gate no permite tratar una revisión textual como prueba de base.

