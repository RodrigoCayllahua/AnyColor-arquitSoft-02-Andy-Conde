# Diagramas de AnyColor Salón

Todos los diagramas están escritos en Mermaid (GitHub los dibuja automáticamente).

## 1. C4 · Nivel 1 – Contexto

```mermaid
flowchart TB
    Cli(["Cliente<br>reserva desde el movil"])
    Est(["Estilista<br>agenda y comisiones"])
    Caj(["Cajero<br>ventas y caja"])
    Adm(["Admin de sede"])
    Sup(["SuperAdmin<br>control multisede"])

    Sis["<b>AnyColor Salon</b><br>Plataforma web multisede<br>citas, POS, inventario, comisiones"]

    Pay["Pasarela de pagos<br>Yape/Plin, tarjeta<br>[externo]"]
    Msg["WhatsApp / Email<br>[externo]"]
    Obj["Almacen de objetos<br>S3 / Cloudinary<br>[externo]"]
    Pse["Proveedor PSE SUNAT<br>[externo - futuro]"]

    Cli -->|HTTPS| Sis
    Est -->|HTTPS| Sis
    Caj -->|HTTPS| Sis
    Adm -->|HTTPS| Sis
    Sup -->|HTTPS| Sis

    Sis -->|API REST: cobros| Pay
    Sis -->|API: recordatorios| Msg
    Sis -->|SDK: imagenes y tickets| Obj
    Sis -.->|interfaz preparada| Pse
```

## 2. C4 · Nivel 2 – Contenedores

```mermaid
flowchart TB
    Nav["Navegador web / movil"]

    subgraph Borde["Borde"]
        CDN["CDN + WAF<br>Cloudflare"]
        FE["Frontend SPA<br>Next.js / React"]
    end

    LB["Balanceador de carga"]

    API["Backend Core API - NestJS<br>cluster de N instancias sin estado"]

    subgraph Datos["Datos"]
        PG[("PostgreSQL 16<br>transaccional ACID")]
        PGR[("PostgreSQL replica<br>solo lectura - Etapa 3")]
        RD[("Redis 7<br>bloqueos 5 min y cache")]
        S3[("Almacen de objetos")]
    end

    Q["Cola BullMQ"]
    WK["Workers Node.js<br>recordatorios, tickets, exportes"]
    Msg["WhatsApp / Email"]
    Pay["Pasarela de pagos"]
    Mon["Monitoreo y logs<br>APM"]

    Nav -->|HTTPS| CDN --> FE
    FE -->|JSON/REST HTTPS| LB
    LB --> API
    API -->|SQL| PG
    API -->|bloqueos y cache| RD
    API -->|encola| Q
    API -->|URLs firmadas| S3
    API -->|cobros| Pay
    API -.->|logs| Mon
    Q --> WK --> Msg
    WK -->|lee| PGR
    PG -.->|replicacion| PGR
```

## 3. C4 · Nivel 3 – Componentes del Backend

```mermaid
flowchart TB
    subgraph Trans["Transversales"]
        Auth["Auth y RBAC Guard<br>JWT + rol + sede"]
        Aud["Auditoria"]
        Idem["Idempotencia"]
    end

    subgraph Core["Modulos de negocio"]
        Usr["Usuarios y Sedes"]
        Cat["Catalogo y Servicios"]
        Cit["Citas<br>Booking Concurrency Engine"]
        Pos["POS y Caja<br>comprobante interno"]
        Inv["Inventario por sede"]
        Per["Personal y Comisiones"]
        Rep["Reportes y Analitica"]
        Evt["Async Event Dispatcher"]
    end

    Auth --> Usr
    Auth --> Cit
    Auth --> Pos
    Cit -->|consulta servicio| Cat
    Cit -->|bloqueo SET NX PX| RedisX[("Redis")]
    Cat -->|cache| RedisX
    Pos -->|descuenta insumos| Inv
    Pos -->|servicio finalizado| Per
    Pos --> Idem
    Cit --> Evt
    Pos --> Evt
    Pos --> Aud
    Inv --> Aud
    Rep -->|lecturas| PgR[("PostgreSQL / replica")]
    Usr & Cat & Cit & Pos & Inv & Per --> Pg[("PostgreSQL")]
    Evt --> Cola["Cola BullMQ"]
```

## 4. Estados de una cita

```mermaid
stateDiagram-v2
    [*] --> pendiente: clienta elige horario (bloqueo 5 min)
    pendiente --> confirmada: confirma antes de 5 min
    pendiente --> cancelada: expira el bloqueo o cancela
    confirmada --> en_atencion: estilista inicia
    confirmada --> cancelada: clienta o admin cancela
    en_atencion --> finalizada: estilista termina
    finalizada --> [*]
    cancelada --> [*]
```

## 5. Secuencia · Reserva concurrente

```mermaid
sequenceDiagram
    autonumber
    actor A as Clienta Ana
    actor B as Clienta Bea
    participant API as API (Citas)
    participant R as Redis
    participant DB as PostgreSQL
    participant Q as Cola
    participant W as WhatsApp

    A->>API: elegir estilista + sillon + 10:00
    API->>DB: hay cita solapada?
    DB-->>API: no
    API->>R: SET NX PX 300000 (estilista y sillon)
    R-->>API: OK
    API-->>A: bloqueado 5 min

    B->>API: elegir mismo horario
    API->>R: SET NX PX 300000
    R-->>API: nil (ocupado)
    API-->>B: 409 horario en proceso por otra persona

    A->>API: confirmar
    API->>R: el bloqueo sigue siendo de Ana?
    R-->>API: si
    API->>DB: INSERT cita (restriccion anti-solape)
    DB-->>API: OK
    API->>R: liberar bloqueo
    API->>Q: encolar confirmacion
    API-->>A: cita confirmada
    Q->>W: enviar mensaje
```

## 6. Secuencia · Venta en el POS (idempotente)

```mermaid
sequenceDiagram
    autonumber
    actor C as Cajero
    participant API as API (POS)
    participant DB as PostgreSQL
    participant P as Pasarela de pagos

    C->>API: POST /ventas (Idempotency-Key: K1)
    API->>DB: existe venta con K1?
    alt ya existe (reintento)
        DB-->>API: venta registrada
        API-->>C: 200 misma venta (sin cobrar de nuevo)
    else es nueva
        API->>DB: BEGIN
        API->>DB: validar stock de la sede
        API->>P: cobrar (Yape/tarjeta)
        P-->>API: aprobado + idTransaccion
        API->>DB: descontar insumos, registrar venta, comision
        API->>DB: COMMIT
        API-->>C: 201 ticket termico
    end
```

## 7. Modelo de datos (núcleo)

```mermaid
erDiagram
    SEDE ||--o{ SILLON : tiene
    SEDE ||--o{ USUARIO : emplea
    SEDE ||--o{ ITEM_INVENTARIO : guarda
    SEDE ||--o{ TURNO_CAJA : abre
    USUARIO ||--o{ CITA : "reserva (cliente)"
    USUARIO ||--o{ CITA : "atiende (estilista)"
    SILLON ||--o{ CITA : ocupa
    SERVICIO ||--o{ CITA : "se presta en"
    SERVICIO ||--o{ SERVICIO_INSUMO : requiere
    ITEM_INVENTARIO ||--o{ SERVICIO_INSUMO : "es consumido por"
    ITEM_INVENTARIO ||--o{ MOVIMIENTO_INVENTARIO : registra
    TURNO_CAJA ||--o{ VENTA : contiene
    VENTA ||--|{ LINEA_VENTA : detalla
    CITA ||--o| VENTA : "se cobra en"
    VENTA ||--o{ COMISION : genera
    USUARIO ||--o{ COMISION : percibe
    USUARIO ||--o{ ASISTENCIA : marca
    USUARIO ||--o{ AUDITORIA : ejecuta

    SEDE { uuid id PK
           string nombre }
    USUARIO { uuid id PK
              uuid sede_id FK
              string rol
              string hash_password
              numeric porcentaje_comision }
    CITA { uuid id PK
           uuid sede_id FK
           uuid cliente_id FK
           uuid estilista_id FK
           uuid sillon_id FK
           uuid servicio_id FK
           tstzrange rango
           string estado }
    SERVICIO { uuid id PK
               string nombre
               int duracion_min
               numeric precio_base }
    ITEM_INVENTARIO { uuid id PK
                      uuid sede_id FK
                      string nombre
                      numeric stock
                      numeric punto_reorden }
    VENTA { uuid id PK
            uuid turno_id FK
            string metodo_pago
            numeric total
            string clave_idempotencia UK
            string id_transaccion }
    COMISION { uuid id PK
               uuid venta_id FK
               uuid estilista_id FK
               numeric monto }
```

## 8. Roadmap de evolución

```mermaid
flowchart LR
    E1["Etapa 1 - MVP<br>Frontend + panel + caja<br>catalogo validado"] -->
    E2["Etapa 2 - Escalamiento<br>Backend NestJS, PostgreSQL<br>RBAC, Redis, colas"] -->
    E3["Etapa 3 - Multisede<br>replicas de lectura<br>balanceador, workers"] -->
    E4["Etapa 4 - Analitica<br>Data Mart / OLAP"]
```
