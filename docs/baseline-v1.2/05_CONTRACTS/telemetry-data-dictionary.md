# Diccionario de telemetría v1

## Regla general

Una variable se define una vez en Asset Core y cada muestra referencia su
`variableId`. Tipo y unidad del mensaje deben coincidir con esa definición.
No se convierten unidades silenciosamente durante la ingesta.

## Tipos canónicos

| Código | JSON | Uso | Restricción |
|---|---|---|---|
| `BOOLEAN` | boolean | estados discretos | `true`/`false` |
| `INT64` | string decimal | contadores/estados enteros | rango signed 64 bits; se persiste como `bigint` |
| `FLOAT64` | number | magnitudes analógicas | finito; no NaN/Infinity |
| `STRING` | string | estados textuales acotados | máximo 256 caracteres |

Binarios, arrays, objetos y blobs no son valores de telemetría v1.

`INT64` viaja como string (`"-9223372036854775808"` a
`"9223372036854775807"`) para evitar pérdida de precisión en runtimes
JavaScript. La validación de rango se ejecuta después de validar el patrón.

## Unidades

Se usa código UCUM cuando exista. La etiqueta de pantalla es separada.

| Magnitud | Código canónico | Símbolo mostrado |
|---|---|---|
| Adimensional | `1` | — |
| Porcentaje | `%` | % |
| Temperatura Celsius | `Cel` | °C |
| Presión | `Pa`, `kPa`, `bar` | Pa, kPa, bar |
| Caudal volumétrico | `m3/h`, `L/s` | m³/h, L/s |
| Nivel/longitud | `mm`, `cm`, `m` | mm, cm, m |
| Tensión | `V`, `kV` | V, kV |
| Corriente | `A` | A |
| Potencia | `W`, `kW` | W, kW |
| Energía | `kW.h` | kWh |
| Frecuencia | `Hz` | Hz |
| Velocidad rotacional | `r/min` | rpm |
| Tiempo | `ms`, `s`, `min`, `h` | ms, s, min, h |

Una unidad no incluida requiere alta explícita en el catálogo. Un porcentaje se
almacena de 0 a 100; no se interpreta como fracción 0 a 1.

## Calidad primaria

| Código | Significado | Uso de valor |
|---|---|---|
| `GOOD` | valor válido según fuente y mapeo | permitido para latest y reglas |
| `UNCERTAIN` | valor disponible con reserva | visible; reglas opt-in |
| `BAD` | lectura inválida o fuente en falla | no reemplaza un GOOD más reciente |
| `NO_DATA` | ausencia declarada | sin valor; actualiza estado de disponibilidad |

## Detalle de calidad

| Código | Calidad recomendada | Causa |
|---|---|---|
| `OK` | GOOD | lectura normal |
| `OUT_OF_RANGE` | UNCERTAIN/BAD | fuera de rango configurado |
| `SENSOR_FAILURE` | BAD | diagnóstico de sensor |
| `COMM_FAILURE` | BAD | error de comunicación local |
| `STALE_SOURCE` | UNCERTAIN | fuente no actualizada |
| `CLOCK_UNSYNCED` | UNCERTAIN | reloj Edge no confiable |
| `MAPPING_ERROR` | BAD | dirección o conversión inválida |
| `MANUAL_SUBSTITUTE` | UNCERTAIN | valor sustituido localmente |
| `NO_SAMPLE` | NO_DATA | fuente sin muestra |

## Reloj

| Código | Tratamiento |
|---|---|
| `SYNCED` | `sourceTime` participa en precedencia de latest |
| `UNSYNCED` | se conserva; se marca `CLOCK_UNSYNCED` |
| `UNKNOWN` | se conserva usando también `ingestedAt` |

La plataforma no corrige el timestamp original. Siempre registra `ingestedAt`
en UTC.

## Precedencia de latest

Una muestra puede reemplazar `latest_value` solo cuando:

1. pertenece a la misma variable y configuración compatible;
2. su tiempo de origen es posterior, o el mismo tiempo con secuencia mayor;
3. el reloj es utilizable según la política de la variable;
4. la transición de calidad está permitida.

Todas las muestras aceptadas permanecen en histórico aunque no actualicen
latest.

## Rechazos normalizados

| Código | Motivo |
|---|---|
| `CONTRACT_UNSUPPORTED` | versión no soportada |
| `SCHEMA_INVALID` | payload no valida |
| `IDENTITY_MISMATCH` | certificado/topic/payload inconsistentes |
| `GATEWAY_INACTIVE` | gateway retirado o bloqueado |
| `CONFIG_UNKNOWN` | versión de configuración desconocida |
| `MAPPING_UNKNOWN` | mapping o variable inexistente |
| `TYPE_MISMATCH` | tipo distinto del catálogo |
| `UNIT_MISMATCH` | unidad distinta de la variable |
| `PAYLOAD_LIMIT` | tamaño o muestras excedidas |
| `RATE_LIMIT` | cuota de gateway excedida |

Los rechazos no contienen secretos ni el payload completo en logs.
