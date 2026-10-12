# Registro de Decisiones Arquitectónicas (ADR)

## Resumen

| ID | Decisión arquitectónica | Driver relacionado | Justificación | Resultado |
| --- | --- | --- | --- | --- |
| ADR-001 | Monolito modular escalable horizontalmente | DA02 Escalabilidad, DA06 Mantenibilidad | Una sola unidad de despliegue simplifica la operación inicial; los módulos aíslan responsabilidades y la API sin estado permite replicar instancias. | Módulos: Usuarios/Sedes, Catálogo, Citas, POS/Caja, Inventario, Personal/Comisiones, Reportes. |
| ADR-002 | Clean Architecture dentro de cada módulo | DA06 Mantenibilidad | Separa las reglas del salón de los detalles tecnológicos (BD, Redis, pagos). | Capas Dominio, Aplicación, Infraestructura, Presentación. |
| ADR-003 | PostgreSQL como fuente de verdad con restricción anti-solape | DA01, DA03 | ACID para citas, ventas, caja e inventario; una *exclusion constraint* impide dos citas solapadas aunque falle Redis. | Esquema relacional + `EXCLUDE USING gist` por estilista y sillón. |
| ADR-004 | Redis para bloqueo temporal (5 min) y caché | DA01, DA05 | `SET NX PX` es atómico y rápido; la caché evita golpear PostgreSQL en lecturas de catálogo. | Puerto `ServicioBloqueos` + adaptador Redis; caché con invalidación al confirmar. |
| ADR-005 | Autenticación JWT + RBAC con alcance por sede | DA04 Seguridad | Cada petición lleva rol y `sedeId`; los repositorios filtran siempre por sede. | Guard de roles + filtro de sede + auditoría. |
| ADR-006 | Integraciones mediante puertos y adaptadores | DA07, DA06 | Desacopla los casos de uso del proveedor de pagos, mensajería y almacenamiento. | Contratos `ProcesadorPagos`, `Notificador`, `AlmacenObjetos`, `EmisorComprobantes`. |
| ADR-007 | Procesamiento asíncrono con colas (BullMQ) | DA07, DA05 | Recordatorios, tickets PDF y exportaciones no deben frenar la caja ni la reserva. | Workers separados de la API. |
| ADR-008 | Idempotencia en operaciones críticas | DA03 | Los reintentos de red no deben duplicar cobros ni descuentos de stock. | Cabecera `Idempotency-Key` + tabla de claves. |
| ADR-009 | Analítica desacoplada (réplica de lectura → Data Mart) | DA08 | Los reportes pesados no deben competir con la operación. | Etapa 3: réplica; Etapa 4: modelo dimensional. |
| ADR-010 | Frontend SPA con Next.js/React consumiendo API REST | DA02, RC05 | Interfaz responsive, desplegable en CDN, separada del backend por contrato REST. | Aplicación web independiente. |

---

## Detalle de las decisiones críticas

### ADR-001 · Monolito modular

* **Estado:** Aceptada.
* **Contexto:** Equipo pequeño, una sola persona desarrolladora, dominio con transacciones que cruzan módulos (venta → inventario → comisión). Hay que escalar a >10 000 usuarios concurrentes.
* **Decisión:** Un solo backend (NestJS) dividido en módulos con fronteras claras. La API **no guarda estado en memoria** (sesión en JWT, bloqueos en Redis), por lo que se replican instancias detrás de un balanceador.
* **Alternativas descartadas:**
  * *Microservicios:* añade latencia, despliegue y consistencia eventual en flujos que necesitan transacción ACID (venta + stock). Costo injustificado en esta etapa.
  * *Monolito sin módulos:* es más rápido al inicio, pero degrada la mantenibilidad (DA06).
* **Consecuencias:** (+) transacciones locales, despliegue simple. (−) un módulo defectuoso puede afectar a todo el proceso; se mitiga con pruebas y fronteras claras. El módulo de Citas es candidato a extraerse primero si fuese necesario.

### ADR-003 + ADR-004 · Reserva concurrente: Redis **y** PostgreSQL

* **Contexto:** RF07 pide bloquear 5 minutos para que dos clientas no tomen el mismo horario.
* **Riesgo si se usara solo Redis:** si Redis se reinicia, expira el TTL antes de confirmar o hay una partición de red, dos confirmaciones podrían pasar.
* **Decisión (defensa en dos niveles):**
  1. **Nivel rápido (Redis):** al elegir horario se ejecuta `SET bloqueo:{recurso}:{rango} {clienta} NX PX 300000` sobre el estilista **y** el sillón. Si el segundo falla, se libera el primero.
  2. **Nivel definitivo (PostgreSQL):** al confirmar, la inserción de la cita choca con una restricción de exclusión:

     ```sql
     CREATE EXTENSION IF NOT EXISTS btree_gist;
     ALTER TABLE citas ADD CONSTRAINT sin_solape_estilista
       EXCLUDE USING gist (estilista_id WITH =, tstzrange(inicio, fin) WITH &&)
       WHERE (estado <> 'cancelada');
     ALTER TABLE citas ADD CONSTRAINT sin_solape_sillon
       EXCLUDE USING gist (sillon_id WITH =, tstzrange(inicio, fin) WITH &&)
       WHERE (estado <> 'cancelada');
     ```
* **Consecuencias:** (+) imposible tener citas solapadas aunque Redis falle. (−) hay que traducir el error de la BD a un mensaje "el horario ya fue tomado".
* **Verificación:** las pruebas `nucleo.pruebas.ts` cubren dos clientas simultáneas, expiración a 5 min y confirmación con bloqueo vencido.

### ADR-006 · Integraciones por puertos y adaptadores

Cada servicio externo se representa por un **contrato en el dominio** y se implementa en infraestructura:

| Contrato (dominio) | Adaptador de pruebas | Adaptador de producción |
| --- | --- | --- |
| `ServicioBloqueos` | `ServicioBloqueosMemoria` | `ServicioBloqueosRedis` |
| `ProcesadorPagos` | `ProcesadorPagosSimulado` | Niubiz / Izipay / Yape |
| `Notificador` | `NotificadorConsola` | WhatsApp API / correo |
| `RepositorioCitas`, `RepositorioVentas`, `RepositorioInventario` | memoria | PostgreSQL |

Cambiar de proveedor implica **reemplazar un adaptador y una línea de la raíz de composición**, nada más (driver DA06/DA07).

### ADR-008 · Idempotencia

El POS recibe una clave por operación (`Idempotency-Key`). Si el cajero reintenta por una caída de red, el caso de uso `RegistrarVenta` devuelve la venta ya registrada en lugar de cobrar de nuevo ni descontar stock otra vez (probado en `nucleo.pruebas.ts`).

---

## Decisiones pendientes (para siguientes sesiones)

| Tema | Pregunta abierta |
| --- | --- |
| Despliegue | ¿Backend en contenedores (Docker + ECS/Cloud Run) o en VM? |
| Multi-tenant | ¿Una BD con `sede_id` en cada tabla (recomendado) o un esquema por sede? |
| Facturación | ¿Qué PSE se integrará en la etapa fiscal? |
