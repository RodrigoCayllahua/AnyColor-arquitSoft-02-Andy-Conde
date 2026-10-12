# Nivel 4 · Diagrama de código

> **Proyecto:** AnyColor Salón · **Módulo detallado:** Citas
> **Modelo:** C4 · Nivel 4 de 4 · **Notación:** UML · **Versión:** 3.0

---

## 1. Objetivo

Mostrar **cómo está organizado el código** de un componente del nivel 3: sus clases, interfaces y la forma en que colaboran. Se detalla el flujo **Reservar una cita sin cruces**, que es el driver principal del sistema (DA01) y ya está implementado en [`tecnologia/anycolor-core`](../../tecnologia/anycolor-core/src).

| Aspecto | Descripción |
|---|---|
| Pregunta que responde | ¿Qué clases existen dentro del módulo Citas y cómo se relacionan? |
| Audiencia | Desarrolladores |
| Notación | UML (diagrama de clases y diagrama de secuencia) |
| Por qué solo un módulo | El nivel 4 es opcional en C4 y se dibuja para los componentes más críticos. Citas concentra la concurrencia, Redis y la guardia en PostgreSQL |
| Nivel anterior | [Nivel3-Diagrama-de-Componentes.md](Nivel3-Diagrama-de-Componentes.md) |

---

## 2. Diagrama de clases

![Diagrama de clases del módulo Citas](../../img/nivel4-clases.png)

> Archivo fuente: [`img/fuentes/nivel4-clases.svg`](../../img/fuentes/nivel4-clases.svg)

### 2.1 Capas de Clean Architecture

| Capa | Contiene | Regla |
|---|---|---|
| **Presentación** | `CitasControlador` | Traduce HTTP a llamadas del caso de uso y responde 201 o 409 |
| **Aplicación** | `BloquearHorarioCasoUso`, `ConfirmarCitaCasoUso` | Coordinan los pasos; no conocen la tecnología |
| **Dominio** | `Cita`, `RangoHorario`, `EstadoCita`, `bloqueo.modelo` y los contratos | Contiene las reglas del salón; no importa nada de las otras capas |
| **Infraestructura** | `ServicioBloqueosRedis`, `ServicioBloqueosMemoria`, repositorios en memoria, `NotificadorConsola` | Implementa los contratos del dominio con una tecnología concreta |

> **Regla de dependencia:** las flechas apuntan hacia el dominio. Las clases de infraestructura implementan interfaces del dominio (triángulo hueco); el dominio nunca conoce a la infraestructura.

### 2.2 Clases del módulo Citas

| Clase | Tipo | Capa | Responsabilidad | Archivo |
|---|---|---|---|---|
| `CitasControlador` | Controlador | Presentación | `postBloqueo` (POST `/api/v1/citas/bloqueos`) y `postConfirmacion` (POST `/api/v1/citas`) | `presentacion/citas.controlador.ts` |
| `BloquearHorarioCasoUso` | Caso de uso | Aplicación | Valida servicio y estilista, revisa solapes y bloquea estilista y sillón 5 minutos | `aplicacion/bloquear-horario.caso-uso.ts` |
| `ConfirmarCitaCasoUso` | Caso de uso | Aplicación | Verifica el bloqueo, aplica la guardia final, crea y guarda la cita, libera y notifica | `aplicacion/confirmar-cita.caso-uso.ts` |
| `Cita` | Entidad | Dominio | Valida la cita y controla sus transiciones de estado | `dominio/modelos/cita.modelo.ts` |
| `EstadoCita` | Enumeración | Dominio | pendiente, confirmada, en_atencion, finalizada, cancelada | `dominio/modelos/cita.modelo.ts` |
| `RangoHorario` | Objeto de valor | Dominio | Inicio, fin y detección de solapes | `dominio/modelos/rango-horario.ts` |
| `bloqueo.modelo` | Reglas | Dominio | `DURACION_BLOQUEO_MS` (5 min) y `claveBloqueo()` | `dominio/modelos/bloqueo.modelo.ts` |
| `RepositorioCitas` | Interfaz | Dominio | Guardar, obtener y buscar citas solapadas | `dominio/contratos/repositorios.contrato.ts` |
| `RepositorioServicios` | Interfaz | Dominio | Consultar el servicio y sus estilistas habilitados | `dominio/contratos/repositorios.contrato.ts` |
| `ServicioBloqueos` | Interfaz | Dominio | Adquirir, consultar y liberar bloqueos | `dominio/contratos/servicios-externos.contrato.ts` |
| `Notificador` | Interfaz | Dominio | Confirmar la cita a la clienta | `dominio/contratos/servicios-externos.contrato.ts` |
| `ServicioBloqueosRedis` | Adaptador | Infraestructura | `SET NX PX` y liberación segura con script Lua | `infraestructura/servicio-bloqueos-redis.ts` |
| `ServicioBloqueosMemoria` | Adaptador | Infraestructura | Bloqueos en memoria con reloj simulado (pruebas) | `infraestructura/servicio-bloqueos-memoria.ts` |
| `RepositorioCitasMemoria` | Repositorio | Infraestructura | Citas en memoria (pruebas) | `infraestructura/repositorios-memoria.ts` |
| `NotificadorConsola` | Adaptador | Infraestructura | Notificación simulada (pruebas) | `infraestructura/adaptadores-simulados.ts` |

### 2.3 Notación UML utilizada

| Símbolo | Significado | Ejemplo |
|---|---|---|
| Línea continua con flecha abierta | Asociación: la clase guarda una referencia a la otra | `ConfirmarCitaCasoUso` → `RepositorioCitas` |
| Línea discontinua con triángulo hueco | Realización: implementa una interfaz | `ServicioBloqueosRedis` ▷ `ServicioBloqueos` |
| Nombre en cursiva con «interface» | Interfaz | `ServicioBloqueos` |
| `-` y `+` | Atributo o método privado y público | `- estado`, `+ confirmar()` |

---

## 3. Diagrama de secuencia: reservar una cita sin cruces

![Diagrama de secuencia de la reserva concurrente](../../img/nivel4-secuencia.png)

> Archivo fuente: [`img/fuentes/nivel4-secuencia.svg`](../../img/fuentes/nivel4-secuencia.svg)

| Paso | Origen → destino | Acción |
|---|---|---|
| 1–2 | Cliente web → `CitasControlador` → `BloquearHorarioCasoUso` | Pide bloquear el horario elegido |
| 3 | `BloquearHorarioCasoUso` → `RepositorioCitas` | Verifica que no haya citas solapadas |
| 4–5 | `ServicioBloqueos` → Redis | `SET NX PX 300000` para estilista y sillón |
| 6 | `CitasControlador` → Cliente web | `201` con 300 segundos para confirmar |
| 7–10 | `ConfirmarCitaCasoUso` → `ServicioBloqueos` → Redis | Comprueba que el bloqueo siga siendo de la clienta |
| 11 | `ConfirmarCitaCasoUso` → `RepositorioCitas` | Guardia final en la fuente de verdad |
| 12 | `ConfirmarCitaCasoUso` → `Cita` | `Cita.crear()` y `confirmar()` |
| 13–14 | `RepositorioCitas` → PostgreSQL | `INSERT` protegido por la restricción `EXCLUDE` |
| 15–17 | — | Libera los bloqueos, notifica y responde `201` |
| 18–19 | Alternativa | Si el bloqueo venció o es de otra persona: `409 Conflict` |

---

## 4. Patrones y principios que se ven en este nivel

| Elemento del diagrama | Patrón o principio |
|---|---|
| `ServicioBloqueosRedis`, `NotificadorConsola` | Patrón **Adapter** |
| `RepositorioCitas` y sus implementaciones | Patrón **Repository** |
| `Cita.crear()`, `RangoHorario.desdeDuracion()` | **Método de fábrica** estático |
| Los casos de uso reciben interfaces, no clases concretas | Principio de **inversión de dependencias** (SOLID) |
| Una clase por responsabilidad | Principio de **responsabilidad única** (SOLID) |

> Detalle completo en [`03-diseño-de-software/diseño-interno`](../03-diseño-de-software/diseño-interno/).

## 5. Verificación

```bash
cd tecnologia/anycolor-core
npm install
npm run pruebas
```

Las 16 pruebas cubren, entre otras: dos clientas que piden el mismo horario, expiración del bloqueo a los 5 minutos, confirmación con bloqueo vencido y cancelación que libera el horario.
