# Alcance MVP V1.2

| Campo | Valor |
|---|---|
| Código | SOLIS-IAOS-PROD-MVP-001 |
| Estado | Propuesto para aceptación del gate |
| Tipo | MVP read-mostly |
| Mercado inicial | Empresas industriales medianas |
| Unidad de validación | Una planta piloto |

## Capacidades incluidas

### Control Plane mínimo

- creación y estado de tenant;
- usuarios federados mediante OIDC;
- memberships y roles con scope tenant/site;
- sitios, áreas y delegación explícita al integrador;
- entitlements configurados manualmente;
- auditoría de cambios administrativos.

### Asset Core

- jerarquía Tenant → Site → Area/System → Asset;
- tipos y plantillas versionadas;
- variables tipadas y unidades;
- relaciones entre activos;
- estados `ACTIVE`, `INACTIVE` y `RETIRED`;
- importación inicial controlada.

### Connectivity

- registro, activación, rotación y revocación de gateway;
- Edge Agent o simulador;
- un adaptador industrial prioritario;
- configuración versionada y confirmación de aplicación;
- diagnóstico básico y LWT;
- buffer store-and-forward.

### Telemetry

- MQTT 5 con mTLS y ACL;
- validación, normalización e idempotencia;
- timestamp de origen e ingesta;
- calidad, secuencia, gateway y señal de origen;
- último valor e históricos;
- retención y agregados;
- tiempo real agregado hacia frontend.

### Operations

- reglas de umbral con histéresis, deadband y debounce;
- eventos;
- alarmas con ciclo `ACTIVE → ACKNOWLEDGED → CLEARED → CLOSED`;
- reconocimiento con identidad, comentario y fecha;
- historial de transiciones;
- auditoría.

### Experience

- dashboard de sitio;
- inventario y vista de activo;
- último valor, estado y calidad;
- tendencias históricas;
- bandeja y detalle de alarmas;
- estados `online`, `stale`, `offline`, `bad quality`, `no data`;
- exportación CSV y reporte operacional fijo.

### Plataforma

- ambientes local, staging y piloto;
- CI/CD con gates;
- logs, métricas y trazas correlacionadas;
- backups y prueba de restauración;
- gestión de secretos;
- runbooks mínimos.

## Exclusiones obligatorias

- comandos o control remoto;
- cambios de setpoint desde nube;
- lógica de seguridad o interlocks en SOLIS IAOS;
- CMMS, órdenes de trabajo y repuestos;
- documentos completos y búsqueda;
- RAG, anomalías, predictivo y health score;
- rule engine low-code;
- n8n o Node-RED en la ruta crítica;
- billing, pagos y marketplace;
- firmware OTA completo;
- más de un protocolo real;
- Kubernetes, service mesh y multi-región.

## Restricciones

- El frontend no recibirá cada muestra industrial.
- Los históricos se consultan por HTTP; WebSocket solo distribuye último estado
  y alarmas.
- La identidad del certificado determina el gateway y tenant autorizados.
- Todo dato tenant-owned contiene `tenant_id`.
- No existe bypass global para integradores.
- El PLC nunca queda expuesto directamente a Internet.

## Criterios de aceptación de alcance

El alcance se congela cuando Product Owner y Arquitectura aprueben:

- planta piloto y protocolo;
- perfil de carga y retención;
- proveedor OIDC;
- topología de staging y producción piloto;
- roles y scopes;
- exclusiones del MVP.

Solicitudes posteriores se incorporarán por change request y análisis de impacto.
