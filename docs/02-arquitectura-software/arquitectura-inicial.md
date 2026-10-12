# Arquitectura inicial de AnyColor Salón

## Arquitectura en tres capas

```mermaid
flowchart TB

    U[Cliente]
    E[Estilista]
    C[Cajero]
    A[Administrador]

    subgraph PRESENTACION["Capa de Presentación"]
        WEB["Aplicación Web Responsive"]
        API["API REST / JSON (HTTPS)"]
    end

    subgraph NEGOCIO["Capa de Lógica de Negocio"]
        AUTH["Auth y RBAC"]
        CAT["Catálogo y Servicios"]
        BOOK["Motor de Reservas"]
        POS["POS y Caja"]
        INV["Gestión de Inventario"]
        STAFF["Gestión de Personal"]
        REPORT["Reportes"]
    end

    subgraph DATOS["Capa de Datos"]
        DB[("PostgreSQL")]
        REDIS[("Redis")]
    end

    EXT1["Servicio de Pagos"]
    EXT2["Servicio de Mensajería"]
    EXT3["Almacén de objetos"]

    U --> WEB
    E --> WEB
    C --> WEB
    A --> WEB

    WEB --> API
    API --> AUTH
    API --> CAT
    API --> BOOK
    API --> POS
    API --> INV
    API --> STAFF
    API --> REPORT

    AUTH --> DB
    CAT --> DB
    CAT --> REDIS
    CAT --> EXT3
    BOOK --> DB
    BOOK --> REDIS
    POS --> DB
    INV --> DB
    STAFF --> DB
    REPORT --> DB

    POS --> EXT1
    BOOK --> EXT2
```

## Descripción

### Capa de presentación

Contiene la aplicación web responsive utilizada por clientes, estilistas, cajeros y administradores.

### Capa de lógica de negocio

Contiene las reglas principales del sistema: autenticación, reservas, ventas, inventario, personal y reportes.

### Capa de datos

PostgreSQL almacena la información transaccional. Redis permite implementar caché y bloqueos temporales para controlar la concurrencia de las reservas.

### Sistemas externos

El sistema puede integrarse con servicios externos de pago y mensajería.
