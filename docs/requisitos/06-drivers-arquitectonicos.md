# 06. Drivers arquitectónicos

Los principales drivers arquitectónicos de AnyColor Salón son:

## 1. Reserva concurrente

El sistema debe evitar que dos clientes puedan confirmar simultáneamente el mismo horario, estilista o recurso.

**Decisión:** utilizar Redis para realizar bloqueos temporales de 5 minutos.

## 2. Escalabilidad

El sistema debe soportar crecimiento de usuarios y múltiples sedes.

**Decisión:** utilizar una arquitectura que permita escalar horizontalmente los servicios backend.

## 3. Consistencia de datos

Las reservas, ventas e inventario requieren operaciones consistentes.

**Decisión:** utilizar PostgreSQL como base de datos transaccional.

## 4. Seguridad

Los usuarios deben acceder únicamente a las funciones permitidas por su rol.

**Decisión:** implementar autenticación, RBAC, HTTPS/TLS y auditoría.

## 5. Rendimiento

Las consultas frecuentes de catálogo y disponibilidad deben responder rápidamente.

**Decisión:** utilizar índices en PostgreSQL y Redis para caché.

## 6. Integración

El sistema debe poder comunicarse con servicios externos.

**Decisión:** utilizar API REST/JSON y procesamiento asíncrono mediante colas.

## 7. Evolución

La arquitectura debe permitir incorporar posteriormente capacidades analíticas y BI.

**Decisión:** separar las operaciones transaccionales de la futura capa analítica.
