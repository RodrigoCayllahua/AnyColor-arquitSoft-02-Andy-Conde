# 06. Cómo ejecutar todo

Requisitos: Docker Desktop y Node.js 22.

## Opción A: desarrollo (1 API local)

```bash
cd tecnologia/anycolor-api
docker compose up -d          # PostgreSQL 16 + Redis 7
copy .env.example .env        # Linux/Mac: cp .env.example .env
# Genera tu propia clave JWT y pégala en JWT_SECRETO dentro de .env:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
npm install
npm run db:iniciar            # crea las tablas y carga los datos de prueba
npm run start:dev             # API en http://localhost:3001/api/v1
```

Swagger: `http://localhost:3001/api/docs`

Aplicación web:

```bash
cd tecnologia/anycolor-web
copy .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

Usuarios de prueba (clave `AnyColor2026`): `ana@correo.com` (clienta), `admin.centro@anycolor.pe` (administrador de sede). Lista completa en `db/02-datos.sql`.

## Opción B: como en producción (3 réplicas + balanceador)

```bash
cd tecnologia/anycolor-api
docker compose --profile completo up -d --build --scale api=3
npm run db:iniciar
```

API con balanceador: `http://localhost:8080/api/v1` · Swagger: `http://localhost:8080/api/docs`

La cabecera `X-Atendido-Por` muestra qué réplica respondió.

## Pruebas

```bash
npm test                      # 19 pruebas unitarias
npm run test:cov              # con reporte de cobertura (coverage/lcov-report/index.html)
npm run test:e2e              # 12 pruebas contra PostgreSQL y Redis reales (incluye seguridad)
npm run lint
```

## Postman

- Importar `pruebas-carga/postman/AnyColor-API.postman_collection.json` en Postman y pulsar **Run**.
- O sin instalar Postman (con la opción B levantada):

```bash
docker run --rm --network anycolor-api_default -v "%cd%/pruebas-carga:/etc/newman" postman/newman:6-alpine run postman/AnyColor-API.postman_collection.json --env-var base=http://balanceador/api/v1
```

## k6 (con la opción B levantada)

k6 envía miles de peticiones desde **una sola IP**, así que el límite de peticiones (rate limiting) las frenaría con 429. Solo para estas pruebas se desactiva y luego se vuelve a activar:

```powershell
$env:LIMITE_PETICIONES='desactivado'; docker compose --profile completo up -d --scale api=3
```

```bash
docker compose --profile pruebas run --rm k6 run /scripts/hora-punta.js            # EQ-01
docker compose --profile pruebas run --rm k6 run /scripts/caida-replica.js         # EQ-02 (apagar una réplica mientras corre)
docker compose --profile pruebas run --rm k6 run /scripts/rendimiento-catalogo.js  # EQ-03 hasta 2 000 usuarios
docker compose --profile pruebas run --rm k6 run /scripts/concurrencia-reservas.js # EQ-05 300 clientas al mismo horario
```

Las pruebas de concurrencia registran clientas de prueba; `npm run db:iniciar` deja la base como al inicio.

Al terminar, vuelve a activar el límite:

```powershell
Remove-Item Env:LIMITE_PETICIONES; docker compose --profile completo up -d --scale api=3
```

## Apagar

```bash
docker compose --profile completo down
```
