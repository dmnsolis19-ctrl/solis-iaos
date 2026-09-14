# Módulo Telemetry

## Estado MVP

Incluido como dos responsabilidades:

- ingesta en Telemetry Worker;
- consultas en módulo backend.

## Ingesta

- consumir SQS autorizado alimentado por AWS IoT Core;
- resolver gateway/tenant desde metadatos confiables de conexión;
- validar schema/version;
- comprobar mapping/config version;
- normalizar tipos y unidades;
- persistir idempotentemente;
- registrar rechazos;
- actualizar último valor;
- emitir señal interna agregada.

## Consulta

- último valor;
- histórico por intervalo;
- resolución cruda o agregada;
- paginación/límite de puntos;
- exportación controlada;
- aplicación de scope y cuota.

## Invariantes

- sample inmutable;
- tenant/gateway derivado de contexto autenticado;
- variable pertenece al mismo tenant;
- message id no produce doble efecto;
- `source_time` y `ingested_time` se conservan;
- calidad nunca se infiere como buena por ausencia;
- sample tardío no retrocede latest value sin regla explícita.

## Estados de calidad

Contrato inicial:

- `GOOD`;
- `UNCERTAIN`;
- `BAD`;
- `NO_DATA`.

El adaptador puede aportar códigos de origen, pero la plataforma conserva una
clasificación canónica. `STALE` es un estado derivado de disponibilidad, no una
calidad primaria de muestra.

## Cambios respecto de V1.0

- semántica at-least-once;
- idempotencia y orden explícitos;
- worker separado;
- cola durable entre broker y worker;
- datos de tiempo real agregados;
- retención y capacity envelope;
- MQTT no distribuye eventos internos.

## Pruebas críticas

- duplicado;
- fuera de orden;
- batch parcial inválido;
- config version desconocida;
- pérdida y recuperación de worker;
- consultas grandes;
- aislamiento y retención.
