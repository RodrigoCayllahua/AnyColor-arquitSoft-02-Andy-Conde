// =============================================================
// PRESENTACIÓN · Controlador (adaptador de entrada, sin reglas de negocio)
// Traduce DTO (JSON) a casos de uso. En NestJS/Express solo se decora con rutas.
// =============================================================
import { BloquearHorarioCasoUso } from '../aplicacion/bloquear-horario.caso-uso';
import { ConfirmarCitaCasoUso } from '../aplicacion/confirmar-cita.caso-uso';
import { RangoHorario } from '../dominio/modelos/rango-horario';

export interface BloquearHorarioDto {
  clienteId: string;
  servicioId: string;
  estilistaId: string;
  sillonId: string;
  inicioISO: string;
}

export interface ConfirmarCitaDto {
  citaId: string;
  sedeId: string;
  clienteId: string;
  servicioId: string;
  estilistaId: string;
  sillonId: string;
  inicioISO: string;
  finISO: string;
}

export class CitasControlador {
  constructor(
    private readonly bloquear: BloquearHorarioCasoUso,
    private readonly confirmar: ConfirmarCitaCasoUso,
  ) {}

  /** POST /api/v1/citas/bloqueos */
  async postBloqueo(dto: BloquearHorarioDto): Promise<{ estado: number; cuerpo: object }> {
    try {
      const { rango } = await this.bloquear.ejecutar({ ...dto, inicio: new Date(dto.inicioISO) });
      return {
        estado: 201,
        cuerpo: { inicio: rango.inicio.toISOString(), fin: rango.fin.toISOString(), expiraEnSeg: 300 },
      };
    } catch (e) {
      return { estado: 409, cuerpo: { error: (e as Error).message } };
    }
  }

  /** POST /api/v1/citas */
  async postConfirmacion(dto: ConfirmarCitaDto): Promise<{ estado: number; cuerpo: object }> {
    try {
      const cita = await this.confirmar.ejecutar({
        id: dto.citaId,
        sedeId: dto.sedeId,
        clienteId: dto.clienteId,
        servicioId: dto.servicioId,
        estilistaId: dto.estilistaId,
        sillonId: dto.sillonId,
        rango: RangoHorario.crear(new Date(dto.inicioISO), new Date(dto.finISO)),
      });
      return { estado: 201, cuerpo: { citaId: cita.id, estado: cita.estadoActual } };
    } catch (e) {
      return { estado: 409, cuerpo: { error: (e as Error).message } };
    }
  }
}
