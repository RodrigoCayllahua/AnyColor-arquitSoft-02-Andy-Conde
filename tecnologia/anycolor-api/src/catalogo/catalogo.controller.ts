// =============================================================
// Módulo Catálogo (sprint 2: solo lectura). Lo que la clienta ve antes de reservar.
// Es lo más consultado del sistema: se sirve desde la caché (Redis) por 5 minutos.
// =============================================================
import { Controller, Get, Inject, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Publico } from '../auth/autorizacion';
import type { Pool } from 'pg';
import { POOL } from '../compartido/base-datos.module';
import { CACHE, leerConCache, type Cache } from '../compartido/cache';

const TTL_SEG = 300; // el catálogo cambia poco: 5 minutos en caché

@ApiTags('Catálogo')
@Publico() // el catálogo es información pública: se ve antes de iniciar sesión
@Controller('catalogo')
export class CatalogoController {
  constructor(
    @Inject(POOL) private readonly pool: Pool,
    @Inject(CACHE) private readonly cache: Cache,
  ) {}

  /** Lista de sedes */
  @Get('sedes')
  sedes() {
    return leerConCache(this.cache, 'catalogo:sedes', TTL_SEG, async () => {
      const { rows } = await this.pool.query(
        'SELECT id, nombre, direccion FROM sedes ORDER BY nombre',
      );
      return rows;
    });
  }

  /** Servicios activos con precio y duración */
  @Get('servicios')
  servicios() {
    return leerConCache(this.cache, 'catalogo:servicios', TTL_SEG, async () => {
      const { rows } = await this.pool.query(
        `SELECT id, nombre, categoria, duracion_min AS "duracionMin", precio::float AS precio
         FROM servicios WHERE activo ORDER BY categoria, nombre`,
      );
      return rows;
    });
  }

  /** Estilistas que pueden hacer un servicio */
  @Get('servicios/:id/estilistas')
  estilistas(@Param('id', ParseUUIDPipe) servicioId: string) {
    return leerConCache(
      this.cache,
      `catalogo:estilistas:${servicioId}`,
      TTL_SEG,
      async () => {
        const { rows } = await this.pool.query(
          `SELECT u.id, u.nombre, s.nombre AS sede
           FROM servicio_estilista se
           JOIN usuarios u ON u.id = se.estilista_id
           JOIN sedes s ON s.id = u.sede_id
           WHERE se.servicio_id = $1 ORDER BY s.nombre, u.nombre`,
          [servicioId],
        );
        return rows;
      },
    );
  }
}
