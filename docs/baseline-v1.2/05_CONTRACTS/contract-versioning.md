# Política de versionamiento de contratos

## Esquema

SOLIS IAOS usa versión `MAJOR.MINOR` para contratos externos.

- `MAJOR`: cambio incompatible.
- `MINOR`: adición compatible.
- Correcciones editoriales que no cambian validación conservan la versión y se
  registran en el changelog.

## Compatibilidad API

Son compatibles:

- endpoint nuevo;
- propiedad de respuesta nueva y opcional;
- valor de filtro nuevo cuando los clientes deben ignorar valores desconocidos;
- permiso más restrictivo solo si corrige una vulnerabilidad y existe plan de
  transición.

Son incompatibles:

- eliminar o renombrar endpoint/campo;
- volver obligatorio un campo opcional;
- cambiar tipo, unidad, semántica o código de error;
- reducir límites sin aviso;
- ampliar el efecto de una operación;
- cambiar el tenant o scope requerido.

La versión mayor de API está en la ruta: `/api/v1`.

## Compatibilidad MQTT

Cada payload lleva `schemaVersion`. El topic solo contiene la versión mayor:
`solis/v1/...`.

Un consumidor v1:

- debe ignorar propiedades desconocidas;
- debe rechazar ausencia o cambio de campos requeridos;
- no debe inferir unidad o tipo;
- debe enviar contratos desconocidos a rechazo observable;
- no debe confirmar como aceptado un mensaje inválido.

Agregar un campo opcional es compatible. Cambiar un campo requerido, su tipo o
semántica exige `solis/v2`.

## Ventana de migración

| Contrato | Ventana mínima |
|---|---:|
| API externa | 90 días |
| Payload MQTT de gateway | 180 días o ciclo de reemplazo acordado |
| Configuración Edge | Dos versiones menores consecutivas |

El MVP solo implementa v1. Una segunda versión requiere ADR, inventario de
clientes afectados, telemetría de uso y plan de reversión.

## Gobernanza

Todo cambio contractual incluye:

- propietario;
- motivación;
- clasificación compatible/incompatible;
- ejemplos;
- pruebas de consumidor y productor;
- fecha de publicación;
- fecha de retiro, si aplica;
- actualización de OpenAPI/JSON Schema/diccionario;
- aprobación de Arquitectura y Seguridad si cambia permisos o frontera OT.

