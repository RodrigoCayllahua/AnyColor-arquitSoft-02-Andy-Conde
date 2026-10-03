# 00. Necesidad del negocio

> Entregable 1 del proceso de arquitectura (Guía 03).

## Problema que se quiere resolver

Las cadenas de salones de belleza con varias sedes suelen operar con agendas en papel, WhatsApp personal y cuadernos de caja. Eso genera:

| Problema | Consecuencia para el negocio |
| --- | --- |
| Dos clientas reservan el mismo estilista/sillón a la misma hora | Cruces de citas, reclamos, pérdida de la clienta |
| El stock de tintes y oxidantes no se descuenta al aplicar el servicio | Quiebres de stock, compras tardías, mermas sin explicación |
| La caja se cuadra a mano al final del día | Faltantes sin trazabilidad, riesgo de fraude |
| Las comisiones se calculan en Excel | Errores y conflictos con el personal |
| El dueño no ve las sedes en conjunto | Decisiones sin datos |

## Objetivos del negocio

1. Centralizar en una sola plataforma la operación de **todas** las sedes.
2. **Eliminar los cruces de horario** en reservas, incluso con muchas clientas reservando a la vez.
3. Mantener **inventario y caja consistentes** por sede.
4. Liquidar **comisiones automáticamente** según los servicios terminados.
5. Dar al dueño **indicadores consolidados** sin degradar la operación diaria.
6. Poder **crecer** (más sedes, más usuarios) sin rediseñar el sistema.

## Alcance resumido

Dentro: usuarios y RBAC, sedes, catálogo, motor de citas, POS y caja, inventario por sede, personal y comisiones, reportes, seguridad y auditoría.

Fuera: apps nativas, homologación SUNAT directa (se prepara la interfaz para un PSE), débito recurrente, GPS, fidelización por puntos, integración con ERP contable.

## Qué NO es el sistema (límites)

El sistema no emite comprobantes electrónicos firmados ante SUNAT: genera comprobantes **internos** y deja un puerto (`EmisorComprobantes`) listo para conectar un proveedor PSE en una etapa posterior.
