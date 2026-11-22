// =============================================================
// INFRAESTRUCTURA · Lo que el módulo Citas necesita del catálogo, leído de PostgreSQL
// =============================================================
import type { Pool } from 'pg';
import type {
  Estilista,
  RepositorioCatalogo,
  Servicio,
} from '../dominio/contratos';

export class RepositorioCatalogoPostgres implements RepositorioCatalogo {
  constructor(private readonly pool: Pool) {}

  async obtenerServicio(id: string): Promise<Servicio | null> {
    const { rows } = await this.pool.query(
      'SELECT id, nombre, duracion_min, precio FROM servicios WHERE id = $1 AND activo',
      [id],
    );
    const f = rows[0];
    return f
      ? {
          id: f.id,
          nombre: f.nombre,
          duracionMin: f.duracion_min,
          precio: Number(f.precio),
        }
      : null;
  }

  async obtenerEstilista(id: string): Promise<Estilista | null> {
    const { rows } = await this.pool.query(
      `SELECT id, nombre, sede_id, sillon_id FROM usuarios WHERE id = $1 AND rol = 'ESTILISTA'`,
      [id],
    );
    const f = rows[0];
    return f
      ? { id: f.id, nombre: f.nombre, sedeId: f.sede_id, sillonId: f.sillon_id }
      : null;
  }

  async estilistaHaceServicio(
    estilistaId: string,
    servicioId: string,
  ): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'SELECT 1 FROM servicio_estilista WHERE estilista_id = $1 AND servicio_id = $2',
      [estilistaId, servicioId],
    );
    return (rowCount ?? 0) > 0;
  }
}
