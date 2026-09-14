# Backup, restore y recuperación

## Objetivos

| Clase | RPO | RTO |
|---|---:|---:|
| Configuración, assets, alarmas, auditoría | 15 min | 4 h |
| Telemetría confirmada en cloud | 15 min | 8 h |
| Telemetría no confirmada | protegida por Edge 24 h nominal | reenvío tras servicio |
| Web/containers/IaC | último artefacto aprobado | 2 h |

RPO/RTO son objetivos internos del piloto pendientes de aprobación contractual.

## Copias

| Activo | Control |
|---|---|
| RDS | automated backup + PITR, 35 días |
| Snapshot RDS | diario; copia cross-account según clase |
| S3 reportes | versioning, lifecycle, cifrado |
| Logs/auditoría exportada | cuenta `solis-security-backup` |
| IaC/configuración | repositorio protegido y artefacto inmutable |
| IoT registry/policies | definición Terraform y export de inventario |
| Edge config | versión activa + anterior en host; copia canónica cloud |
| Claves privadas Edge | no se respaldan en cloud; se reemiten |

Multi-AZ mejora disponibilidad, pero no sustituye backup.

## Restauración RDS

1. declarar incidente y congelar migraciones;
2. seleccionar point-in-time y crear instancia nueva;
3. aplicar parameter/subnet/security groups aprobados;
4. recuperar secretos por referencia;
5. verificar versión/extensiones;
6. ejecutar smoke de esquema, FK y RLS;
7. comparar conteos/watermarks por tenant;
8. conectar backend en solo lectura;
9. reanudar escritura y worker con límite;
10. procesar cola/Edge por orden controlado;
11. registrar RPO/RTO observado.

Nunca se restaura sobre la instancia fuente.

## Orden de recuperación

1. identidad y secretos;
2. base y RLS;
3. backend lectura;
4. cola y worker limitado;
5. alarmas/outbox;
6. reportes y funciones no críticas.

La ingesta se drena gradualmente para no provocar una segunda caída.

## Pruebas

- antes de Pilot Production;
- trimestral durante piloto;
- después de cambio mayor de base/backup;
- muestra de dos tenants;
- incluye restauración a cuenta/entorno aislado;
- mide no solo “job successful”, sino uso real por aplicación;
- elimina el entorno de prueba después de preservar evidencia.

## Criterios de aceptación

- restore dentro de 4 h para datos transaccionales;
- pérdida observada ≤15 min;
- RLS y grants idénticos a baseline;
- ningún secreto expuesto;
- telemetría pendiente recuperada sin doble alarma;
- informe firmado con desviaciones y acciones.

## Escenarios sin promesa

El piloto no promete cero pérdida si:

- la caída excede buffer local;
- disco Edge falla;
- PLC/fuente nunca entregó datos;
- operador borra físicamente credenciales sin backup permitido;
- existe corrupción previa no detectada dentro de retención.

