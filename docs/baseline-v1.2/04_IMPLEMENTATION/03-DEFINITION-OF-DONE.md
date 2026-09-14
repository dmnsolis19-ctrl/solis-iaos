# Definition of Done

Una historia no está terminada por “funcionar en local”.

## Criterios generales

- criterio de aceptación demostrado;
- revisión por pares;
- límites de módulo respetados;
- pruebas unitarias y de integración;
- pruebas negativas de autorización cuando aplique;
- migración versionada y validada;
- OpenAPI/MQTT actualizado;
- logs y métricas útiles;
- errores sin secretos;
- documentación canónica actualizada;
- sin vulnerabilidades críticas conocidas sin excepción aprobada;
- desplegado y verificado en staging.

## Datos y tenancy

- `tenant_id` y RLS verificados;
- FK tenant-aware;
- datos de prueba de al menos dos tenants;
- no hay acceso directo cross-module no aprobado;
- idempotencia probada;
- retención y borrado no rompen auditoría.

## Edge/telemetría

- desconexión y replay;
- duplicado/fuera de orden;
- clock inválido;
- buffer lleno;
- ACL/certificado;
- rechazo observable;
- compatibilidad de schema.

## Operación

- transición atómica;
- auditoría;
- concurrencia;
- debounce/histéresis;
- permisos;
- recuperación tras fallo.

## Frontend

- loading/empty/error/stale/unauthorized;
- teclado y contraste críticos;
- tablet;
- reconexión;
- límites de gráfico;
- no depender solo de color.

## Exclusiones

Una historia falla DoD si introduce:

- control remoto;
- módulo diferido;
- nuevo servicio desplegable sin ADR;
- Kubernetes;
- acceso global del integrador;
- MQTT como bus interno;
- secreto en código/configuración versionada.

