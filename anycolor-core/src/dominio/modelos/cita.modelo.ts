// =============================================================
// DOMINIO · Entidad Cita y su máquina de estados
// =============================================================
import { RangoHorario } from './rango-horario';

export type EstadoCita = 'pendiente' | 'confirmada' | 'en_atencion' | 'finalizada' | 'cancelada';

/** REGLA: transiciones permitidas. Cualquier otra se rechaza. */
const TRANSICIONES: Record<EstadoCita, ReadonlyArray<EstadoCita>> = {
  pendiente: ['confirmada', 'cancelada'],
  confirmada: ['en_atencion', 'cancelada'],
  en_atencion: ['finalizada'],
  finalizada: [],
  cancelada: [],
};

export class Cita {
  private constructor(
    public readonly id: string,
    public readonly sedeId: string,
    public readonly clienteId: string,
    public readonly estilistaId: string,
    public readonly sillonId: string,
    public readonly servicioId: string,
    public readonly rango: RangoHorario,
    private estado: EstadoCita,
  ) {}

  static crear(datos: {
    id: string; sedeId: string; clienteId: string; estilistaId: string;
    sillonId: string; servicioId: string; rango: RangoHorario;
  }): Cita {
    if (!datos.sedeId) throw new Error('La cita debe pertenecer a una sede');
    if (!datos.clienteId) throw new Error('La cita debe tener cliente');
    return new Cita(
      datos.id, datos.sedeId, datos.clienteId, datos.estilistaId,
      datos.sillonId, datos.servicioId, datos.rango, 'pendiente',
    );
  }

  get estadoActual(): EstadoCita {
    return this.estado;
  }

  /** Una cita cancelada libera el horario: ya no cuenta para solapes. */
  ocupaHorario(): boolean {
    return this.estado !== 'cancelada';
  }

  private transicionar(nuevo: EstadoCita): void {
    if (!TRANSICIONES[this.estado].includes(nuevo)) {
      throw new Error(`Transición inválida de cita: ${this.estado} → ${nuevo}`);
    }
    this.estado = nuevo;
  }

  confirmar(): void { this.transicionar('confirmada'); }
  iniciarAtencion(): void { this.transicionar('en_atencion'); }
  finalizar(): void { this.transicionar('finalizada'); }
  cancelar(): void { this.transicionar('cancelada'); }
}
