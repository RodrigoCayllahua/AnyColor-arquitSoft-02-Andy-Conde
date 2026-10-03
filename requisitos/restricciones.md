# Restricciones del sistema

| ID | Restricción | Tipo | Descripción |
| --- | --- | --- | --- |
| RC01 | Aplicación web | Tecnológica | Se accede desde navegador moderno en PC, tablet y móvil (sin apps nativas). |
| RC02 | Multisede | Negocio | Toda la información pertenece a una sede y debe estar lógicamente aislada. |
| RC03 | PostgreSQL | Tecnológica | La persistencia transaccional principal es PostgreSQL (ACID). |
| RC04 | Redis | Tecnológica | Redis se usa para caché y bloqueos temporales; **no** es fuente de verdad. |
| RC05 | API REST/JSON | Tecnológica | Frontend y backend se comunican solo por API REST sobre HTTPS. |
| RC06 | Idempotencia | Técnica | Cobros y registros críticos aceptan reintentos sin duplicarse. |
| RC07 | HTTPS/TLS | Seguridad | Todo el tráfico externo va cifrado; contraseñas con hash seguro. |
| RC08 | Integraciones por puertos | Arquitectónica | Pagos, mensajería y almacenamiento se conectan mediante adaptadores. |
| RC09 | Sin datos bancarios | Legal/Seguridad | Solo se guarda el identificador de transacción, nunca datos de tarjeta. |
| RC10 | Comprobantes internos | Legal | No se firman comprobantes SUNAT; se deja la interfaz preparada para un PSE. |
| RC11 | Auditoría | Cumplimiento | Las acciones críticas quedan en bitácora inmutable. |
| RC12 | Evolución analítica | Arquitectónica | El modelo debe permitir un Data Mart sin cargar la base transaccional. |
| RC13 | Git/GitHub | Proyecto | Código y documentación versionados en el repositorio del curso. |
