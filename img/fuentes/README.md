# Fuentes editables de los diagramas

Cada imagen de `img/` tiene aquí su fuente. Las imágenes PNG son las que se muestran en los documentos de `docs/` y en la propuesta.

| Imagen (`img/`) | Fuente | Se usa en |
| --- | --- | --- |
| `nivel1-contexto.png` | `nivel1-contexto.drawio`, `nivel1-contexto.svg` | `docs/04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md` |
| `nivel2-contenedores.png` | `nivel2-contenedores.drawio`, `nivel2-contenedores.svg` | `docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md` |
| `nivel3-componentes.png` | `nivel3-componentes.drawio`, `nivel3-componentes.svg` | `docs/04-modelo-c4/Nivel3-Diagrama-de-Componentes.md` |
| `nivel4-clases.png` | `nivel4-clases.svg` | `docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md` |
| `nivel4-secuencia.png` | `nivel4-secuencia.svg` | `docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md` |
| `arquitectura-inicial.png` | `arquitectura-inicial.drawio`, `arquitectura-inicial.svg` | `docs/02-arquitectura-software/arquitectura-inicial.md` |
| `estilo-monolito-modular.png` | `estilo-monolito-modular.drawio`, `estilo-monolito-modular.svg` | `docs/02-arquitectura-software/estilo-arquitectonico.md` |
| `clean-architecture.png` | `clean-architecture.svg` | `docs/02-arquitectura-software/enfoque-arquitectonico.md` |
| `componentes-arquitectonicos.png` | `componentes-arquitectonicos.svg` | `docs/02-arquitectura-software/componentes-arquitectonicos.md` |
| `paquetes-modulo-citas.png` | `paquetes-modulo-citas.svg` | `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md` |
| `principio-dip.png` | `principio-dip.svg` | `docs/03-diseño-de-software/diseño-interno/principios-de-diseño.md` |
| `patrones-de-diseno.png` | `patrones-de-diseno.svg` | `docs/03-diseño-de-software/diseño-interno/patrones-de-diseño.md` |
| `estados-cita.png`, `modelo-de-datos.png`, `secuencia-venta-pos.png`, `hoja-de-ruta.png` | páginas de `anycolor-v2.drawio` | Diseño interno y propuesta |

`anycolor-v2.drawio` conserva las 12 páginas de la versión 2 de la propuesta (estados de la cita, modelo de datos, secuencias, hoja de ruta y los C4 anteriores).

## Cómo editar

1. Entra a https://app.diagrams.net y usa **Archivo → Abrir desde → Dispositivo**, o instala la extensión *Draw.io Integration* de VS Code.
2. Los `.svg` se abren en el navegador o en cualquier editor vectorial (Inkscape, Figma).
3. Después de editar, exporta a PNG con fondo blanco y escala 2x, y reemplaza el archivo en `img/` con el mismo nombre para no romper los enlaces.

## Convención visual (modelo C4)

| Elemento | Color |
| --- | --- |
| Persona | Azul marino `#1F3B66` |
| Sistema / contenedor | Azul `#4A72B8` |
| Componente | Celeste `#A9C4EB` |
| Sistema externo | Gris `#9A9A9A` |
| Previsto (etapa futura) | Gris claro con borde discontinuo |

Cada flecha lleva un verbo y, cuando aplica, el protocolo entre corchetes: `Solicita cobros [HTTPS/REST]`.
