# Diagramas en draw.io

Archivo editable: [`anycolor.drawio`](anycolor.drawio) (11 páginas, una por figura).

Los mismos diagramas existen en código Mermaid en [`diagramas.md`](diagramas.md), que GitHub dibuja automáticamente. El `.drawio` es la versión editable para ajustar el aspecto y exportar imágenes para la propuesta.

## Cómo abrirlo

1. Entra a https://app.diagrams.net
2. **Archivo → Abrir desde → Dispositivo** y elige `anycolor.drawio`.
3. Abajo aparecen las pestañas de cada página.

También sirve la extensión *Draw.io Integration* de VS Code: al abrir el archivo se edita dentro del editor.

## Contenido

| Pág. | Nombre | Figura | Guía / Documento relacionado |
| --- | --- | --- | --- |
| 01 | C4 Contexto (C1) | Figura 4.1 | Propuesta · Arquitectura de bajo nivel |
| 02 | C4 Contenedores (C2) | Figura 4.2 | Propuesta · Arquitectura de bajo nivel |
| 03 | C4 Componentes (C3) | Figura 4.3 | Propuesta · Arquitectura de bajo nivel |
| 04 | Arquitectura en tres capas | — | Guía 02, ejercicio 10 |
| 05 | Estilo monolito modular | — | Guía 03, paso 4 · ADR-001 |
| 06 | Clean Architecture | — | Guía 03, paso 5 · ADR-002 |
| 07 | Secuencia de reserva concurrente | — | RF07 · ADR-003 · ADR-004 |
| 08 | Secuencia de venta en el POS | — | RF10 · ADR-008 |
| 09 | Estados de la cita | — | RF08 |
| 10 | Modelo de datos | — | ADR-003 |
| 11 | Hoja de ruta | — | Plan de evolución tecnológica |

## Cómo exportar para la propuesta

1. Abre la página que necesitas.
2. **Archivo → Exportar como → PNG**.
3. En el cuadro de exportación sube el *Zoom* (200 % o más) para que la imagen quede nítida, deja el fondo blanco y pulsa *Exportar*.
4. Inserta la imagen en el Word con su número de figura.

## Cómo conservar evidencia de elaboración

- Guarda el archivo en tu Drive o en el repositorio y mantén el historial de versiones (**Archivo → Revisar historial** en Drive; commits en Git).
- Ajusta al menos un elemento de cada página (colores, posición, textos) según tu criterio y haz commit de ese cambio.
- Conserva capturas de pantalla del editor con el diagrama abierto.
- Ten presente la razón de cada decisión: están justificadas en los ADR (`arquitectura/decisiones-arquitectonicas.md`).

## Convenciones de color

| Color | Significado |
| --- | --- |
| Amarillo | Actores / usuarios |
| Azul | Componentes propios de la aplicación |
| Verde | Almacenes de datos |
| Naranja | Infraestructura de borde (CDN, balanceador) y contratos |
| Morado | Dominio y servicios transversales |
| Rojo | Sistemas externos |
| Gris, línea punteada | Elemento futuro u opcional |
