# 03. Requisitos funcionales

| ID | Requisito funcional | Prioridad |
| --- | --- | --- |
| RF01 | El sistema debe permitir registrar, autenticar y recuperar el acceso de usuarios. | Alta |
| RF02 | El sistema debe gestionar roles y permisos (RBAC) con alcance por sede. | Alta |
| RF03 | El sistema debe permitir crear y administrar sedes, sillones y estaciones de trabajo. | Alta |
| RF04 | El sistema debe permitir crear, editar, activar/desactivar servicios y productos (categoría, duración, precio, insumos, estilistas habilitados, imagen). | Alta |
| RF05 | El sistema debe permitir consultar disponibilidad de estilistas y horarios en tiempo real. | Alta |
| RF06 | El sistema debe permitir reservar y confirmar citas. | Alta |
| RF07 | El sistema debe bloquear temporalmente el estilista y el sillón durante 5 minutos al iniciar una reserva. | Alta |
| RF08 | El sistema debe gestionar los estados de la cita: pendiente, confirmada, en atención, finalizada, cancelada. | Alta |
| RF09 | El sistema debe registrar ventas de servicios y productos. | Alta |
| RF10 | El sistema debe admitir efectivo, tarjeta y Yape/Plin, con operaciones idempotentes. | Alta |
| RF11 | El sistema debe emitir comprobante interno y ticket térmico, guardando solo el identificador de transacción. | Media |
| RF12 | El sistema debe descontar de forma transaccional el inventario asociado a una venta o servicio. | Alta |
| RF13 | El sistema debe permitir ajustes de inventario con motivo, soporte y responsable. | Media |
| RF14 | El sistema debe emitir alertas de stock bajo o agotado y conservar el historial de movimientos. | Media |
| RF15 | El sistema debe registrar asistencia, turnos y descansos del personal. | Media |
| RF16 | El sistema debe calcular automáticamente la comisión por servicio finalizado según el porcentaje del estilista. | Alta |
| RF17 | El estilista debe poder consultar su producción diaria y comisiones acumuladas del mes. | Media |
| RF18 | El sistema debe gestionar apertura, arqueo y cierre de caja por sede. | Alta |
| RF19 | El sistema debe generar reportes de ingresos, atenciones, servicios populares y consumo de stock. | Media |
| RF20 | El administrador de sede debe ver únicamente las métricas de su sede. | Alta |
| RF21 | El superadministrador debe ver indicadores consolidados y comparativos entre sedes. | Media |
| RF22 | El sistema debe enviar confirmaciones y recordatorios de cita (de forma asíncrona). | Media |
| RF23 | El sistema debe registrar en una bitácora de auditoría las acciones críticas (caja, anulaciones, ajustes, cuentas). | Alta |
| RF24 | El sistema debe exportar reportes en CSV o Excel. | Baja |
