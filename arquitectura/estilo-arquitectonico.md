# Estilo arquitectónico seleccionado

**Estilo:** Monolito modular (backend) con organización interna en capas, más un frontend SPA desacoplado por API REST.

## Justificación

| Criterio | Cómo lo satisface el estilo |
| --- | --- |
| Escalabilidad (DA02) | La API es **sin estado**: se replican instancias detrás de un balanceador. |
| Consistencia (DA01, DA03) | Venta, inventario, caja y comisión se resuelven en **una transacción local** de PostgreSQL. |
| Mantenibilidad (DA06) | Módulos con fronteras claras; cada módulo con Clean Architecture (ver `enfoque/`). |
| Costo y operación | Una sola unidad de despliegue para el MVP. |
| Evolución | Los módulos más calientes (Citas, Reportes) pueden extraerse después. |

## Diagrama del estilo (vista de contenedores y módulos)

```mermaid
flowchart TD
    Cliente([Cliente])
    Estilista([Estilista])
    Cajero([Cajero])
    Admin([Admin de sede / SuperAdmin])

    Web["Frontend Web SPA<br><i>Next.js / React - responsive</i>"]

    Cliente --> Web
    Estilista --> Web
    Cajero --> Web
    Admin --> Web

    CDN["CDN / WAF<br><i>Cloudflare</i>"]
    LB["Balanceador de carga"]

    Web -->|HTTPS| CDN --> LB

    subgraph Monolito["Backend modular - NestJS (N instancias sin estado)"]
        direction TB
        MW["Transversales: JWT, RBAC por sede, validacion, idempotencia, auditoria, logs"]

        subgraph Modulos["Modulos de negocio"]
            direction LR
            U["Usuarios y Sedes"]
            C["Catalogo"]
            CI["Citas (motor de reservas)"]
            P["POS y Caja"]
            I["Inventario"]
            PE["Personal y Comisiones"]
            R["Reportes"]
        end

        MW --> Modulos
        CI -.-> C
        P -.-> I
        P -.-> PE
        P -.-> CI
    end

    LB --> MW

    PG[("PostgreSQL<br>fuente de verdad")]
    RD[("Redis<br>bloqueos 5 min + cache")]
    Q["Cola BullMQ"]
    W["Workers<br>recordatorios, tickets, exportes"]
    S3[("Almacen de objetos<br>S3 / Cloudinary")]
    Pago["Pasarela de pagos<br>Yape/Plin, tarjeta"]
    Msg["WhatsApp / Email"]

    Modulos --> PG
    CI --> RD
    C --> RD
    Modulos --> Q --> W --> Msg
    C --> S3
    P <--> Pago
```

## Límites del estilo

* El frontend **nunca** habla directo con Redis ni con PostgreSQL: solo consume la API REST.
* Un módulo no lee las tablas de otro: se comunica por su caso de uso o por un evento.
