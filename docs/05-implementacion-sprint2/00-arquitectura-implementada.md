# 00. Arquitectura implementada

## Del diseño al código

| Decisión del sprint 1 | Cómo quedó implementada | Dónde verificarlo |
|---|---|---|
| Monolito modular | Una sola API NestJS con módulos `auth`, `catalogo` y `citas` | `tecnologia/anycolor-api/src/app.module.ts` |
| Clean Architecture | El módulo Citas tiene 4 capas; el dominio no importa NestJS, PostgreSQL ni Redis | `src/citas/dominio`, `aplicacion`, `infraestructura`, `presentacion` |
| Aplicación web separada | Next.js 15 consume la API por HTTP/JSON | `tecnologia/anycolor-web/` |
| API REST | Prefijo `/api/v1`, JSON, códigos HTTP estándar | `src/main.ts` |
| PostgreSQL como fuente de verdad | Restricción `EXCLUDE USING gist` impide citas cruzadas | `db/01-esquema.sql` |
| Redis para bloqueo de 5 min | `SET NX PX 300000` | `src/citas/infraestructura/servicio-bloqueos.redis.ts` |
| Redis como caché | Caché del catálogo con expiración de 5 min | `src/compartido/cache.ts`, `repositorio-catalogo.cache.ts` |
| API sin estado + balanceador | Token JWT; 3 réplicas detrás de Nginx | `docker-compose.yml`, `infra/nginx.conf` |

## Capas del módulo Citas

```text
src/citas/
├── dominio/            Reglas del salón. No conoce frameworks.
│   ├── modelos/        Cita (estados), RangoHorario (cruces), reglas de agenda
│   ├── contratos.ts    Interfaces: RepositorioCitas, RepositorioCatalogo, ServicioBloqueos, Notificador
│   └── errores.ts      HorarioOcupadoError, PermisoDenegadoError, NoEncontradoError, ReglaNegocioError
├── aplicacion/         Casos de uso: consultar disponibilidad, bloquear, confirmar, cambiar estado
├── infraestructura/    Implementaciones: PostgreSQL, Redis, memoria, caché, notificador
└── presentacion/       Controlador REST y DTO con validaciones
```

La dependencia siempre apunta hacia adentro: el controlador llama al caso de uso, el caso de uso usa las interfaces del dominio y la infraestructura las implementa. El módulo `citas.module.ts` es el único lugar donde se decide qué implementación se usa.

## Principios SOLID en el código

| Principio | Ejemplo real |
|---|---|
| **S** Responsabilidad única | Cada caso de uso hace una sola cosa: `bloquear-horario.caso-uso.ts` solo bloquea, `confirmar-cita.caso-uso.ts` solo confirma |
| **O** Abierto/cerrado | Para agregar caché no se cambió el repositorio de PostgreSQL: se envolvió con `RepositorioCatalogoEnCache` |
| **L** Sustitución de Liskov | `ServicioBloqueosRedis` y `ServicioBloqueosMemoria` son intercambiables; las pruebas usan memoria y producción usa Redis |
| **I** Segregación de interfaces | Contratos pequeños y separados: `ServicioBloqueos`, `RepositorioCatalogo`, `Notificador`, `Cache` |
| **D** Inversión de dependencias | Los casos de uso reciben interfaces por tokens (`REPOSITORIO`, `SERVICIO_BLOQUEOS`), nunca clases concretas |

## Patrones de diseño en el código

| Patrón | Dónde | Para qué |
|---|---|---|
| Repository | `repositorio-citas.postgres.ts`, `repositorio-catalogo.postgres.ts` | Separar el SQL de las reglas |
| Decorator | `repositorio-catalogo.cache.ts` | Añadir caché sin tocar el repositorio original |
| Strategy | `servicio-bloqueos.redis.ts` / `.memoria.ts`; `CacheRedis` / `CacheMemoria` / `CacheDesactivada` | Cambiar el comportamiento con una variable de entorno |
| Adapter | `notificador.consola.ts` | Punto único para conectar WhatsApp o correo más adelante |
| Dependency Injection | `citas.module.ts`, `redis.module.ts` | Armar las piezas en un solo lugar |
| State | `dominio/modelos/cita.modelo.ts` | Solo se permiten transiciones válidas: pendiente → confirmada → en atención → finalizada / cancelada |
| DTO + validación | `presentacion/citas.dto.ts`, `auth/auth.dto.ts` | Rechazar datos inválidos con 400 antes de llegar al caso de uso |
| Guard (RBAC) | `auth/autorizacion.ts` | Comprobar token y rol en cada endpoint protegido |
