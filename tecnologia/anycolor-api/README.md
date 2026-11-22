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

## Módulos

| Carpeta | Qué hace |
|---|---|
| `src/auth` | Login con JWT, registro de clientas, roles (RBAC) |
| `src/catalogo` | Sedes, servicios y estilistas |
| `src/citas` | Disponibilidad, bloqueo de 5 min, confirmación y estados (dominio · aplicación · infraestructura · presentación) |
| `src/compartido` | Conexión a PostgreSQL y traducción de errores del dominio a HTTP |

## Pruebas

```bash
npm test          # pruebas unitarias
npm run lint      # estilo del código
```

Usuarios de prueba: ver `db/02-datos.sql` (clave `AnyColor2026`). Peticiones de ejemplo: `pruebas.http`.
