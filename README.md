# AnyColor Salón – Arquitectura de Software

## Datos del proyecto

**Curso:** IS-488 Arquitectura de Software
**Estudiante:** Conde Cayllahua, Andy Rodrigo
**Docente del curso:** Ing. Lizbeth Jaico Quispe
**Proyecto:** Sistema Web Multisede para la Gestión Operativa, Reserva Concurrente de Citas y Control de Ventas en Salones de Belleza
**Periodo:** 2026-II · **Entrega:** primer sprint (Guía 04)

## Descripción

AnyColor Salón es un sistema web multisede que gestiona usuarios, catálogo, citas, ventas (POS y caja), inventario, personal con comisiones y reportes. Su reto principal es **evitar cruces de horario** cuando muchas clientas reservan a la vez, y mantener **caja e inventario consistentes** en cada sede.

![Diagrama de contexto](img/nivel1-contexto.png)

## Arquitectura en una mirada

* **Estilo:** monolito modular escalable horizontalmente (backend NestJS) + frontend SPA (Next.js), conectados por API REST.
* **Enfoque interno:** Clean Architecture (Dominio, Aplicación, Infraestructura, Presentación) dentro de cada módulo.
* **Datos:** PostgreSQL como fuente de verdad (con restricción anti-solape); Redis para bloqueos de 5 min, caché y cola; workers para tareas en segundo plano.

## Estructura del repositorio

```text
docs/
├── 01-analisis-de-sistema/       actores, HU, RF, atributos, restricciones, drivers, ADR y escenarios
├── 02-arquitectura-software/     arquitectura inicial, componentes, enfoque y estilo
├── 03-diseño-de-software/
│   └── diseño-interno/           diseño interno de módulos, patrones y principios SOLID
└── 04-modelo-c4/                 niveles 1 a 4 del modelo C4
img/                              diagramas PNG (img/fuentes: draw.io y SVG editables)
tecnologia/anycolor-core/         núcleo Clean Architecture en TypeScript con pruebas
propuesta/                        propuesta del proyecto v1, v2 y v3 + historial de versiones
presentacion/                     diapositivas del primer sprint
```

## Documentación

### 01 · Análisis del sistema
* [00 Necesidad del negocio](docs/01-analisis-de-sistema/00-necesidad-del-negocio.md)
* [01 Actores](docs/01-analisis-de-sistema/01-actores.md)
* [02 Historias de usuario](docs/01-analisis-de-sistema/02-historias-del-usuario.md)
* [03 Requisitos funcionales](docs/01-analisis-de-sistema/03-requisitos-funcionales.md)
* [04 Atributos de calidad](docs/01-analisis-de-sistema/04-atributos-de-calidad.md)
* [05 Restricciones](docs/01-analisis-de-sistema/05-restricciones.md)
* [06 Drivers arquitectónicos](docs/01-analisis-de-sistema/06-driver-arquitectonicos.md)
* [07 Decisiones arquitectónicas (ADR)](docs/01-analisis-de-sistema/07-decisiones-arquitectonicas.md)
* [08 Escenarios de atributos de calidad](docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md)

### 02 · Arquitectura de software
* [Arquitectura inicial en tres capas](docs/02-arquitectura-software/arquitectura-inicial.md)
* [Componentes arquitectónicos y trazabilidad](docs/02-arquitectura-software/componentes-arquitectonicos.md)
* [Enfoque: Clean Architecture](docs/02-arquitectura-software/enfoque-arquitectonico.md)
* [Estilo: monolito modular + SPA](docs/02-arquitectura-software/estilo-arquitectonico.md)

### 03 · Diseño de software
* [Diseño interno de módulos](docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md)
* [Patrones de diseño](docs/03-diseño-de-software/diseño-interno/patrones-de-diseño.md)
* [Principios de diseño (SOLID)](docs/03-diseño-de-software/diseño-interno/principios-de-diseño.md)

### 04 · Modelo C4
* [Nivel 1 · Contexto del sistema](docs/04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md)
* [Nivel 2 · Contenedores](docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md)
* [Nivel 3 · Componentes](docs/04-modelo-c4/Nivel3-Diagrama-de-Componentes.md)
* [Nivel 4 · Código](docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md)

### Propuesta y presentación
* [Propuesta del proyecto](propuesta/) – versiones v1, v2 y v3, con su [historial de versiones](propuesta/HISTORIAL-VERSIONES.md)
* [Diapositivas del primer sprint](presentacion/) (12 minutos, con guion en las notas del orador)
* [Fuentes editables de los diagramas](img/fuentes/README.md)

## Código de referencia

[`tecnologia/anycolor-core/`](tecnologia/anycolor-core/) – núcleo Clean Architecture ejecutable en memoria (dominio, casos de uso, adaptadores y controlador del módulo Citas, POS e inventario).

```bash
cd tecnologia/anycolor-core
npm install
npm run pruebas      # 16 pruebas: citas concurrentes, expiración de 5 min, POS idempotente, inventario
```
