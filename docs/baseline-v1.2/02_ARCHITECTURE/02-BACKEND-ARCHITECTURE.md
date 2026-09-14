# Arquitectura backend

## Estilo

Backend TypeScript organizado como **monolito modular orientado a dominios**.
El framework recomendado es NestJS sobre una versión LTS compatible de Node.js.
El framework no sustituye los límites de dominio.

## Capas por módulo

| Capa | Responsabilidad | Prohibición |
|---|---|---|
| API | HTTP, DTO, autenticación, serialización | Reglas de negocio |
| Application | Casos de uso, autorización contextual y transacciones | SQL ad hoc |
| Domain | Invariantes, entidades, políticas y eventos | Dependencias de infraestructura |
| Infrastructure | Repositorios, OIDC, outbox, almacenamiento | Decisiones de negocio |

## Módulos iniciales

- `control-plane`
- `asset-core`
- `connectivity`
- `telemetry-query`
- `operations`
- `reporting-basic`
- `audit`
- `realtime`

Identity es una integración OIDC y no un proveedor de contraseñas propio.
Telemetry Ingest se ejecuta en el worker y consume una cola duradera alimentada
por AWS IoT Core. Comparte contratos y librerías versionadas con el backend.

## Límites transaccionales

| Operación | Propietario | Transacción |
|---|---|---|
| Crear tenant/membership | Control Plane | tenant + membership + audit |
| Crear activo desde plantilla | Asset Core | asset + variables + audit |
| Activar gateway | Connectivity | gateway + credential reference + audit |
| Persistir muestra | Telemetry Worker | sample idempotente + latest value |
| Abrir/actualizar alarma | Operations | alarm + transition + outbox + audit |
| Reconocer alarma | Operations | acknowledgement + transition + audit |

No se emplean transacciones distribuidas. Los efectos secundarios recuperables
se producen mediante outbox.

## Comunicación

### Sincrónica

- REST versionada para comandos y consultas.
- OpenAPI como contrato.
- Timeouts obligatorios.
- Formato de error uniforme con código, mensaje seguro, correlación y detalles
  de validación.

### Asíncrona

- Eventos internos en proceso para coordinación local.
- Transactional Outbox para entregas que no pueden perderse.
- Background jobs persistentes para exportaciones y reintentos.
- MQTT solo para Edge, telemetría, estado y configuración.
- SQS solo para backpressure de ingesta y DLQ; eventos de dominio usan outbox.

## Idempotencia y concurrencia

- Los comandos externos con riesgo de repetición aceptan `idempotency key`.
- Cada muestra posee una clave estable por gateway/secuencia o `message_id`.
- Configuración y plantillas usan versión.
- Actualizaciones administrativas emplean control optimista cuando exista riesgo
  de sobrescritura.
- Un reintento devuelve el resultado previo o produce un efecto equivalente.

## Autorización

La autorización se ejecuta en Application y evalúa:

1. identidad OIDC válida;
2. membership activa;
3. rol;
4. scope tenant/site;
5. estado del recurso;
6. entitlement cuando aplique.

RLS es una segunda barrera y no reemplaza la autorización de aplicación.

## API

- prefijo `/api/v1`;
- UUID como identificador interno;
- códigos externos industriales separados;
- paginación por cursor para listas grandes;
- filtros explícitos y limitados;
- fechas ISO 8601 UTC;
- unidades y calidad sin inferencia implícita;
- no exponer entidades ORM;
- deprecación documentada antes de romper compatibilidad.

## Tiempo real

WebSocket distribuye:

- cambio de conectividad del gateway;
- último valor agregado;
- apertura y transición de alarma;
- estado de jobs relevantes.

No distribuye cada sample. La conexión se reautoriza y filtra por scope; un
cliente no puede suscribirse mediante nombres de topic arbitrarios.

## Condiciones para extraer servicios

La extracción futura debe mantener contrato, ownership de datos y outbox. No se
autoriza por preferencia tecnológica; requiere métrica, riesgo o necesidad de
equipo documentada en un ADR.
