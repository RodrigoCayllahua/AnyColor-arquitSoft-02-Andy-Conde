-- =============================================================
-- AnyColor Salón · Esquema de la base de datos (PostgreSQL 16)
-- Se puede ejecutar varias veces: borra y vuelve a crear las tablas.
-- =============================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- necesario para la restricción EXCLUDE

DROP TABLE IF EXISTS citas, servicio_estilista, servicios, usuarios, sillones, sedes CASCADE;

CREATE TABLE sedes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL,
  direccion  text
);

CREATE TABLE sillones (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sede_id  uuid NOT NULL REFERENCES sedes(id),
  nombre   text NOT NULL
);

CREATE TABLE usuarios (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre               text NOT NULL,
  email                text NOT NULL UNIQUE,
  hash_clave           text NOT NULL,
  rol                  text NOT NULL CHECK (rol IN ('CLIENTE','ESTILISTA','CAJERO','ADMIN_SEDE','SUPER_ADMIN')),
  sede_id              uuid REFERENCES sedes(id),          -- NULL para clientes y superadmin
  sillon_id            uuid REFERENCES sillones(id),       -- MVP: cada estilista trabaja en un sillón fijo
  telefono             text,
  porcentaje_comision  numeric(5,2) NOT NULL DEFAULT 0,
  creado_en            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE servicios (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        text NOT NULL,
  categoria     text NOT NULL,
  duracion_min  integer NOT NULL CHECK (duracion_min > 0),
  precio        numeric(10,2) NOT NULL CHECK (precio >= 0),
  activo        boolean NOT NULL DEFAULT true
);

-- Qué estilista puede hacer qué servicio
CREATE TABLE servicio_estilista (
  servicio_id   uuid NOT NULL REFERENCES servicios(id),
  estilista_id  uuid NOT NULL REFERENCES usuarios(id),
  PRIMARY KEY (servicio_id, estilista_id)
);

CREATE TABLE citas (
  id            uuid PRIMARY KEY,
  sede_id       uuid NOT NULL REFERENCES sedes(id),
  cliente_id    uuid NOT NULL REFERENCES usuarios(id),
  estilista_id  uuid NOT NULL REFERENCES usuarios(id),
  sillon_id     uuid NOT NULL REFERENCES sillones(id),
  servicio_id   uuid NOT NULL REFERENCES servicios(id),
  inicio        timestamptz NOT NULL,
  fin           timestamptz NOT NULL,
  estado        text NOT NULL CHECK (estado IN ('pendiente','confirmada','en_atencion','finalizada','cancelada')),
  creado_en     timestamptz NOT NULL DEFAULT now(),
  CHECK (fin > inicio),
  -- Guardia final (ADR-003): ni el estilista ni el sillón pueden tener dos citas que se crucen.
  CONSTRAINT sin_solape_estilista EXCLUDE USING gist
    (estilista_id WITH =, tstzrange(inicio, fin) WITH &&) WHERE (estado <> 'cancelada'),
  CONSTRAINT sin_solape_sillon EXCLUDE USING gist
    (sillon_id WITH =, tstzrange(inicio, fin) WITH &&) WHERE (estado <> 'cancelada')
);

CREATE INDEX idx_citas_sede_inicio ON citas (sede_id, inicio);
CREATE INDEX idx_citas_cliente ON citas (cliente_id);
