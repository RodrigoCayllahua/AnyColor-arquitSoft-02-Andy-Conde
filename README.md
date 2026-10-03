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
* [00 Necesidad del negocio](analisis-del-sistema/00-necesidad-del-negocio.md)
* [01 Actores](analisis-del-sistema/01-actores.md)
* [02 Historias de usuario](analisis-del-sistema/02-historias-de-usuario.md)
* [03 Requisitos funcionales](analisis-del-sistema/03-requisitos-funcionales.md)
* [04 Atributos de calidad](analisis-del-sistema/04-atributos-de-calidad.md)
* [05 Restricciones](analisis-del-sistema/05-restricciones.md)
* [06 Drivers arquitectónicos](analisis-del-sistema/06-drivers-arquitectonicos.md)

### Etapa 2 – Diseño arquitectónico
* [Arquitectura inicial en tres capas](arquitectura/arquitectura-inicial.md)
* [Decisiones arquitectónicas (ADR)](arquitectura/decisiones-arquitectonicas.md)
* [Estilo arquitectónico](arquitectura/estilo-arquitectonico.md)
* [Enfoque: Clean Architecture](arquitectura/enfoque/enfoque-arquitectonico.md)
* [Diagramas C4, secuencias, estados y modelo de datos](arquitectura/diagramas/diagramas.md) (imágenes PNG en `arquitectura/diagramas/img/`)
* [Diagramas editables en draw.io](arquitectura/diagramas/anycolor.drawio) y su [guía](arquitectura/diagramas/guia-drawio.md)
* [Propuesta de proyecto](propuesta/) – versiones v1 y v2, con su [historial de versiones](propuesta/HISTORIAL-VERSIONES.md)

### Código de referencia
* [`anycolor-core/`](anycolor-core/) – núcleo Clean Architecture ejecutable en memoria (equivalente al *boilerplate* de la Guía 03).

```bash
cd anycolor-core
npm install
npm run pruebas      # 16 pruebas: citas concurrentes, expiración de 5 min, POS idempotente, inventario
```
