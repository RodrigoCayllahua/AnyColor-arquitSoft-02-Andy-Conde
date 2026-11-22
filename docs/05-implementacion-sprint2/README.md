# 05. Implementación – Segundo sprint

En este sprint la arquitectura del primer sprint pasa a **código que funciona**: backend NestJS con Clean Architecture, aplicación web Next.js, base de datos PostgreSQL, Redis para bloqueos y caché, API documentada con Swagger, pruebas automáticas con cobertura, integración continua en GitHub Actions y pruebas de carga con k6 y Postman.

| # | Documento | Qué responde |
|---|---|---|
| 00 | [Arquitectura implementada](00-arquitectura-implementada.md) | Dónde está en el código el estilo, la Clean Architecture, SOLID y los patrones |
| 01 | [Especificaciones SDD](01-especificaciones-sdd.md) | Cada funcionalidad: historia, criterios de aceptación, tareas técnicas y endpoint |
| 02 | [API REST y Swagger](02-api-rest-swagger.md) | Los 12 endpoints, cómo abrir Swagger y los códigos de respuesta |
| 03 | [Base de datos y caché](03-base-de-datos-y-cache.md) | Cómo se comporta PostgreSQL, qué índices usa y cómo funciona la caché |
| 04 | [Pruebas, cobertura e integración continua](04-pruebas-y-cobertura.md) | Pruebas Jest, cobertura, GitHub Actions |
| 05 | [Validación de atributos de calidad](05-validacion-atributos-calidad.md) | EQ-01 a EQ-10: qué se midió, con qué herramienta y el resultado |
| 06 | [Cómo ejecutar todo](06-como-ejecutar.md) | Comandos para levantar el sistema, Swagger, pruebas y k6 |

## Resumen de resultados

| Qué se pidió | Evidencia | Resultado |
|---|---|---|
| Estilo arquitectónico y Clean Architecture | `tecnologia/anycolor-api/src/citas/` (dominio, aplicacion, infraestructura, presentacion) | Implementado |
| Especificaciones SDD | [01-especificaciones-sdd.md](01-especificaciones-sdd.md) | 6 funcionalidades especificadas |
| Endpoints REST con OpenAPI/Swagger | `http://localhost:3001/api/docs` | 12 endpoints, 4 esquemas |
| Análisis de base de datos y caché | [03-base-de-datos-y-cache.md](03-base-de-datos-y-cache.md) | Consultas en menos de 1 ms con 19 716 citas; la caché hace las respuestas 6 veces más rápidas |
| SOLID y patrones | [00-arquitectura-implementada.md](00-arquitectura-implementada.md) | 5 principios y 8 patrones ubicados en el código |
| Pruebas Jest con cobertura | `npm run test:cov` | 19 unitarias + 6 de integración; 95 % de líneas cubiertas |
| GitHub Actions | `.github/workflows/ci.yml` | Lint, pruebas, cobertura y build en cada push |
| Postman | `pruebas-carga/postman/` | 60 de 60 verificaciones aprobadas (Newman) |
| k6 hasta 2 000 usuarios | `pruebas-carga/resultados/` | 266 826 peticiones con 0 % de errores |
| Concurrencia (cero cruces) | `concurrencia-reservas.js` | 300 clientas al mismo horario: 1 gana, 299 reciben 409, 1 cita guardada |
