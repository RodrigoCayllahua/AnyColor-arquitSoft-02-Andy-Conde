# 01. Actores del sistema

Se usa **un único nombre por actor** en todos los documentos.

## Actores humanos

| Actor | Rol RBAC | ¿Qué necesita realizar? |
| --- | --- | --- |
| **Cliente** | `CLIENTE` | Explorar el catálogo, elegir sede/servicio/estilista/horario, reservar, cancelar, consultar sus citas. |
| **Estilista** | `ESTILISTA` | Ver su agenda, iniciar y finalizar atenciones, consultar su producción del día y comisiones del mes. |
| **Cajero** | `CAJERO` | Abrir y cerrar turno de caja, registrar ventas de servicios y productos, cobrar, emitir ticket térmico. |
| **Administrador de sede** | `ADMIN_SEDE` | Gestionar catálogo, inventario, personal y reportes **de su sede**. |
| **SuperAdministrador** | `SUPER_ADMIN` | Crear sedes, administrar usuarios y permisos, ver indicadores consolidados, revisar auditoría. |

## Sistemas externos

| Sistema externo | ¿Qué proporciona? | Etapa |
| --- | --- | --- |
| Pasarela de pagos / Yape-Plin | Procesar cobros con tarjeta o billetera digital | MVP |
| Servicio de mensajería (WhatsApp API / correo) | Recordatorios y confirmaciones de cita | Etapa 2 |
| Almacenamiento de objetos (S3 / Cloudinary) | Imágenes de servicios, estilos y comprobantes | Etapa 2 |
| Proveedor PSE de facturación | Comprobantes electrónicos SUNAT | Futuro (fuera de alcance) |
