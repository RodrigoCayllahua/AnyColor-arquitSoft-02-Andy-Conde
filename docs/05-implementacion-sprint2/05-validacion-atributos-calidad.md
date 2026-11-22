# 05. Validación de los atributos de calidad

Los escenarios están definidos en [08-escenarios-atributos-calidad.md](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md). Aquí se muestra **cómo se probó cada uno y qué salió**.

**Entorno de prueba:** una laptop con Docker Desktop (2,9 GB de RAM para la máquina virtual de Docker). En la misma máquina corren las 3 réplicas de la API, Nginx, PostgreSQL, Redis **y** el generador de carga k6. Es un entorno pequeño, así que los números en la nube serán mejores.

## Resumen

| Escenario | Herramienta | Resultado | Estado |
|---|---|---|---|
| EQ-01 Rendimiento | k6 `hora-punta.js` | p95 catálogo 7,85 ms y disponibilidad 18,31 ms con 300 usuarios | ✅ Cumple |
| EQ-02 Disponibilidad | k6 `caida-replica.js` | Se apagó una réplica 33 s en plena carga: 50 620 peticiones, 0 errores | ✅ Cumple (parte local) |
| EQ-03 Escalabilidad | k6 `rendimiento-catalogo.js` | 2 000 usuarios, 266 826 peticiones, 0 % errores, 1 328 peticiones/s | ⚠️ Cumple errores; tiempos un poco sobre la meta |
| EQ-04 Seguridad | Jest e2e + Postman | 401, 403 y 400 correctos; no se expone la clave; admin solo ve su sede | ✅ Cumple |
| EQ-05 Consistencia | k6 `concurrencia-reservas.js` + Jest e2e | 300 clientas al mismo horario: 1 gana, 299 reciben 409, 1 cita en la base | ✅ Cumple |
| EQ-06 Auditabilidad | — | Bitácora prevista para caja e inventario | ⏳ Sprint 3 |
| EQ-07 Mantenibilidad | Jest + revisión de código | Cambiar Redis por memoria o activar/desactivar la caché solo toca un adaptador o una variable | ✅ Cumple |
| EQ-08 Usabilidad | Aplicación web | Reserva en 4 pasos desde el celular | ✅ Implementado (falta prueba con usuarias) |
| EQ-09 Observabilidad | — | Logs por consola y cabecera `X-Atendido-Por` en el balanceador | ⏳ Parcial |
| EQ-10 Recuperabilidad | — | Volumen de datos en Docker; copias en la nube | ⏳ Sprint 3 |

---

## EQ-01. Rendimiento

**Prueba:** `hora-punta.js` – 300 usuarios virtuales durante 60 s consultando catálogo, estilistas y disponibilidad.

| Medida | Meta | Resultado |
|---|---|---|
| p95 catálogo | ≤ 200 ms | **7,85 ms** |
| p95 disponibilidad | ≤ 200 ms | **18,31 ms** |
| Errores | < 1 % | **0 %** (64 623 peticiones) |

Sin caché, los mismos tiempos fueron 46,24 ms y 107,89 ms: la caché aporta una mejora de casi 6 veces. Evidencia: `resultados/hora-punta.txt`, `resultados/hora-punta-sin-cache.txt`.

## EQ-02. Disponibilidad

**Prueba:** `caida-replica.js` – 200 usuarios durante 70 s. A los 20 s se apagó la réplica 2 (`docker stop`) y se volvió a encender 33 s después.

| Medida | Meta | Resultado |
|---|---|---|
| Errores vistos por la clienta | < 1 % | **0 %** (50 620 peticiones) |
| Recuperación sin intervención | < 30 s | Inmediata: Nginx pasa la petición a otra réplica |

La sesión no se pierde porque la API no guarda estado (token JWT). Lo que falta para el 99,9 % mensual es el monitoreo en la nube (sprint 3). Evidencia: `resultados/caida-replica.txt`, `resultados/caida-replica-eventos.txt`.

## EQ-03. Escalabilidad

**Prueba:** `rendimiento-catalogo.js` – sube por escalones 200 → 500 → 1 000 → 2 000 usuarios y se mantiene 45 s con 2 000.

| Ejecución | Errores | Peticiones/s | p95 catálogo | p95 disponibilidad |
|---|---|---|---|---|
| Inicial | 0 % | 651 | 5,17 s | 7,22 s |
| Con lectura `MGET` | 1,34 % | 856 | 0,80 s | 1,46 s |
| Con ajuste de Nginx y *keep-alive* (final) | **0 %** | **1 328** | **0,27 s** (mediana 97 ms) | **3,07 s** |

| Medida | Meta | Resultado final |
|---|---|---|
| Errores | < 1 % | ✅ 0 % de 266 826 peticiones |
| p95 general | < 3 s | ✅ 1,66 s |
| p95 disponibilidad | < 3 s | ⚠️ 3,07 s (70 ms por encima) |

**Lectura honesta:** con 2 000 usuarios simultáneos en una sola laptop no hubo ningún error, y las mejoras triplicaron la capacidad. El tiempo de disponibilidad quedó apenas sobre la meta porque k6 y todos los servicios comparten 2,9 GB de RAM. La meta de 10 000 usuarios se valida en la nube agregando réplicas (la API no tiene estado, así que escala sin cambiar código). Evidencia: `resultados/rendimiento-catalogo.txt`.

## EQ-04. Seguridad

| Caso | Esperado | Resultado |
|---|---|---|
| Sin token | 401 | ✅ 401 |
| Token falsificado | 401 | ✅ 401 |
| Clave incorrecta | 401 con mensaje genérico | ✅ "Correo o clave incorrectos" |
| Clienta pide la agenda del personal | 403 | ✅ 403 |
| Datos inválidos | 400 | ✅ 400 |
| Respuesta del login | Sin clave ni hash | ✅ |
| Administrador de sede | Solo citas de su sede | ✅ |

Herramientas: `test/api.e2e-spec.ts` y la colección Postman ejecutada con Newman (3 vueltas, **60 de 60 verificaciones aprobadas**). Evidencia: `resultados/postman-newman.txt`.

## EQ-05. Consistencia (cero citas cruzadas)

**Prueba:** `concurrencia-reservas.js` – 300 clientas distintas, cada una con su sesión, intentan bloquear **el mismo horario con la misma estilista en el mismo instante**.

| Medida | Esperado | Resultado |
|---|---|---|
| Bloqueos ganados | 1 | ✅ 1 |
| Rechazados con 409 | 299 | ✅ 299 |
| Citas confirmadas | 1 | ✅ 1 |
| Citas guardadas en la base para ese horario | 1 | ✅ 1 |
| Respuestas correctas (201 o 409) | 100 % | ✅ 300 de 300 |

Hay dos defensas: el bloqueo atómico en Redis (`SET NX`) y la restricción `EXCLUDE` de PostgreSQL. La segunda se probó aparte insertando directamente una cita cruzada: fue rechazada (23P01). Evidencia: `resultados/concurrencia-reservas.json`.

## EQ-07. Mantenibilidad

| Cambio | Qué hubo que tocar |
|---|---|
| Usar bloqueos en memoria en vez de Redis | Variable `BLOQUEOS=memoria` |
| Desactivar la caché | Variable `CACHE=desactivada` (así se hizo la comparación de EQ-01) |
| Agregar la caché del catálogo | Un archivo nuevo (Decorator); el repositorio de PostgreSQL no cambió |
