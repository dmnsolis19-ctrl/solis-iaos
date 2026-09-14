# Baseline de seguridad del MVP

## Contenido

| Archivo | Decisión |
|---|---|
| `authorization-matrix.md` | roles, permisos y scopes humanos/servicio |
| `threat-model.md` | STRIDE, mitigaciones, propietarios y validación |
| `gateway-pki.md` | emisión, instalación, rotación, revocación y recuperación |
| `incident-runbooks.md` | respuesta mínima antes del piloto |

## Frontera

SOLIS IAOS observa el proceso. No es SIS, PLC, protección eléctrica ni sistema
de control. La seguridad del MVP se diseña para que una caída o compromiso de la
plataforma no otorgue capacidad de mando sobre el proceso.

## Condición del gate

Los controles quedan aprobables como diseño. Antes de Pilot Production deben
ejecutarse pruebas RLS, ACL, revocación, restore y tabletop de incidentes, y
asignarse personas nominales a los roles de respuesta.

