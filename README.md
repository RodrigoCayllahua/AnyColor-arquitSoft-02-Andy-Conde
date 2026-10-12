# AnyColor Salón – Arquitectura de Software

## Datos del proyecto

**Curso:** IS-488 Arquitectura de Software
**Estudiante:** Conde Cayllahua, Andy Rodrigo
**Docente del curso:** Ing. Lizbeth Jaico Quispe
**Proyecto:** Sistema Web Multisede para la Gestión Operativa, Reserva Concurrente de Citas y Control de Ventas en Salones de Belleza
**Periodo:** 2026-II

## Descripción

AnyColor Salón es un sistema web multisede que gestiona usuarios, catálogo, citas, ventas (POS y caja), inventario, personal con comisiones y reportes. Su reto principal es **evitar cruces de horario** cuando muchas clientas reservan a la vez, y mantener **caja e inventario consistentes** en cada sede.

## Arquitectura en una mirada

* **Estilo:** monolito modular escalable horizontalmente (backend) + frontend SPA, conectados por API REST.
* **Enfoque interno:** Clean Architecture (Dominio, Aplicación, Infraestructura, Presentación).
* **Datos:** PostgreSQL como fuente de verdad; Redis para bloqueos de 5 min y caché; cola para tareas en segundo plano.

## Documentación

### Etapa 1 – Análisis del sistema
* [00 Necesidad del negocio](docs/01-analisis-de-sistema/00-necesidad-del-negocio.md)
* [01 Actores](docs/01-analisis-de-sistema/01-actores.md)
* [02 Historias de usuario](docs/01-analisis-de-sistema/02-historias-del-usuario.md)
* [03 Requisitos funcionales](docs/01-analisis-de-sistema/03-requisitos-funcionales.md)
* [04 Atributos de calidad](docs/01-analisis-de-sistema/04-atributos-de-calidad.md)
* [05 Restricciones](docs/01-analisis-de-sistema/05-restricciones.md)
* [06 Drivers arquitectónicos](docs/01-analisis-de-sistema/06-driver-arquitectonicos.md)

### Etapa 2 – Diseño arquitectónico
* [Arquitectura inicial en tres capas](docs/02-arquitectura-software/arquitectura-inicial.md)
* [Decisiones arquitectónicas (ADR)](docs/01-analisis-de-sistema/07-decisiones-arquitectonicas.md)
* [Estilo arquitectónico](docs/02-arquitectura-software/estilo-arquitectonico.md)
* [Enfoque: Clean Architecture](docs/02-arquitectura-software/enfoque-arquitectonico.md)
* [Diagramas C4, secuencias, estados y modelo de datos](docs/04-modelo-c4/diagramas-mermaid.md) (imágenes PNG en `img/`)
* [Diagramas editables en draw.io](img/fuentes/anycolor.drawio) y su [guía](img/fuentes/README.md)
* [Propuesta de proyecto](propuesta/) – versiones v1 y v2, con su [historial de versiones](propuesta/HISTORIAL-VERSIONES.md)

### Código de referencia
* [`tecnologia/anycolor-core/`](tecnologia/anycolor-core/) – núcleo Clean Architecture ejecutable en memoria (equivalente al *boilerplate* de la Guía 03).

```bash
cd tecnologia/anycolor-core
npm install
npm run pruebas      # 16 pruebas: citas concurrentes, expiración de 5 min, POS idempotente, inventario
```
