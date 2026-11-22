# 04. Pruebas, cobertura e integración continua

## Tipos de prueba

| Tipo | Herramienta | Cantidad | Dónde | Qué comprueba |
|---|---|---|---|---|
| Unitarias | Jest | 19 | `src/**/*.spec.ts` | Reglas del dominio y casos de uso, sin base de datos |
| Integración (e2e) | Jest + Supertest | 6 | `test/api.e2e-spec.ts` | La API completa contra PostgreSQL y Redis reales |
| Funcionales y seguridad | Postman / Newman | 10 peticiones, 20 verificaciones | `pruebas-carga/postman/` | Respuestas 200/400/401/403 y que no se filtren datos |
| Carga y concurrencia | k6 | 4 escenarios | `pruebas-carga/*.js` | Tiempos, errores y cero cruces con cientos o miles de usuarios |
| Núcleo del sprint 1 | Node test runner | 16 | `tecnologia/anycolor-core` | Modelo del dominio del primer sprint |

### Pruebas unitarias (19)

| Archivo | Pruebas |
|---|---|
| `src/citas/citas.spec.ts` | Cruces de horario, máquina de estados, bloqueo que expira a los 5 min, segundo bloqueo rechazado |
| `src/citas/aplicacion/casos-uso.spec.ts` | Disponibilidad (libre, ocupado, en proceso), validaciones de la reserva, permisos para cambiar estado |
| `src/compartido/cache.spec.ts` | *Cache-aside*, expiración, borrado por prefijo, caché desactivada, el Decorator consulta la base solo una vez |

### Pruebas de integración (6)

1. **EQ-04 seguridad:** sin token → 401, token falso → 401, clienta en la agenda → 403.
2. **Validación:** datos inválidos → 400 con mensajes claros.
3. Catálogo y disponibilidad responden con datos reales.
4. **EQ-05 concurrencia:** 20 clientas bloquean el mismo horario a la vez → 1 recibe 201 y 19 reciben 409; la ganadora confirma y la perdedora no puede.
5. **EQ-05 guardia final:** una inserción directa que se cruza es rechazada por PostgreSQL (23P01).
6. Agenda del personal y cambio de estado de la cita.

## Cobertura

Comando: `npm run test:cov` (reporte HTML en `coverage/lcov-report/index.html`).

| Medida | Resultado | Mínimo exigido |
|---|---|---|
| Sentencias | **93,08 %** | 80 % |
| Ramas | **85,86 %** | 70 % |
| Funciones | **90,56 %** | 80 % |
| Líneas | **95,00 %** | 80 % |

La cobertura se mide sobre el dominio, los casos de uso, el bloqueo en memoria y la caché (configurado en `package.json` → `jest.collectCoverageFrom`). Si baja del mínimo, Jest falla y el CI también.

## Integración continua (GitHub Actions)

Archivo: `.github/workflows/ci.yml`. Se ejecuta en cada `push` y *pull request* a `main`.

| Trabajo | Pasos |
|---|---|
| **api** | Levanta PostgreSQL 16 y Redis 7 como servicios → `npm ci` → lint → pruebas unitarias con cobertura → crea la base → pruebas e2e → guarda el reporte de cobertura como artefacto |
| **web** | `npm ci` → lint → `next build` |
| **core** | Pruebas del núcleo del sprint 1 |

Dónde verlo: pestaña **Actions** del repositorio en GitHub. El reporte de cobertura se descarga desde la ejecución, sección *Artifacts*.
