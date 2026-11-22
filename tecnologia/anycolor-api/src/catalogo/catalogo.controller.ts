// =============================================================
// Módulo Catálogo (sprint 2: solo lectura). Lo que la clienta ve antes de reservar.
// =============================================================
import { Controller, Get, Inject, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Pool } from 'pg';
import { POOL } from '../compartido/base-datos.module';

@ApiTags('Catálogo')
@Controller('catalogo')
export class CatalogoController {
  constructor(@Inject(POOL) private readonly pool: Pool) {}

  /** GET /api/v1/catalogo/sedes */
  @Get('sedes')
  async sedes() {
    const { rows } = await this.pool.query(
      'SELECT id, nombre, direccion FROM sedes ORDER BY nombre',
    );
    return rows;
  }

  /** GET /api/v1/catalogo/servicios */
  @Get('servicios')
  async servicios() {
    const { rows } = await this.pool.query(
      `SELECT id, nombre, categoria, duracion_min AS "duracionMin", precio::float AS precio
       FROM servicios WHERE activo ORDER BY categoria, nombre`,
    );
    return rows;
  }

  /** GET /api/v1/catalogo/servicios/:id/estilistas → quién puede hacer ese servicio */
  @Get('servicios/:id/estilistas')
  async estilistas(@Param('id', ParseUUIDPipe) servicioId: string) {
    const { rows } = await this.pool.query(
      `SELECT u.id, u.nombre, s.nombre AS sede
       FROM servicio_estilista se
       JOIN usuarios u ON u.id = se.estilista_id
       JOIN sedes s ON s.id = u.sede_id
       WHERE se.servicio_id = $1 ORDER BY s.nombre, u.nombre`,
      [servicioId],
    );
    return rows;
  }
}
