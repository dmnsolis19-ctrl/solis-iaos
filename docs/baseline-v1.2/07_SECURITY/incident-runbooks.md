# Runbooks mínimos de incidentes

## Severidad

| Nivel | Criterio | Respuesta inicial |
|---|---|---:|
| SEV-1 | fuga tenant, compromiso credencial, riesgo de pivot OT | 15 min |
| SEV-2 | ingesta/DB/broker indisponible, pérdida probable | 30 min |
| SEV-3 | degradación parcial sin pérdida inmediata | 4 h |
| SEV-4 | defecto menor o alerta preventiva | siguiente día hábil |

Los tiempos son objetivos internos del piloto, no SLA contractual.

## Roles

| Rol | Responsabilidad |
|---|---|
| Incident Commander | coordinar, declarar severidad, cerrar |
| Technical Lead | diagnóstico y mitigación |
| Security Lead | evidencia, contención, exposición |
| OT Liaison | coordinación con planta sin ordenar maniobras |
| Communications | actualización a tenant/stakeholders |
| Scribe | timeline, decisiones y evidencias |

Las personas nominales quedan pendientes del equipo operativo.

## IR-01 — Sospecha de fuga cross-tenant

1. declarar SEV-1;
2. conservar logs, correlation IDs y artefactos;
3. bloquear endpoint/versión afectada sin borrar evidencia;
4. invalidar sesiones o memberships implicadas;
5. evaluar alcance por tenants y ventana temporal;
6. corregir policy/query/migración y ejecutar suite RLS completa;
7. notificar según contrato/ley aplicable;
8. no reabrir hasta prueba negativa independiente.

## IR-02 — Gateway o certificado comprometido

1. declarar SEV-1;
2. revocar certificado y cerrar conexión;
3. suspender gateway/configuración;
4. informar OT Liaison; no modificar PLC desde cloud;
5. revisar topics, mensajes y mappings afectados;
6. reinstalar/rehabilitar según PKI con clave nueva;
7. validar firewall, host y ausencia de persistencia;
8. registrar causa, datos potencialmente falsos y ventana.

## IR-03 — Broker/cola/worker detenido

1. declarar SEV-2 si excede 15 min;
2. verificar que Edge buffer aumenta y no pierde;
3. restaurar componente sin vaciar cola;
4. limitar escalamiento para no saturar RDS;
5. vigilar lag, DLQ, duplicados y out-of-order;
6. ejecutar redrive por lotes;
7. confirmar recuperación hasta watermark;
8. documentar muestras perdidas solo si se demuestra pérdida.

## IR-04 — Base degradada o perdida

1. congelar despliegues/migraciones;
2. proteger ingesta en cola y Edge;
3. determinar failover frente a restore;
4. restaurar a instancia nueva;
5. aplicar parámetros, roles, RLS y secretos;
6. validar tenant isolation y checksums lógicos;
7. reanudar lectura antes que backlog de ingesta;
8. medir RPO/RTO real y registrar brecha.

## IR-05 — Disco/buffer Edge lleno

1. alertar SEV-2 si hay pérdida;
2. no borrar configuración ni credencial;
3. aplicar política documentada de overflow;
4. preservar contador y rango de mensajes descartados;
5. recuperar enlace/espacio sin abrir acceso entrante;
6. reconciliar watermark;
7. mostrar gap explícito en UI;
8. ajustar sizing/retención local.

## IR-06 — Vulnerabilidad crítica

1. evaluar explotabilidad y exposición en 4 h;
2. detener promoción del artefacto;
3. aislar componente si existe explotación;
4. parchear dependencia/imagen y regenerar SBOM;
5. promover el mismo digest probado;
6. rotar secretos si pudieron exponerse;
7. buscar indicadores;
8. aceptar excepción solo con dueño, mitigación y vencimiento.

## Evidencia de cierre

- timeline UTC;
- impacto y tenants;
- causa raíz y factores;
- acciones tomadas;
- RPO/RTO observado;
- datos perdidos o alterados;
- controles que funcionaron/fallaron;
- backlog con dueño y fecha;
- aprobación de Incident Commander y Security Lead.

