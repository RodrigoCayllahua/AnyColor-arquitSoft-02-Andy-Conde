# AnyColor Salón – Arquitectura de Software

## Datos del proyecto

**Curso:** IS-488 Arquitectura de Software
**Estudiante:** Conde Cayllahua, Andy Rodrigo
**Proyecto:** Sistema Web Multisede para la Gestión Operativa, Reserva Concurrente de Citas y Control de Ventas en Salones de Belleza
**Periodo:** 2026-II

## Descripción

AnyColor Salón es un sistema web multisede orientado a gestionar las operaciones de un salón de belleza. El sistema permitirá administrar usuarios, servicios, citas, ventas, inventario, personal y reportes.

El sistema busca mejorar la organización de las operaciones y controlar las reservas concurrentes para evitar conflictos de horario entre clientes y estilistas.

## Arquitectura inicial

Se propone una arquitectura en tres capas:

1. Presentación
2. Lógica de negocio
3. Datos

La solución considera tecnologías web, una API, PostgreSQL para persistencia y Redis para apoyar el control de concurrencia y caché.

## Documentación

* [Actores](analisis-del-sistema/01-actores.md)
* [Historias de usuario](analisis-del-sistema/02-historias-de-usuario.md)
* [Requisitos funcionales](analisis-del-sistema/03-requisitos-funcionales.md)
* [Atributos de calidad](analisis-del-sistema/04-atributos-de-calidad.md)
* [Restricciones](requisitos/restricciones.md)
* [Drivers arquitectónicos](docs/requisitos/06-drivers-arquitectonicos.md)
* [Arquitectura inicial](docs/arquitectura/arquitectura-inicial.md)
