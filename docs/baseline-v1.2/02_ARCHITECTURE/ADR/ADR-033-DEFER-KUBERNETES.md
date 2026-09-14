# ADR-033 — Kubernetes diferido

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Fecha | 26-07-2026 |
| Acota | ADR-005, ADR-021 |

## Contexto

V1.0 prescribe Kubernetes sin carga, disponibilidad, número de servicios o
equipo operativo que lo requiera.

## Decisión

El MVP usa contenedores en una plataforma administrada o VM endurecida.
Docker/OCI mantiene portabilidad. Kubernetes no forma parte del piloto.

## Consecuencias

- menor costo y superficie operacional;
- menos mecanismos de recuperación automática;
- runbooks y monitoreo siguen siendo obligatorios;
- artefactos permanecen portables;
- IaC se adapta al proveedor elegido.

## Gate futuro

Reevaluar con múltiples réplicas, alta disponibilidad contractual, escalado
independiente, varios equipos o necesidades de red/política no cubiertas.

