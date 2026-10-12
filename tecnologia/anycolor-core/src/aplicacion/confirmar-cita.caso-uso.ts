// =============================================================
// APLICACIÓN · Caso de uso: confirmar una cita (HU01)
// =============================================================
import { Cita } from '../dominio/modelos/cita.modelo';
import { claveBloqueo } from '../dominio/modelos/bloqueo.modelo';
import { RangoHorario } from '../dominio/modelos/rango-horario';
import { RepositorioCitas } from '../dominio/contratos/repositorios.contrato';
import { Notificador, ServicioBloqueos } from '../dominio/contratos/servicios-externos.contrato';

export interface SolicitudConfirmacion {
  id: string;
  sedeId: string;
  clienteId: string;
  estilistaId: string;
  sillonId: string;
  servicioId: string;
  rango: RangoHorario;
}

export class ConfirmarCitaCasoUso {
  constructor(
    private readonly citas: RepositorioCitas,
    private readonly bloqueos: ServicioBloqueos,
    private readonly notificador: Notificador,
  ) {}

  async ejecutar(s: SolicitudConfirmacion): Promise<Cita> {
    const kEst = claveBloqueo('estilista', s.estilistaId, s.rango.inicio, s.rango.fin);
    const kSil = claveBloqueo('sillon', s.sillonId, s.rango.inicio, s.rango.fin);

    // 1) El bloqueo debe seguir vigente y ser de esta clienta (expira a los 5 min).
    if (
      (await this.bloqueos.titularDe(kEst)) !== s.clienteId ||
      (await this.bloqueos.titularDe(kSil)) !== s.clienteId
    ) {
      throw new Error('El bloqueo expiró o pertenece a otra persona');
    }

    // 2) Guardia final: la base de datos es la fuente de verdad, no Redis.
    const choques = await this.citas.buscarSolapadas(
      { estilistaId: s.estilistaId, sillonId: s.sillonId },
      s.rango,
    );
    if (choques.length > 0) throw new Error('El horario ya fue tomado');

    const cita = Cita.crear(s);
    cita.confirmar();
    await this.citas.guardar(cita);

    await this.bloqueos.liberar(kEst, s.clienteId);
    await this.bloqueos.liberar(kSil, s.clienteId);
    await this.notificador.confirmarCita(s.clienteId, cita.id);
    return cita;
  }
}
