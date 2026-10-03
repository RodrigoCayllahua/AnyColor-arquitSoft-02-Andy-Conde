# 04. Atributos de calidad

Cada atributo se expresa como un **escenario medible** (fuente → estímulo → respuesta → medida).

| ID | Atributo | Escenario de calidad | Medida |
| --- | --- | --- | --- |
| AC01 | Rendimiento | Una clienta consulta catálogo o disponibilidad en hora punta. El sistema responde desde caché. | p95 < 200 ms |
| AC02 | Disponibilidad | Un nodo del backend falla durante la operación. El balanceador redirige el tráfico. | 99.9 % mensual |
| AC03 | Escalabilidad | Una campaña (Día de la Madre) multiplica las reservas. Se agregan instancias de la API sin cambiar el código. | > 10 000 usuarios concurrentes |
| AC04 | Seguridad | Un cajero de la sede A intenta ver ventas de la sede B. El acceso se rechaza. | 0 accesos cruzados; HTTPS/TLS; contraseñas con hash |
| AC05 | Consistencia | Dos clientas confirman el mismo horario al mismo tiempo, o dos ventas descuentan el mismo insumo. | 0 citas solapadas; 0 stock negativo |
| AC06 | Auditabilidad | Se anula una venta o se ajusta inventario. Queda registrado quién, cuándo y por qué. | 100 % de acciones críticas |
| AC07 | Mantenibilidad | Se cambia el proveedor de pagos o de mensajería. Solo se reemplaza un adaptador. | 0 cambios en dominio y casos de uso |
| AC08 | Usabilidad | Una clienta reserva desde su celular. | Diseño responsive, ≤ 4 pasos |
| AC09 | Observabilidad | Ocurre un error en producción. Queda en logs centralizados con métricas. | Alertas y trazas por petición |
| AC10 | Recuperabilidad | Falla la base de datos principal. | Respaldo diario con retención; RPO ≤ 24 h |
