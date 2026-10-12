# Historial de versiones de la propuesta

Cada cambio importante de la propuesta genera una versión nueva. Los archivos de versiones anteriores se conservan en esta carpeta.

| Versión | Fecha | Archivo | Cambios |
| --- | --- | --- | --- |
| v1 | Versión inicial | `PRPUESTA DE PRYECTO ANDY RODRIGO CONDE CAYLLAHUA CONSTRUCCIÓN S - v1.docx` | Propuesta preliminar: requerimientos, alcance, solución conceptual, arquitectura técnica, diagramas C4 y hoja de ruta. |
| v2 | 2026-10-03 | `PRPUESTA DE PRYECTO ANDY RODRIGO CONDE CAYLLAHUA CONSTRUCCIÓN S - v2.docx` | Análisis del sistema con IDs trazables (actores, HU, RF, AC, RC, DA). ADR-001 a ADR-010, estilo arquitectónico y Clean Architecture. Diagramas rehechos en draw.io (DAN, C4, secuencias, estados, modelo de datos, hoja de ruta). Reserva concurrente en dos niveles (Redis + restricción en PostgreSQL). Texto corregido: Ubuntu Server 22.04 LTS, "idempotente", componentes completos en C3. Historial de versiones y portada con número de versión. |
| v3 | 2026-10-12 | `PRPUESTA DE PRYECTO ANDY RODRIGO CONDE CAYLLAHUA CONSTRUCCIÓN S - v3.docx` | Primer sprint (Guía 04). Escenarios de atributos de calidad EQ-01 a EQ-10 (Tabla A4.1). Modelo C4 completo: niveles 1 a 3 redibujados con el estilo de la guía y nivel 4 con las clases del módulo Citas (Figura 4.4). Componentes arquitectónicos con trazabilidad (Figura 5.7, Tabla B3). Nueva sección Diseño de Software: diseño interno, patrones y SOLID (Figuras 6.1–6.3). Repositorio reorganizado en `docs/`, `img/` y `tecnologia/`. |

## Cómo registrar la próxima versión (v4, v5…)

1. Copia el último `.docx` y cambia el sufijo (`- v4`).
2. Haz los cambios en la copia.
3. Agrega una fila a esta tabla y a la sección "Historial de Versiones" del propio documento.
4. Si cambiaste diagramas, actualiza `img/fuentes/anycolor.drawio`.
5. Haz commit: `docs(propuesta): agregar version 4 con <resumen del cambio>`.
