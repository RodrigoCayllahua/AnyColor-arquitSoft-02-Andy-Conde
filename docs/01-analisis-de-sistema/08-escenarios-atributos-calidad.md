# 08. Escenarios de atributos de calidad de AnyColor Salón

Cada atributo de [04-atributos-de-calidad.md](04-atributos-de-calidad.md) se convierte en un escenario medible con seis partes: **fuente**, **estímulo**, **artefacto**, **condición (entorno)**, **respuesta** y **medida**. Se agrega cómo se verifica y en qué estado está.

> Las medidas marcadas como *propuesta por validar* se confirmarán con el dueño del salón y con pruebas de carga en el siguiente sprint.

---

## EQ-01. Rendimiento: consulta de catálogo y horarios libres

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Rendimiento (AC01) |
| **Fuente** | Clientas que reservan desde el celular en hora punta |
| **Estímulo** | Consultan el catálogo de servicios y los horarios libres de un estilista |
| **Artefacto** | Módulos Catálogo y Citas, caché en Redis y PostgreSQL |
| **Condición** | Operación normal, catálogo cargado en caché, datos representativos de 3 sedes |
| **Respuesta esperada** | El sistema devuelve servicios y horarios sin errores, leyendo primero de la caché |
| **Medida** | **Propuesta por validar:** p95 ≤ 200 ms para catálogo y disponibilidad, con menos del 1 % de errores técnicos |
| **Verificación** | Prueba de carga (k6) sobre `GET /api/v1/catalogo` y `GET /api/v1/citas/disponibilidad`; registrar p95 y errores |
| **Estado** | Pendiente: definir el entorno de prueba e implementar la caché del catálogo |

## EQ-02. Disponibilidad: falla de una instancia del backend

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Disponibilidad (AC02) |
| **Fuente** | Falla interna (caída de una instancia de la API) |
| **Estímulo** | Una de las instancias de la API deja de responder mientras hay cajeros cobrando |
| **Artefacto** | Contenedor API AnyColor y balanceador de carga |
| **Condición** | Al menos dos instancias activas detrás del balanceador, con monitoreo |
| **Respuesta esperada** | El balanceador retira la instancia caída y las peticiones siguen atendiéndose en las demás; la sesión no se pierde porque la API no guarda estado (JWT) |
| **Medida** | **Propuesta por validar:** disponibilidad mensual ≥ 99,9 % de las operaciones de reserva y caja; recuperación sin intervención en menos de 30 s |
| **Verificación** | Apagar una instancia durante una prueba y medir errores y tiempo de recuperación; revisar el reporte mensual de monitoreo |
| **Estado** | Pendiente: configurar balanceador y monitoreo (Etapa 3) |

## EQ-03. Escalabilidad: campaña del Día de la Madre

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Escalabilidad (AC03) |
| **Fuente** | Aumento de clientas durante una campaña |
| **Estímulo** | El número de reservas simultáneas se multiplica |
| **Artefacto** | API AnyColor (sin estado), Redis y PostgreSQL |
| **Condición** | Carga creciente y documentada; se agregan instancias de la API sin cambiar código |
| **Respuesta esperada** | El sistema mantiene los tiempos de respuesta agregando instancias horizontalmente |
| **Medida** | **Propuesta por validar:** soportar más de 10 000 usuarios concurrentes con p95 < 3 s y menos del 1 % de errores |
| **Verificación** | Aumentar la carga por escalones y comparar tiempos, errores y uso de CPU/memoria con 1, 2 y 4 instancias |
| **Estado** | Pendiente: confirmar la cantidad real de usuarios esperados con el negocio |

## EQ-04. Seguridad: acceso cruzado entre sedes

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Seguridad (AC04) |
| **Fuente** | Cajero de la sede A, usuario sin sesión o con token inválido |
| **Estímulo** | Intenta ver o modificar ventas, caja o inventario de la sede B |
| **Artefacto** | Componente API REST (guards JWT + RBAC por sede) y repositorios |
| **Condición** | Sistema en operación con usuarios de varias sedes y roles |
| **Respuesta esperada** | El sistema rechaza la operación (401/403), no ejecuta el cambio y no expone datos de otra sede; el intento queda en la bitácora |
| **Medida** | 100 % de los intentos no autorizados del plan de pruebas rechazados; 0 datos de otra sede en las respuestas revisadas |
| **Verificación** | Pruebas de acceso por rol y sede; revisión de respuestas y de la bitácora de auditoría |
| **Estado** | Pendiente: escribir la matriz de permisos por rol (RBAC) |

## EQ-05. Consistencia: dos clientas reservan el mismo horario

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Consistencia (AC05) — driver principal DA01 |
| **Fuente** | Dos clientas al mismo tiempo |
| **Estímulo** | Ambas eligen el mismo estilista, sillón y hora, y confirman casi a la vez |
| **Artefacto** | Módulo Citas: `BloquearHorarioCasoUso`, `ConfirmarCitaCasoUso`, Redis y restricción `EXCLUDE` de PostgreSQL |
| **Condición** | Operación normal y también con Redis reiniciado o bloqueo vencido |
| **Respuesta esperada** | Solo una obtiene el bloqueo de 5 minutos; la otra recibe 409. Si el bloqueo se pierde, PostgreSQL rechaza la segunda cita solapada |
| **Medida** | 0 citas solapadas por estilista o sillón; 0 stock negativo en ventas simultáneas |
| **Verificación** | Pruebas automatizadas en `tecnologia/anycolor-core` (`npm run pruebas`): dos clientas simultáneas, expiración a 5 min, confirmación con bloqueo vencido |
| **Estado** | **Verificado en el núcleo** (16 pruebas correctas); falta la prueba con PostgreSQL real |

## EQ-06. Auditabilidad: anulación de una venta

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Auditabilidad (AC06) |
| **Fuente** | Cajero o administrador de sede |
| **Estímulo** | Anula una venta, ajusta inventario o cierra caja con diferencia |
| **Artefacto** | Módulos POS y Caja, Inventario y componente de auditoría |
| **Condición** | Operación normal |
| **Respuesta esperada** | Queda un registro inmutable con quién, cuándo, qué cambió y por qué |
| **Medida** | 100 % de las acciones críticas definidas en RF23 con registro en la bitácora |
| **Verificación** | Ejecutar cada acción crítica y consultar la bitácora; intentar modificar un registro y comprobar que se rechaza |
| **Estado** | Pendiente: definir la tabla de auditoría |

## EQ-07. Mantenibilidad: cambio de proveedor de pagos

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Mantenibilidad (AC07) |
| **Fuente** | Equipo de desarrollo |
| **Estímulo** | Se reemplaza la pasarela (por ejemplo, Niubiz por Izipay) o el proveedor de mensajería |
| **Artefacto** | Contrato `ProcesadorPagos` (dominio) y su adaptador (infraestructura) |
| **Condición** | Módulos organizados con Clean Architecture y con pruebas del caso de uso |
| **Respuesta esperada** | El cambio se limita a un adaptador nuevo y a la raíz de composición |
| **Medida** | 0 archivos modificados en `dominio/` y `aplicacion/`; pruebas del módulo aprobadas |
| **Verificación** | Revisar el diff del cambio y ejecutar `npm run pruebas` |
| **Estado** | Estructura lista en el núcleo; el adaptador real se hará al integrar la pasarela |

## EQ-08. Usabilidad: reserva desde el celular

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Usabilidad (AC08) |
| **Fuente** | Clienta nueva |
| **Estímulo** | Reserva una cita desde su celular sin ayuda |
| **Artefacto** | Aplicación web (pantallas de reserva) |
| **Condición** | Celular de gama media, red 4G |
| **Respuesta esperada** | Completa la reserva sin errores ni pasos innecesarios |
| **Medida** | **Propuesta por validar:** ≤ 4 pasos y menos de 2 minutos para el 90 % de las clientas de prueba |
| **Verificación** | Prueba con 5 usuarias reales y registro de pasos y tiempo |
| **Estado** | Pendiente: prototipo de pantallas |

## EQ-09. Observabilidad: error en producción

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Observabilidad (AC09) |
| **Fuente** | Error inesperado en la API |
| **Estímulo** | Una petición falla con 5xx |
| **Artefacto** | Logs centralizados, métricas y alertas |
| **Condición** | Sistema publicado con monitoreo |
| **Respuesta esperada** | El error queda registrado con su identificador de petición y se genera una alerta |
| **Medida** | **Propuesta por validar:** 100 % de los 5xx con traza; alerta en menos de 5 minutos |
| **Verificación** | Provocar un error controlado y revisar logs y alerta |
| **Estado** | Pendiente (Etapa 3) |

## EQ-10. Recuperabilidad: pérdida de la base de datos

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Recuperabilidad (AC10) |
| **Fuente** | Falla de infraestructura |
| **Estímulo** | Se pierde la base de datos principal |
| **Artefacto** | PostgreSQL y política de respaldos |
| **Condición** | Respaldo diario automático con retención |
| **Respuesta esperada** | Se restaura el último respaldo y el sistema vuelve a operar |
| **Medida** | RPO ≤ 24 h; **propuesta por validar:** RTO ≤ 4 h |
| **Verificación** | Simulacro de restauración en un entorno de prueba una vez por mes |
| **Estado** | Pendiente: elegir el servicio administrado de PostgreSQL |

---

## Resumen de escenarios

| Código | Atributo | Qué se busca comprobar | Driver relacionado |
|---|---|---|---|
| EQ-01 | Rendimiento | Catálogo y horarios responden rápido en hora punta | DA05 |
| EQ-02 | Disponibilidad | La caída de una instancia no detiene reservas ni caja | DA02 |
| EQ-03 | Escalabilidad | Se soportan campañas agregando instancias | DA02 |
| EQ-04 | Seguridad | Nadie ve ni cambia datos de otra sede | DA04 |
| EQ-05 | Consistencia | Nunca hay dos citas en el mismo horario ni stock negativo | DA01, DA03 |
| EQ-06 | Auditabilidad | Toda acción crítica queda registrada | DA04 |
| EQ-07 | Mantenibilidad | Cambiar de proveedor solo toca un adaptador | DA06, DA07 |
| EQ-08 | Usabilidad | La clienta reserva en pocos pasos desde el celular | — |
| EQ-09 | Observabilidad | Los errores se detectan y se rastrean | — |
| EQ-10 | Recuperabilidad | Se puede restaurar la información | — |
