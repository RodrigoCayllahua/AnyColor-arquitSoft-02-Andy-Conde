// =============================================================
// DOMINIO · Entidad Cita y su máquina de estados
// =============================================================
import { ReglaNegocioError } from '../errores';
import { RangoHorario } from './rango-horario';

export type EstadoCita =
  'pendiente' | 'confirmada' | 'en_atencion' | 'finalizada' | 'cancelada';

/** REGLA: transiciones permitidas. Cualquier otra se rechaza. */
const TRANSICIONES: Record<EstadoCita, ReadonlyArray<EstadoCita>> = {
  pendiente: ['confirmada', 'cancelada'],
  confirmada: ['en_atencion', 'cancelada'],
  en_atencion: ['finalizada'],
  finalizada: [],
  cancelada: [],
};

export interface DatosCita {
  id: string;
  sedeId: string;
  clienteId: string;
  estilistaId: string;
  sillonId: string;
  servicioId: string;
  rango: RangoHorario;
}

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

  /** Crea una cita nueva: siempre empieza en "pendiente". */
  static crear(d: DatosCita): Cita {
    if (!d.sedeId)
      throw new ReglaNegocioError('La cita debe pertenecer a una sede');
    if (!d.clienteId) throw new ReglaNegocioError('La cita debe tener cliente');
    return new Cita(
      d.id,
      d.sedeId,
      d.clienteId,
      d.estilistaId,
      d.sillonId,
      d.servicioId,
      d.rango,
      'pendiente',
    );
  }

  /** Vuelve a armar una cita que ya estaba guardada en la base de datos. */
  static reconstruir(d: DatosCita, estado: EstadoCita): Cita {
    return new Cita(
      d.id,
      d.sedeId,
      d.clienteId,
      d.estilistaId,
      d.sillonId,
      d.servicioId,
      d.rango,
      estado,
    );
  }

  get estadoActual(): EstadoCita {
    return this.estado;
  }

  private transicionar(nuevo: EstadoCita): void {
    if (!TRANSICIONES[this.estado].includes(nuevo)) {
      throw new ReglaNegocioError(
        `No se puede pasar de ${this.estado} a ${nuevo}`,
      );
    }
    this.estado = nuevo;
  }

  confirmar(): void {
    this.transicionar('confirmada');
  }
  iniciarAtencion(): void {
    this.transicionar('en_atencion');
  }
  finalizar(): void {
    this.transicionar('finalizada');
  }
  cancelar(): void {
    this.transicionar('cancelada');
  }
}
