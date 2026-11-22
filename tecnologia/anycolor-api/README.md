# anycolor-api · Backend de AnyColor Salón

API REST en **NestJS + TypeScript**, organizada como **monolito modular** con **Clean Architecture** dentro de cada módulo.

## Ejecutar

```bash
docker compose up -d        # PostgreSQL 16 + Redis 7
copy .env.example .env      # en Linux/Mac: cp .env.example .env
npm install
npm run db:iniciar          # crea las tablas y carga los datos de prueba
npm run start:dev           # http://localhost:3001/api/v1
```

Documentación Swagger: **http://localhost:3001/api/docs**

### Como en producción: 3 réplicas + balanceador Nginx

```bash
docker compose --profile completo up -d --build --scale api=3
npm run db:iniciar          # http://localhost:8080/api/v1
```

## Módulos

| Carpeta | Qué hace |
|---|---|
| `src/auth` | Login con JWT, registro de clientas, roles (RBAC) |
| `src/catalogo` | Sedes, servicios y estilistas |
| `src/citas` | Disponibilidad, bloqueo de 5 min, confirmación y estados (dominio · aplicación · infraestructura · presentación) |
| `src/compartido` | Conexión a PostgreSQL, Redis, caché del catálogo y traducción de errores del dominio a HTTP |
| `infra/nginx.conf` | Balanceador de carga entre las réplicas |
| `pruebas-carga/` | Pruebas k6 (rendimiento, concurrencia, caída de réplica), colección Postman y resultados |

## Pruebas

```bash
npm test          # 19 pruebas unitarias
npm run test:cov  # con cobertura (mínimo 80 %)
npm run test:e2e  # 12 pruebas contra PostgreSQL y Redis reales (incluye seguridad)
npm run lint      # estilo del código
```

Usuarios de prueba: ver `db/02-datos.sql` (clave `AnyColor2026`). Peticiones de ejemplo: `pruebas.http`.

Pruebas de carga y Postman: ver [docs/05-implementacion-sprint2/06-como-ejecutar.md](../../docs/05-implementacion-sprint2/06-como-ejecutar.md).
