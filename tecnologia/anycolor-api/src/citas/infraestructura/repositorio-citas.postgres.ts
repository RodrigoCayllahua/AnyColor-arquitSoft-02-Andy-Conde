// =============================================================
// INFRAESTRUCTURA · RepositorioCitas implementado con PostgreSQL (patrón Repository)
// =============================================================
import type { Pool } from 'pg';
import type { CitaVista, RepositorioCitas } from '../dominio/contratos';
import { HorarioOcupadoError } from '../dominio/errores';
import { Cita, type EstadoCita } from '../dominio/modelos/cita.modelo';
import { RangoHorario } from '../dominio/modelos/rango-horario';

interface FilaCita {
  id: string;
  sede_id: string;
  cliente_id: string;
  estilista_id: string;
  sillon_id: string;
  servicio_id: string;
  inicio: Date;
  fin: Date;
  estado: EstadoCita;
}

const SELECT_VISTA = `
  SELECT c.id, c.inicio, c.fin, c.estado, s.nombre AS servicio, s.precio,
         e.nombre AS estilista, u.nombre AS cliente, se.nombre AS sede
  FROM citas c
  JOIN servicios s ON s.id = c.servicio_id
  JOIN usuarios e  ON e.id = c.estilista_id
  JOIN usuarios u  ON u.id = c.cliente_id
  JOIN sedes se    ON se.id = c.sede_id`;

export class RepositorioCitasPostgres implements RepositorioCitas {
  constructor(private readonly pool: Pool) {}

  async guardar(cita: Cita): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO citas (id, sede_id, cliente_id, estilista_id, sillon_id, servicio_id, inicio, fin, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          cita.id,
          cita.sedeId,
          cita.clienteId,
          cita.estilistaId,
          cita.sillonId,
          cita.servicioId,
          cita.rango.inicio,
          cita.rango.fin,
          cita.estadoActual,
        ],
      );
    } catch (e) {
      // 23P01 = la restricción EXCLUDE detectó un cruce de horario (guardia final).
      if ((e as { code?: string }).code === '23P01') {
        throw new HorarioOcupadoError(
          'El horario acaba de ser tomado por otra persona',
        );
      }
      throw e;
    }
  }

  async actualizarEstado(cita: Cita): Promise<void> {
    await this.pool.query('UPDATE citas SET estado = $2 WHERE id = $1', [
      cita.id,
      cita.estadoActual,
    ]);
  }

  async obtener(id: string): Promise<Cita | null> {
    const { rows } = await this.pool.query<FilaCita>(
      'SELECT * FROM citas WHERE id = $1',
      [id],
    );
    return rows[0] ? this.aEntidad(rows[0]) : null;
  }

  async buscarSolapadas(
    recurso: { estilistaId: string; sillonId: string },
    rango: RangoHorario,
  ): Promise<Cita[]> {
    const { rows } = await this.pool.query<FilaCita>(
      `SELECT * FROM citas
       WHERE estado <> 'cancelada'
         AND (estilista_id = $1 OR sillon_id = $2)
         AND tstzrange(inicio, fin) && tstzrange($3, $4)`,
      [recurso.estilistaId, recurso.sillonId, rango.inicio, rango.fin],
    );
    return rows.map((f) => this.aEntidad(f));
  }

  async listarAgenda(f: {
    desde: Date;
    hasta: Date;
    sedeId?: string;
    estilistaId?: string;
  }): Promise<CitaVista[]> {
    const { rows } = await this.pool.query(
      `${SELECT_VISTA}
       WHERE c.inicio >= $1 AND c.inicio < $2
         AND ($3::uuid IS NULL OR c.sede_id = $3)
         AND ($4::uuid IS NULL OR c.estilista_id = $4)
       ORDER BY c.inicio`,
      [f.desde, f.hasta, f.sedeId ?? null, f.estilistaId ?? null],
    );
    return rows.map(aVista);
  }

  async listarDeCliente(clienteId: string): Promise<CitaVista[]> {
    const { rows } = await this.pool.query(
      `${SELECT_VISTA} WHERE c.cliente_id = $1 ORDER BY c.inicio DESC`,
      [clienteId],
    );
    return rows.map(aVista);
  }

  private aEntidad(f: FilaCita): Cita {
    return Cita.reconstruir(
      {
        id: f.id,
        sedeId: f.sede_id,
        clienteId: f.cliente_id,
        estilistaId: f.estilista_id,
        sillonId: f.sillon_id,
        servicioId: f.servicio_id,
        rango: RangoHorario.crear(f.inicio, f.fin),
      },
      f.estado,
    );
  }
}

function aVista(f: Record<string, unknown>): CitaVista {
  return {
    id: f.id as string,
    inicio: (f.inicio as Date).toISOString(),
    fin: (f.fin as Date).toISOString(),
    estado: f.estado as EstadoCita,
    servicio: f.servicio as string,
    precio: Number(f.precio),
    estilista: f.estilista as string,
    cliente: f.cliente as string,
    sede: f.sede as string,
  };
}
