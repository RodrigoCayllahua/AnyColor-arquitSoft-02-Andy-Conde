# 07. Auditoría de seguridad (AppSec / OWASP)

Revisión completa del backend (`tecnologia/anycolor-api`), de la aplicación web (`tecnologia/anycolor-web`), de la infraestructura (`docker-compose.yml`, `infra/nginx.conf`) y del historial de Git.

## Resumen

| # | Punto revisado | Hallazgos | Estado |
|---|---|---|---|
| 1 | Secretos, README y variables de entorno | Clave JWT y clave de PostgreSQL escritas en `docker-compose.yml`; puertos de la base abiertos a la red | ✅ Corregido |
| 2 | Vulnerabilidades de código | Dependencias con fallas conocidas, enumeración de correos por tiempo, JWT sin algoritmo fijo, claves débiles, agenda sin sede | ✅ Corregido |
| 3 | Rutas de la API | Rutas protegidas una por una (fácil olvidar una) | ✅ Cerradas por defecto |
| 4 | Entradas, inyección SQL y XSS | SQL ya era seguro; faltaban límites de longitud, caracteres y tamaño | ✅ Corregido |
| 5 | Sesión | Token en `localStorage` sin caducidad en el navegador; duración de 8 h | ✅ Corregido |
| 6 | Rate limiting | No existía | ✅ Implementado (compartido en Redis) |
| 7 | Controles OWASP | Sin cabeceras de seguridad, CORS amplio, errores 500 sin control | ✅ Corregido |

Pruebas: **12 pruebas e2e** (6 de seguridad nuevas) y **Postman 60/60**. `npm audit`: **0 vulnerabilidades** en la API y en la web.

---

## 1. README, secretos y variables de entorno

### Qué se revisó

- **Historial de Git completo:** nunca se subió un archivo `.env`. Las únicas "claves" encontradas son el texto de ejemplo `cambia-esta-frase-por-una-larga-y-secreta`.
- `.gitignore` de la API y de la web excluyen `.env` y `.env*`, y permiten solo `.env.example`.

### Problemas y corrección

| Problema | Riesgo | Corrección |
|---|---|---|
| `JWT_SECRETO` escrito en `docker-compose.yml` | Quien lea el repositorio puede fabricar tokens de administrador | Ahora es `${JWT_SECRETO:?...}`: se lee del `.env` y si falta, Docker no arranca |
| La API aceptaba la clave de ejemplo | Un despliegue descuidado quedaría con una clave pública | Si la clave tiene menos de 32 caracteres, la API no arranca. En producción tampoco arranca con el valor de ejemplo (`validarSecretoJwt` en `auth.module.ts`) |
| Clave de PostgreSQL fija en Compose | Igual que arriba | `${DB_CLAVE:-anycolor}` desde `.env` |
| PostgreSQL y Redis publicados en `0.0.0.0` | Cualquiera en la misma red wifi podía conectarse a la base | Ahora solo `127.0.0.1` |

### Qué sí va en el README

- Qué hace el sistema, cómo está organizado y cómo ejecutarlo.
- Los **nombres** de las variables de entorno (en `.env.example`), nunca sus valores reales.
- Direcciones locales como `http://localhost:3001/api/docs`: no son secretas, solo funcionan en la propia PC.
- Usuarios de prueba de los datos semilla (`db/02-datos.sql`), aclarando que son solo para desarrollo.

### Qué nunca va en el README ni en el código

- `JWT_SECRETO`, claves de base de datos de servidores reales.
- Llaves de Mercado Pago (`APP_USR-…`, `TEST-…`), de AWS (`AKIA…`), tokens de GitHub (`ghp_…`).
- Archivos `.env`, `.pem` o capturas de pantalla donde se vean tokens o claves.
- Datos reales de clientas.

> **Sobre la captura del README:** las palabras raras ("Patrocinadores", "SÓLIDO", "tecnología/") **no están en el repositorio**: las pone el traductor automático del navegador. En GitHub se muestra "Patrones", "SOLID" y "tecnologia/". Desactiva la traducción de la página para verlo como es. Mostrar `http://localhost:3001/api/docs` en el README está bien.

---

## 2. Vulnerabilidades de código

| Vulnerabilidad | En palabras simples | Riesgo real | Corrección |
|---|---|---|---|
| Dependencias vulnerables (`multer`, `body-parser`, `postcss`, `next`) | Librerías de terceros con fallas ya publicadas | Caída del servidor (DoS) o lectura de archivos | `npm audit fix`, Next 15.5.29 y `postcss` forzado a 8.5.x → **0 vulnerabilidades** |
| Enumeración de usuarios por tiempo | Si el correo no existía, el login respondía más rápido | Un atacante descubre qué correos están registrados | Siempre se compara contra un hash (`HASH_FALSO`), así el tiempo es igual |
| JWT sin algoritmo fijo | El servidor no exigía un algoritmo concreto | Ataques que cambian el `alg` del token | `algorithms: ['HS256']`, más `issuer` y `audience` |
| Claves débiles | Se aceptaban claves de 6 caracteres | Fáciles de adivinar | Mínimo 8, con letras y números; máximo 72 (límite de bcrypt) |
| Agenda sin sede | Un trabajador sin sede asignada veía **todas** las sedes | Acceso a datos de otra sede | Ahora responde 403 |
| Errores 500 sin control | Un error inesperado podía mostrar información interna | Pistas para un atacante | Filtro general con mensaje genérico; el detalle solo va al log |

---

## 3. Rutas de la API

**Antes:** cada ruta protegida llevaba `@UseGuards(AutorizacionGuard)`. Si alguien olvidaba ponerlo en una ruta nueva, quedaba abierta.

**Ahora:** el guard es **global** (`APP_GUARD` en `app.module.ts`). Todas las rutas exigen token y las públicas se marcan explícitamente con `@Publico()`. Esto se llama **denegar por defecto**.

| Ruta | Autenticación | Rol / permiso | Validación |
|---|---|---|---|
| `POST /auth/login` | Pública | — | `LoginDto` + límite 20/min + bloqueo por fuerza bruta |
| `POST /auth/registro` | Pública | El rol lo fija el servidor (`CLIENTE`) | `RegistroDto` + límite 10 cada 10 min |
| `GET /auth/yo` | Token | Cualquier rol | — |
| `GET /catalogo/*` | Pública | — | `ParseUUIDPipe` en `{id}` |
| `GET /citas/disponibilidad` | Pública (no muestra quién reservó) | — | `DisponibilidadQuery` (UUID + fecha real) |
| `POST /citas/bloqueos` | Token | `CLIENTE` | `ReservaDto` + límite 30/min |
| `POST /citas` | Token | `CLIENTE` + bloqueo vigente propio | `ReservaDto` |
| `GET /citas/mias` | Token | `CLIENTE` (solo las suyas: usa el id del token) | — |
| `GET /citas/agenda` | Token | Personal; filtrado por su sede; 403 sin sede | `AgendaQuery` |
| `PATCH /citas/{id}/estado` | Token | Todos los roles; el caso de uso revisa dueña/sede | `ParseUUIDPipe` + `CambiarEstadoDto` |

```ts
// src/app.module.ts
providers: [
  { provide: APP_GUARD, useClass: ThrottlerGuard },     // 1.º límite de peticiones
  { provide: APP_GUARD, useClass: AutorizacionGuard },  // 2.º token y rol en TODAS las rutas
],

// src/auth/autorizacion.ts
export const Publico = () => SetMetadata('publico', true);
// ...dentro de canActivate:
if (this.reflector.getAllAndOverride('publico', [ctx.getHandler(), ctx.getClass()])) return true;
```

---

## 4. Entradas, inyección SQL y XSS

**Inyección SQL: no hay riesgo.** Todas las consultas usan parámetros (`$1`, `$2`), nunca se pega texto del usuario dentro del SQL:

```ts
await this.pool.query('SELECT ... FROM usuarios WHERE email = $1', [dto.email]);
```

**XSS:** React escapa todo lo que muestra y no se usa `dangerouslySetInnerHTML`. Además, ahora el nombre no puede contener `<`, `>` ni caracteres raros, y la CSP de la web impide enviar datos a otros sitios.

| Entrada | Validación aplicada |
|---|---|
| Correo | Formato de correo, máximo 254, se recorta y pasa a minúsculas |
| Clave | Login: obligatoria, máximo 72. Registro: 8–72, letras y números |
| Nombre | 3–80, solo letras, números, espacio y `. ' -` |
| Celular | Opcional, `+` y 6–20 dígitos/espacios/guiones |
| IDs (`servicioId`, `estilistaId`, `{id}`) | UUID |
| Fechas | `AAAA-MM-DD` y fecha real (rechaza `2026-13-45`); `inicio` en ISO 8601 estricto |
| Acción de estado | Solo `iniciar`, `finalizar` o `cancelar` |
| Campos extra | Rechazados (`forbidNonWhitelisted`): nadie puede enviar `rol: "SUPER_ADMIN"` |
| Tamaño del cuerpo | Máximo 10 KB en la API y 16 KB en Nginx (413 si se pasa) |

```ts
// src/auth/auth.dto.ts (extracto)
@Transform(recortar)
@MinLength(3) @MaxLength(80)
@Matches(/^[\p{L}\p{N} .'-]+$/u, { message: "El nombre solo puede tener letras, números, espacios y . ' -" })
nombre!: string;
```

En el frontend, los parámetros de las URL se arman con `URLSearchParams` y `encodeURIComponent`.

---

## 5. Sesión

La API **no guarda sesiones**: usa un token JWT firmado (por eso escala con varias réplicas). El token lleva solo `sub`, `nombre`, `rol` y `sedeId`: **nunca la clave ni su hash**. No se usan cookies, así que no aplica CSRF ni banderas de cookie.

| Problema | Riesgo | Corrección |
|---|---|---|
| Token en `localStorage` | Queda guardado para siempre, incluso en una PC compartida del salón | `sessionStorage`: se borra al cerrar la pestaña |
| El navegador no revisaba si el token venció | La pantalla mostraba "sesión iniciada" con un token muerto | `obtenerSesion()` lee `exp` y descarta la sesión vencida |
| Un 401 no cerraba la sesión | Estado inconsistente | `api.ts` cierra la sesión ante cualquier 401 |
| Sesión de 8 horas | Más tiempo para usar un token robado | 2 horas por defecto (`JWT_DURACION`) |

> **Riesgo aceptado:** un JWT no se puede "anular" antes de que venza. Para la siguiente fase se puede pasar a cookies `HttpOnly` + `Secure` + `SameSite=Strict` con una lista de tokens revocados en Redis.

---

## 6. Rate limiting

Implementado con `@nestjs/throttler` y **contadores en Redis** (`AlmacenLimitesRedis`). Así las 3 réplicas cuentan juntas y nadie puede esquivar el límite repartiéndose entre ellas.

| Ruta | Límite (por IP) | Variable |
|---|---|---|
| Todas | 300 por minuto | `LIMITE_GENERAL` |
| `POST /auth/login` | 20 por minuto | `LIMITE_LOGIN` |
| `POST /auth/login` (fuerza bruta) | 5 fallos por correo + IP → bloqueo de 15 min | `LOGIN_MAX_INTENTOS`, `LOGIN_BLOQUEO_MIN` |
| `POST /auth/registro` | 10 cada 10 minutos | `LIMITE_REGISTRO` |
| `POST /citas/bloqueos` | 30 por minuto (evita que un bot bloquee todo el día) | `LIMITE_BLOQUEOS` |

Al pasarse, la respuesta es **429** con los encabezados `Retry-After` y `X-RateLimit-*`.

**IP real detrás del balanceador:** Nginx **reemplaza** `X-Forwarded-For` con la IP real (`$remote_addr`) y la API solo confía en ese encabezado cuando `CONFIAR_EN_PROXY=si`. Se probó enviando 25 logins con IPs inventadas: desde la petición 20 la respuesta fue 429, es decir, la falsificación no sirvió.

**Pruebas de carga:** k6 envía miles de peticiones desde una sola IP, por eso solo durante esas pruebas se usa `LIMITE_PETICIONES=desactivado` (ver [06-como-ejecutar.md](06-como-ejecutar.md)).

---

## 7. Controles OWASP

| Control | Implementación | Dónde |
|---|---|---|
| Cabeceras de seguridad (API) | `helmet`: CSP, HSTS, `nosniff`, `X-Frame-Options`, sin `X-Powered-By` | `src/compartido/configurar-app.ts` |
| Cabeceras de seguridad (web) | CSP (scripts propios, conexión solo a la API, `frame-ancestors 'none'`), `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS en producción, sin `X-Powered-By` | `anycolor-web/next.config.ts` |
| CORS estricto | Solo `URL_FRONTEND`; métodos `GET/POST/PATCH`; cabeceras `Content-Type` y `Authorization`; sin credenciales | `configurar-app.ts` |
| Errores sin detalles | Filtro general: el detalle va al log y la respuesta es un mensaje genérico | `errores-generales.filter.ts` |
| Control de acceso | Denegar por defecto + roles + filtro por sede | `app.module.ts`, `autorizacion.ts` |
| Swagger | Desactivado en producción salvo `SWAGGER=activado` | `configurar-app.ts` |
| Nginx | `server_tokens off`, tamaño máximo 16 KB, timeouts contra clientes lentos | `infra/nginx.conf` |
| Contenedor | Corre como usuario `node` (no root) | `Dockerfile` |
| Dependencias | `npm audit --audit-level=high` en cada push: si aparece una falla alta, el CI se pone en rojo | `.github/workflows/ci.yml` |
| Contraseñas | bcrypt, nunca se devuelven ni se guardan en el navegador | `auth.service.ts` |

> **Nota de la demo:** el encabezado `X-Atendido-Por` de Nginx muestra qué réplica respondió (evidencia de EQ-02/EQ-03). Revela una IP interna de Docker, así que en una producción real se quita.

## Pendiente para producción (sprint 3)

- HTTPS con certificado (en AWS, con el balanceador).
- Clave de Redis y usuario de PostgreSQL con permisos mínimos (no superusuario).
- Secretos en AWS Secrets Manager en vez de `.env`.
- Bitácora de auditoría de accesos (EQ-06) y alertas.
