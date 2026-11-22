# 03. Comportamiento de la base de datos y estrategia de caché

## 1. Base de datos PostgreSQL 16

**Esquema:** `tecnologia/anycolor-api/db/01-esquema.sql` · **Datos de prueba:** `db/02-datos.sql`

| Tabla | Para qué |
|---|---|
| `sedes`, `sillones` | Locales y sus sillones |
| `usuarios` | Clientas, estilistas, cajeros y administradores (rol y sede) |
| `servicios`, `servicio_estilista` | Catálogo y qué estilista hace cada servicio |
| `citas` | Reservas con inicio, fin y estado |

### Guardia contra citas cruzadas

```sql
CONSTRAINT sin_solape_estilista EXCLUDE USING gist
  (estilista_id WITH =, tstzrange(inicio, fin) WITH &&) WHERE (estado <> 'cancelada'),
CONSTRAINT sin_solape_sillon EXCLUDE USING gist
  (sillon_id WITH =, tstzrange(inicio, fin) WITH &&) WHERE (estado <> 'cancelada')
```

Se lee así: "no pueden existir dos citas activas del mismo estilista (o del mismo sillón) cuyos rangos de hora se crucen". Aunque fallara Redis, la base de datos **nunca** guarda un cruce: responde el error `23P01` y la API lo convierte en 409. Esto se comprobó en la prueba e2e "guardia final" y también al cargar datos de prueba: PostgreSQL rechazó una cita de 9:00–9:30 que se cruzaba con otra de 9:00–9:45.

### Índices y medición con EXPLAIN ANALYZE

Para medir, se insertaron **19 710 citas** de prueba (un año completo de agenda para todos los estilistas) dentro de una transacción que luego se deshizo (`ROLLBACK`). Evidencia completa: `pruebas-carga/resultados/explain-citas.txt`.

| Consulta | Índice que usa PostgreSQL | Tiempo |
|---|---|---|
| Citas que se cruzan con un horario (estilista **o** sillón) | `sin_solape_estilista` + `sin_solape_sillon` (los índices GiST que crea la restricción EXCLUDE), combinados con *BitmapOr* | **0,23 ms** |
| Agenda de una sede en un día | `idx_citas_sede_inicio` | **0,08 ms** |
| Citas de una clienta | `idx_citas_cliente` | — |

Conclusión: la restricción EXCLUDE cumple dos funciones a la vez, **protege** contra cruces y **acelera** la búsqueda de cruces. Ninguna consulta recorre la tabla completa.

### Conexiones

La API usa un *pool* de hasta 20 conexiones por réplica (`pg.Pool`) en `src/compartido/base-datos.module.ts`, así no abre una conexión nueva por cada petición.

## 2. Redis 7: bloqueos y caché

Redis se usa para dos cosas distintas:

| Uso | Claves | Duración | Archivo |
|---|---|---|---|
| Bloqueo temporal del horario | `bloqueo:estilista:{id}:{inicio}:{fin}`, `bloqueo:sillon:{id}:{inicio}:{fin}` | 5 min (`SET NX PX 300000`) | `servicio-bloqueos.redis.ts` |
| Caché del catálogo | `catalogo:sedes`, `catalogo:servicios`, `catalogo:estilistas:{id}`, `catalogo:servicio:{id}`, `catalogo:estilista:{id}`, `catalogo:habilitado:{e}:{s}` | 5 min (`EX 300`) | `cache.ts`, `repositorio-catalogo.cache.ts` |

### Estrategia de caché: *cache-aside*

```text
1. La API busca la clave en Redis.
2. Si está  → responde desde Redis (no toca PostgreSQL).
3. Si no está → consulta PostgreSQL, guarda el resultado en Redis por 300 s y responde.
```

- **Qué se guarda:** solo datos que cambian poco (sedes, servicios, estilistas). **Las citas y la disponibilidad nunca se guardan en caché**, porque deben estar siempre al día.
- **Invalidación:** expiración automática a los 5 minutos y borrado por prefijo (`borrarPrefijo('catalogo:')`), ya implementado y probado, para usarlo cuando el administrador edite el catálogo (pantalla prevista para el sprint 3).
- **Patrón Decorator:** `RepositorioCatalogoEnCache` envuelve al repositorio de PostgreSQL sin modificarlo.
- **Configurable:** `CACHE=redis | memoria | desactivada` en el `.env`.
- **Si Redis falla:** la fuente de verdad sigue siendo PostgreSQL.

### Medición: con caché y sin caché

Misma prueba k6 (`hora-punta.js`, 300 usuarios durante 60 s, 3 réplicas detrás del balanceador):

| Medida | Con caché Redis | Sin caché | Mejora |
|---|---|---|---|
| Catálogo p95 | **7,85 ms** | 46,24 ms | 5,9 veces más rápido |
| Disponibilidad p95 | **18,31 ms** | 107,89 ms | 5,9 veces más rápido |
| Errores | 0 % | 0 % | — |
| Peticiones atendidas | 64 623 | 62 565 | — |

Evidencia: `pruebas-carga/resultados/hora-punta.txt` y `hora-punta-sin-cache.txt`.

### Optimización encontrada con las pruebas

En la prueba de 2 000 usuarios, la consulta de disponibilidad hacía hasta 38 lecturas a Redis por petición (una por cada turno). Se cambió por **una sola lectura `MGET`** con todas las claves del día. Junto con el ajuste del balanceador (más conexiones y *keep-alive*), el p95 del catálogo con 2 000 usuarios bajó de 5,17 s a 0,27 s y las peticiones por segundo subieron de 651 a 1 328.
