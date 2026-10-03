// =============================================================
// PRESENTACIÓN · Controlador (adaptador de entrada, sin reglas de negocio)
// Traduce DTO (JSON) a casos de uso. En NestJS/Express solo se decora con rutas.
// =============================================================
import { BloquearHorarioCasoUso } from '../aplicacion/bloquear-horario.caso-uso';

export interface BloquearHorarioDto {
  clienteId: string;
  servicioId: string;
  estilistaId: string;
  sillonId: string;
  inicioISO: string;
}

export class CitasControlador {
  constructor(private readonly bloquear: BloquearHorarioCasoUso) {}

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
}
