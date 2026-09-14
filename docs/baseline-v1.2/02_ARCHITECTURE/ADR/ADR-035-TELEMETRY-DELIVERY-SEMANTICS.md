# ADR-035 — Semántica de entrega de telemetría

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 26-07-2026 |

## Contexto

QoS 1 puede duplicar mensajes; desconexiones generan replay y el reloj Edge puede
ser incorrecto. Prometer exactly-once ocultaría fallos reales.

## Decisión

- entrega at-least-once desde Edge;
- buffer persistente antes de publicar;
- `message_id`/secuencia estable;
- persistencia idempotente;
- timestamp de origen e ingesta;
- calidad y estado de reloj;
- reglas explícitas para fuera de orden;
- errores y descartes observables.

`latest value` solo avanza según precedencia determinista.

## Consecuencias

- tolerancia a reconexiones;
- almacenamiento de metadatos adicional;
- pruebas obligatorias de replay;
- consumidores deben soportar duplicados;
- no se garantiza cero pérdida fuera de capacidad del buffer.

## Métricas

- duplicados;
- mensajes fuera de orden;
- lag;
- rechazos por contrato;
- uso de buffer;
- tiempo desde origen a persistencia.

