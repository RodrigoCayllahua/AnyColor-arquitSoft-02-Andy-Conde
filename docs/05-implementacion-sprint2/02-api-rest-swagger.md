# 02. API REST documentada con OpenAPI / Swagger

**OpenAPI** es el formato estándar para describir una API REST. **Swagger** es la página que lo muestra y permite probar cada endpoint desde el navegador.

## Cómo abrirlo

| Qué | Dirección |
|---|---|
| Página Swagger (probar endpoints) | `http://localhost:3001/api/docs` |
| Especificación OpenAPI en JSON | `http://localhost:3001/api/docs-json` |
| Con el balanceador (3 réplicas) | `http://localhost:8080/api/docs` |

Para probar endpoints protegidos: ejecutar `POST /auth/login`, copiar el `token`, pulsar **Authorize** y pegarlo.

La documentación se genera **desde el propio código**: el plugin `@nestjs/swagger` (configurado en `nest-cli.json`) lee los DTO, sus validaciones y los comentarios. Si cambia el código, cambia la documentación.

## Endpoints

Prefijo: `/api/v1`

| Método | Ruta | Acceso | Qué hace |
|---|---|---|---|
| POST | `/auth/login` | Público | Inicia sesión y devuelve el token JWT |
| POST | `/auth/registro` | Público | Registra una clienta |
| GET | `/auth/yo` | Con token | Datos del usuario que inició sesión |
| GET | `/catalogo/sedes` | Público | Lista de sedes |
| GET | `/catalogo/servicios` | Público | Servicios activos con precio y duración |
| GET | `/catalogo/servicios/{id}/estilistas` | Público | Estilistas habilitados para un servicio |
| GET | `/citas/disponibilidad` | Público | Turnos del día: libre, ocupado, en_proceso o pasado |
| POST | `/citas/bloqueos` | Clienta | Bloquea un horario 5 minutos |
| POST | `/citas` | Clienta | Confirma la cita (exige el bloqueo vigente) |
| GET | `/citas/mias` | Clienta | Citas de la clienta |
| GET | `/citas/agenda` | Personal | Agenda del día filtrada por sede y rol |
| PATCH | `/citas/{id}/estado` | Personal / clienta | Iniciar, finalizar o cancelar una cita |

## Códigos de respuesta

| Código | Cuándo |
|---|---|
| 200 / 201 | Todo bien / se creó |
| 400 | Datos inválidos (validación de DTO) o transición de estado no permitida |
| 401 | Sin token, token falso o vencido, clave incorrecta |
| 403 | El rol o la sede no tiene permiso |
| 404 | Servicio, estilista o cita no existe |
| 409 | Horario ya bloqueado por otra persona, cita que se cruza, correo repetido |

Los errores del dominio se traducen a HTTP en un solo lugar: `src/compartido/errores-dominio.filter.ts`.
