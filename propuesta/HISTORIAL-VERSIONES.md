# Historial de versiones de la propuesta

Cada cambio importante de la propuesta genera una versión nueva. Los archivos de versiones anteriores se conservan en esta carpeta.

| Versión | Fecha | Archivo | Cambios |
| --- | --- | --- | --- |
| v1 | Versión inicial | `PRPUESTA DE PRYECTO ANDY RODRIGO CONDE CAYLLAHUA CONSTRUCCIÓN S - v1.docx` | Propuesta preliminar: requerimientos, alcance, solución conceptual, arquitectura técnica, diagramas C4 y hoja de ruta. |
| v2 | 2026-10-03 | `PRPUESTA DE PRYECTO ANDY RODRIGO CONDE CAYLLAHUA CONSTRUCCIÓN S - v2.docx` | Análisis del sistema con IDs trazables (actores, HU, RF, AC, RC, DA). ADR-001 a ADR-010, estilo arquitectónico y Clean Architecture. Diagramas rehechos en draw.io (DAN, C4, secuencias, estados, modelo de datos, hoja de ruta). Reserva concurrente en dos niveles (Redis + restricción en PostgreSQL). Texto corregido: Ubuntu Server 22.04 LTS, "idempotente", componentes completos en C3. Historial de versiones y portada con número de versión. |

## Cómo registrar la próxima versión (v3, v4…)

1. Copia el último `.docx` y cambia el sufijo (`- v3`).
2. Haz los cambios en la copia.
3. Agrega una fila a esta tabla y a la sección "Historial de Versiones" del propio documento.
4. Si cambiaste diagramas, actualiza `arquitectura/diagramas/anycolor.drawio`.
5. Haz commit: `docs(propuesta): agregar version 3 con <resumen del cambio>`.
