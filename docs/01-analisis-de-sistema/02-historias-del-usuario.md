# 02. Historias de usuario

Formato: **Como** [actor], **quiero** [acción], **para** [beneficio].

| ID | Historia de usuario |
| --- | --- |
| HU01 | Como **cliente**, quiero seleccionar sede, servicio, estilista y horario disponible, para reservar una cita sin conflictos. |
| HU02 | Como **cliente**, quiero que el horario elegido se bloquee 5 minutos mientras confirmo, para que nadie más lo tome al mismo tiempo. |
| HU03 | Como **cajero**, quiero registrar servicios y productos vendidos y cobrarlos, para cerrar la atención de la clienta. |
| HU04 | Como **cajero**, quiero abrir y cerrar mi turno de caja con arqueo, para controlar el efectivo del día. |
| HU05 | Como **administrador de sede**, quiero controlar el stock de productos e insumos con alertas, para no quedarme sin material. |
| HU06 | Como **administrador de sede**, quiero registrar asistencia, turnos y producción del personal, para controlar actividades y comisiones. |
| HU07 | Como **estilista**, quiero ver mi agenda y mis comisiones, para saber cuánto produje. |
| HU08 | Como **administrador de sede**, quiero consultar ingresos, atenciones y servicios populares de mi sede, para analizar su desempeño. |
| HU09 | Como **superadministrador**, quiero ver indicadores consolidados y comparar sedes, para decidir a nivel de negocio. |
| HU10 | Como **superadministrador**, quiero crear sedes y gestionar usuarios y roles, para controlar el acceso al sistema. |
| HU11 | Como **administrador de sede**, quiero gestionar el catálogo de servicios (duración, precio, insumos, estilistas habilitados), para ofrecerlos a las clientas. |
| HU12 | Como **cliente**, quiero cancelar o consultar mis citas y recibir recordatorios, para organizarme. |
| HU13 | Como **superadministrador**, quiero revisar la bitácora de auditoría, para detectar acciones indebidas en caja e inventario. |

## Trazabilidad HU ↔ RF

| Historia de usuario | Requisitos funcionales |
| --- | --- |
| HU01 Reservar cita | RF05, RF06, RF08 |
| HU02 Bloqueo temporal | RF07 |
| HU03 Registrar venta | RF09, RF10, RF11, RF12 |
| HU04 Turno de caja | RF18 |
| HU05 Inventario | RF12, RF13, RF14 |
| HU06 Personal | RF15, RF16 |
| HU07 Agenda/comisiones del estilista | RF16, RF17 |
| HU08 Reportes de sede | RF19, RF20 |
| HU09 Indicadores consolidados | RF19, RF21 |
| HU10 Sedes y usuarios | RF01, RF02, RF03 |
| HU11 Catálogo | RF04 |
| HU12 Cancelar/consultar/recordatorios | RF08, RF22 |
| HU13 Auditoría | RF23 |
