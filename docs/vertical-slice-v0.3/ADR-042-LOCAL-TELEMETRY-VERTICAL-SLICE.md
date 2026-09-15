# ADR-042 — Corte vertical local de telemetría

| Campo     | Valor                                                      |
| --------- | ---------------------------------------------------------- |
| Estado    | Aceptado para V0.3 local                                   |
| Fecha     | 13-09-2026                                                 |
| Autoridad | Aprobación explícita del propietario del proyecto          |
| Acota     | ADR-031, ADR-038 y ADR-039 únicamente durante el prototipo |

## Contexto

Foundation V0.2.0 prepara la arquitectura empresarial, pero todavía no demuestra
el recorrido de una muestra desde un gateway hasta una visualización. Continuar
con los sprints 1–8 antes de esa prueba retrasa el aprendizaje técnico y de
producto.

## Decisión

Crear en `infra/mvp` un entorno aislado, sintético y local con:

- gateway simulator;
- Eclipse Mosquitto;
- Node-RED;
- InfluxDB OSS 2.9;
- Grafana.

El contrato MQTT v1 existente sigue siendo canónico. Node-RED actúa como
adaptador de prototipo y no como bus interno. InfluxDB es un historial de prueba,
no una sustitución aprobada de PostgreSQL/RDS para el producto.

## Límites

- datos exclusivamente sintéticos;
- sin PLC, red OT ni planta real;
- sin control remoto;
- sin exposición pública a Internet;
- sin AWS;
- una planta lógica, un tenant, un gateway y cuatro señales;
- no se declara Pilot Production ni se reemplaza la baseline V1.2.

## Salida esperada

1. Una muestra MQTT válida se persiste y aparece en Grafana.
2. Un payload inválido queda registrado como rechazo.
3. Los datos sobreviven al reinicio de contenedores.
4. Un gateway de laboratorio puede conectarse al puerto MQTT publicado con
   usuario y contraseña.

## Revisión

Tras recopilar volumen, facilidad operativa y comportamiento de recuperación,
se decidirá mediante otro ADR si InfluxDB continúa, si la telemetría vuelve a
PostgreSQL o si AWS adopta otra alternativa. No se mantendrán dos fuentes de
verdad sin una decisión explícita.
