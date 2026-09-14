# Control documental

| Campo | Regla |
|---|---|
| Identificador | Todo documento normativo usa un código estable |
| Versión | `MAYOR.MENOR`; cambios incompatibles incrementan MAYOR |
| Estado | Borrador, Propuesto, Aceptado, Reemplazado o Retirado |
| Aprobadores | Product Owner, Arquitecto Principal y responsable de Seguridad cuando aplique |
| Formato fuente | Markdown, OpenAPI YAML, JSON Schema y SQL de referencia |
| Historial | Todo cambio debe registrarse en el changelog |

## Estados

- **Borrador:** contenido en elaboración; no gobierna desarrollo.
- **Propuesto:** listo para revisión y comentarios.
- **Aceptado:** baseline obligatoria.
- **Reemplazado:** preservado por trazabilidad, pero no vigente.
- **Retirado:** decisión o documento que ya no aplica.

## Reglas de mantenimiento

1. Una decisión arquitectónica material requiere ADR.
2. Un ADR aceptado no se edita para cambiar su decisión; se reemplaza con otro.
3. Cada documento debe enlazar los ADR que lo gobiernan.
4. Cada módulo tiene un único documento canónico de responsabilidad.
5. Los contratos API y MQTT se versionan de forma independiente.
6. Ningún backlog puede contradecir el alcance MVP aceptado.
7. Las capacidades diferidas se mantienen en roadmap, no como dependencias del MVP.
8. Todo cambio que afecte aislamiento, seguridad OT, persistencia o disponibilidad
   requiere revisión del Arquitecto Principal.
9. Los archivos de `05_CONTRACTS` son la autoridad de interfaz.
10. El DDL de referencia se convierte en migraciones; no se ejecuta manualmente
    en producción.

## Convención de términos

| Término | Uso canónico |
|---|---|
| Tenant | Cliente contractual aislado |
| Integrador | Actor delegado; no es un superusuario global |
| Site | Planta o sitio industrial de un tenant |
| Asset | Activo industrial identificable |
| Variable | Definición de una magnitud o estado del activo |
| Sample | Muestra de telemetría |
| Gateway | Identidad lógica de conectividad de un sitio |
| Edge Agent | Runtime local administrado por SOLIS |
| Alarm | Condición operativa con ciclo de vida y auditoría |
| Digital representation | Vista compuesta del activo en el MVP |
