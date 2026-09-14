# Módulo Operations

## Estado MVP

Incluido. Fusiona Event Service, Alarm Service y reglas simples en un único
límite transaccional.

## Responsabilidades

- definiciones de regla de umbral;
- evaluación;
- eventos;
- alarmas;
- transiciones;
- acknowledgement;
- auditoría;
- outbox de notificación.

## Reglas MVP

Configuración declarativa limitada a:

- variable;
- operador;
- umbral;
- severidad;
- histéresis/deadband;
- debounce;
- ventana/frescura;
- estado habilitado;
- versión.

No existe editor low-code genérico ni acciones arbitrarias.

## Ciclo de alarma

`ACTIVE → ACKNOWLEDGED → CLEARED → CLOSED`

Transiciones MVP:

| Desde | Hacia | Disparador |
|---|---|---|
| ACTIVE | ACKNOWLEDGED | usuario autorizado reconoce con comentario/política |
| ACTIVE | CLEARED | la condición desaparece antes del reconocimiento |
| ACKNOWLEDGED | CLEARED | la condición desaparece |
| CLEARED | ACTIVE | la misma ocurrencia vuelve dentro de la ventana definida |
| CLEARED | CLOSED | cierre autorizado; registra actor y sirve como reconocimiento final si estaba pendiente |

`CLOSED` es terminal para esa ocurrencia. Una condición posterior crea una nueva
ocurrencia. Nunca se borra la historia de transiciones.

## Invariantes

- una alarma pertenece a una regla, activo y tenant;
- la misma condición no crea instancias duplicadas activas;
- acknowledgement registra actor y fecha;
- clear proviene de condición evaluada o acción autorizada definida;
- close no elimina evidencia;
- severidad y regla aplicadas quedan versionadas.

## Tormenta de alarmas

MVP incluye histéresis, debounce y deduplicación. Supresión avanzada,
correlación y causa raíz se difieren, pero se miden tasas y repetición.

## Cambios respecto de V1.0

- Event y Alarm comparten transacción;
- rule engine low-code se reduce a umbrales;
- no crea automáticamente órdenes de trabajo;
- notificaciones se ejecutan fuera de transacción mediante outbox;
- acciones OT están prohibidas.

## Pruebas críticas

- rebote de umbral;
- reconocimiento concurrente;
- clear antes de ack;
- duplicación por replay;
- tormenta;
- usuario sin scope;
- transición y auditoría atómicas.
