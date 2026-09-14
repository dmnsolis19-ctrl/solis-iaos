# Retención, particionado y agregación

## Decisión del piloto

| Clase | Retención | Mecanismo |
|---|---:|---|
| Envelope dedupe | 35 días | borrado por job |
| Raw telemetry | 30 días | partición diaria; detach/drop |
| Agregado 1 min | 13 meses | partición mensual |
| Agregado 1 h | 36 meses | partición trimestral |
| Rechazos detallados | 30 días | partición mensual |
| Contadores de rechazo | 13 meses | agregado |
| Alarmas/transiciones | 36 meses | borrado controlado |
| Auditoría crítica | 36 meses | exportación antes de expirar |
| Configuración/assets | vida del tenant + política contractual | soft retirement |

La retención de V1.1 de 90 días raw no se adopta para el piloto: a 500
muestras/s habría 3.888 mil millones de muestras antes de considerar índices.

## Particiones

- Raw: rango diario por `source_time`.
- Crear con 7 días de anticipación.
- Mantener una alerta si quedan menos de 3 particiones futuras.
- No usar una partición `DEFAULT` permanente.
- Eliminar por `DETACH PARTITION`, verificación y `DROP`, no por `DELETE`
  masivo.
- Bloquear ingesta si falta partición solo después de enviar a rechazo/reintento
  durable; nunca descartar silenciosamente.

`pg_partman` y `pg_cron` son permitidos si la versión final de RDS los soporta.
Las migraciones siguen siendo la autoridad del esquema.

## Agregados

- `1m`: solo variables numéricas con `trend_enabled=true`.
- `1h`: derivado del agregado 1m, no de raw cuando sea posible.
- el bucket se expresa en UTC;
- la UI convierte a zona horaria del sitio;
- cada bucket conserva conteo total y conteo por calidad;
- una ventana vacía no se inventa como cero;
- los agregados se recalculan dentro de una ventana tardía de 24 h.

## Exportación y borrado

Antes de eliminar una clase contractual:

1. job registra particiones candidatas;
2. verifica watermark y agregados;
3. exporta cuando el contrato lo exija;
4. separa la partición;
5. registra bytes/filas y resultado;
6. elimina tras ventana de reversión;
7. emite métrica y audit entry operacional.

## Señales de extracción futura

Reevaluar un almacén histórico separado cuando dos pruebas consecutivas
demuestren alguna condición:

- ingestión consume más de 50 % de CPU/IO de base en horario normal;
- el histórico degrada transacciones por debajo del SLO;
- raw supera 2 TB activos;
- se requiere retención mayor a 90 días raw;
- se requiere más de 2.000 muestras/s sostenidas;
- el costo de partición/índices supera una alternativa gestionada validada.

