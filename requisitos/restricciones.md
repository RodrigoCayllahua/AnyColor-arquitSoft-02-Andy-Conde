# Restricciones del sistema

1. El sistema será desarrollado como una aplicación web.
2. La solución debe soportar múltiples sedes.
3. La persistencia principal utilizará PostgreSQL.
4. Redis será utilizado para caché y control temporal de concurrencia.
5. La comunicación entre frontend y backend utilizará REST/JSON.
6. Las operaciones críticas deben utilizar mecanismos de idempotencia.
7. El sistema debe utilizar HTTPS/TLS para proteger las comunicaciones.
8. El sistema debe permitir integración futura con servicios externos de pago y mensajería.
9. El sistema debe mantener registros de auditoría para operaciones críticas.
10. La aplicación debe permitir evolución futura hacia una capa analítica o Data Mart.
