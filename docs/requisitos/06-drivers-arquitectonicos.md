# 06. Drivers arquitectónicos

Un driver es un requisito, atributo de calidad o restricción que **cambia la forma en que diseñamos** la arquitectura.

| ID | Driver arquitectónico | Origen | ¿Por qué influye en la arquitectura? | Decisión que responde |
| --- | --- | --- | --- | --- |
| DA01 | Evitar reservas solapadas con muchas clientas simultáneas | RF07, AC05 | Exige exclusión mutua distribuida y una última guardia en la base de datos | ADR-004, ADR-003 |
| DA02 | Soportar > 10 000 usuarios concurrentes y crecer a más sedes | AC03, RC02 | Obliga a una API sin estado, escalable horizontalmente detrás de un balanceador | ADR-001 |
| DA03 | Consistencia en ventas, caja e inventario | AC05, RC03 | Exige transacciones ACID e idempotencia | ADR-003, ADR-008 |
| DA04 | Seguridad y aislamiento por rol y sede | AC04, RC02, RC07 | Condiciona autenticación, autorización y filtrado de datos por sede | ADR-005 |
| DA05 | Lecturas de catálogo y turnos < 200 ms | AC01 | Obliga a caché en memoria e índices | ADR-004 |
| DA06 | Mantenibilidad: cambios sin romper otros módulos | AC07 | Influye en la separación de responsabilidades y en la dirección de las dependencias | ADR-001, ADR-002 |
| DA07 | Integración con pagos, mensajería y almacenamiento | RC08 | Condiciona la comunicación con servicios externos y su reemplazo futuro | ADR-006, ADR-007 |
| DA08 | Evolución a analítica/BI sin degradar la operación | RC12 | Obliga a separar lecturas pesadas del modelo transaccional | ADR-009 |
