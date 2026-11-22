# 01. Especificaciones SDD de las funcionalidades implementadas

SDD (*Spec-Driven Development*, desarrollo guiado por especificaciones): antes de programar se escribe qué debe pasar. Cada funcionalidad tiene su historia de usuario, sus criterios de aceptación en formato **Dado / Cuando / Entonces**, las tareas técnicas y la prueba que lo comprueba.

---

## SPEC-01. Iniciar sesión y registrarse

| | |
|---|---|
| **Historia** | HU10 – Como usuario quiero entrar con mi correo y clave para usar el sistema según mi rol |
| **Requisitos** | RF01, RF02, RF03 |
| **Endpoints** | `POST /auth/login`, `POST /auth/registro`, `GET /auth/yo` |

**Criterios de aceptación**

1. **Dado** un usuario registrado, **cuando** envía correo y clave correctos, **entonces** recibe 200 con un token JWT y sus datos (rol y sede), sin la clave ni su hash.
2. **Dado** una clave incorrecta, **cuando** intenta entrar, **entonces** recibe 401 con el mensaje genérico "Correo o clave incorrectos".
3. **Dado** una clienta nueva, **cuando** se registra con un correo libre, **entonces** se crea con rol CLIENTE y recibe su token.
4. **Dado** un correo ya usado, **cuando** se registra, **entonces** recibe 409.

**Tareas técnicas:** tabla `usuarios` con `hash_clave` (bcrypt); `AuthService` firma el JWT con `JWT_SECRETO`; DTO `LoginDto` y `RegistroDto` con class-validator; `AutorizacionGuard` lee el token.

**Prueba:** `test/api.e2e-spec.ts` (seguridad) y Postman 03–04.

---

## SPEC-02. Consultar el catálogo

| | |
|---|---|
| **Historia** | HU11 / HU01 – La clienta ve sedes, servicios y estilistas habilitados |
| **Requisitos** | RF04, RF05 |
| **Endpoints** | `GET /catalogo/sedes`, `GET /catalogo/servicios`, `GET /catalogo/servicios/{id}/estilistas` |

**Criterios de aceptación**

1. **Dado** el catálogo cargado, **cuando** se pide la lista de servicios, **entonces** se devuelven solo los activos con precio y duración.
2. **Dado** un servicio, **cuando** se piden sus estilistas, **entonces** se devuelven solo los habilitados para ese servicio.
3. **Dado** que el catálogo ya se consultó, **cuando** se vuelve a pedir en los 5 minutos siguientes, **entonces** se responde desde Redis sin ir a PostgreSQL.

**Tareas técnicas:** `CatalogoController`; `leerConCache()` con TTL de 300 s; claves `catalogo:*` en Redis.

**Prueba:** `src/compartido/cache.spec.ts`, Postman 01, k6 `hora-punta.js`.

---

## SPEC-03. Ver horarios disponibles

| | |
|---|---|
| **Historia** | HU01 – Ver los horarios libres de un estilista en un día |
| **Requisitos** | RF05, RF06 |
| **Endpoint** | `GET /citas/disponibilidad?servicioId&estilistaId&fecha` |

**Criterios de aceptación**

1. **Dado** un día laborable, **cuando** se consulta, **entonces** se devuelven los turnos cada 30 minutos desde las 9:00 hasta que el servicio termine antes del cierre (19:00) con estado `libre`, `ocupado`, `en_proceso` o `pasado`.
2. **Dado** una cita confirmada a las 9:30 de 60 minutos, **cuando** se consulta, **entonces** los turnos de 9:30 y 10:00 aparecen como `ocupado`.
3. **Dado** que otra clienta tiene bloqueado un horario, **cuando** se consulta, **entonces** ese turno aparece `en_proceso`.
4. **Dado** un servicio o estilista que no existe, **entonces** se responde 404.

**Tareas técnicas:** `ConsultarDisponibilidadCasoUso`; consulta de cruces con `tstzrange &&`; lectura de todos los bloqueos del día en una sola llamada `MGET` a Redis.

**Prueba:** `src/citas/aplicacion/casos-uso.spec.ts`, Postman 02, k6 `rendimiento-catalogo.js`.

---

## SPEC-04. Bloquear el horario 5 minutos

| | |
|---|---|
| **Historia** | HU02 – El horario elegido se reserva 5 minutos mientras la clienta confirma |
| **Requisito** | RF07 |
| **Endpoint** | `POST /citas/bloqueos` |

**Criterios de aceptación**

1. **Dado** un horario libre, **cuando** una clienta lo bloquea, **entonces** recibe 201 y nadie más puede tomarlo por 5 minutos.
2. **Dado** un horario bloqueado por otra persona, **cuando** se intenta bloquear, **entonces** se responde 409.
3. **Dado** que pasan 5 minutos sin confirmar, **entonces** el bloqueo expira solo y el horario vuelve a estar libre.
4. **Dado** 300 clientas que bloquean el mismo horario en el mismo instante, **entonces** exactamente una recibe 201.

**Tareas técnicas:** `BloquearHorarioCasoUso`; Redis `SET clave valor NX PX 300000` para el estilista y el sillón; implementación en memoria para pruebas.

**Prueba:** `src/citas/citas.spec.ts` (expiración), `test/api.e2e-spec.ts` (20 clientas a la vez), k6 `concurrencia-reservas.js` (300 clientas).

---

## SPEC-05. Confirmar la cita

| | |
|---|---|
| **Historia** | HU01 – Confirmar la reserva sin cruces |
| **Requisitos** | RF06, RF08 |
| **Endpoint** | `POST /citas` |

**Criterios de aceptación**

1. **Dado** que la clienta tiene el bloqueo vigente, **cuando** confirma, **entonces** se guarda la cita y se responde 201.
2. **Dado** que la clienta **no** tiene el bloqueo, **cuando** intenta confirmar, **entonces** se responde 409.
3. **Dado** que por cualquier motivo llega a la base de datos una cita que se cruza, **entonces** PostgreSQL la rechaza (error 23P01) y la API responde 409.

**Tareas técnicas:** `ConfirmarCitaCasoUso`; restricción `EXCLUDE USING gist` por estilista y por sillón; `ErroresDominioFilter` traduce 23P01 a 409; el bloqueo se libera al confirmar.

**Prueba:** `test/api.e2e-spec.ts` (guardia final con inserción directa), k6 `concurrencia-reservas.js`.

---

## SPEC-06. Mis citas, agenda del personal y cambio de estado

| | |
|---|---|
| **Historias** | HU07, HU12 |
| **Requisitos** | RF08, RF16 |
| **Endpoints** | `GET /citas/mias`, `GET /citas/agenda`, `PATCH /citas/{id}/estado` |

**Criterios de aceptación**

1. **Dado** una clienta con sesión, **cuando** pide sus citas, **entonces** ve solo las suyas.
2. **Dado** un administrador de sede, **cuando** pide la agenda, **entonces** ve solo las citas de su sede.
3. **Dado** una clienta, **cuando** pide la agenda del personal, **entonces** se responde 403.
4. **Dado** una cita confirmada, **cuando** el personal la inicia y la finaliza, **entonces** pasa a `en_atencion` y luego a `finalizada`; una transición inválida responde 400.
5. **Dado** una clienta, **cuando** cancela su propia cita, **entonces** se permite; si intenta iniciarla, se responde 403.

**Tareas técnicas:** `CambiarEstadoCitaCasoUso` con el patrón State en `cita.modelo.ts`; filtro por `sede_id` según el rol del token; índice `idx_citas_sede_inicio`.

**Prueba:** `casos-uso.spec.ts` (permisos), `test/api.e2e-spec.ts` (agenda), Postman 07 y 10.
