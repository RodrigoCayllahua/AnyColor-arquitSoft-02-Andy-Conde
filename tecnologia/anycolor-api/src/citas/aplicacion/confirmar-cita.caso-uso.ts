// =============================================================
// APLICACIÓN · Caso de uso: confirmar la cita (HU01, RF06)
// =============================================================
import { randomUUID } from 'node:crypto';
import type {
  Notificador,
  RepositorioCatalogo,
  RepositorioCitas,
  ServicioBloqueos,
} from '../dominio/contratos';
import { HorarioOcupadoError } from '../dominio/errores';
import { Cita } from '../dominio/modelos/cita.modelo';
import { prepararReserva, type SolicitudReserva } from './preparar-reserva';

export class ConfirmarCitaCasoUso {
  constructor(
    private readonly citas: RepositorioCitas,
    private readonly catalogo: RepositorioCatalogo,
    private readonly bloqueos: ServicioBloqueos,
    private readonly notificador: Notificador,
  ) {}

  async ejecutar(s: SolicitudReserva) {
    const { estilista, servicio, rango, claves } = await prepararReserva(
      this.catalogo,
      s,
    );

    // 1) El bloqueo debe seguir vigente y ser de esta clienta (vence a los 5 minutos).
    for (const clave of claves) {
      if ((await this.bloqueos.titularDe(clave)) !== s.clienteId) {
        throw new HorarioOcupadoError(
          'Tu bloqueo de 5 minutos venció. Elige el horario otra vez.',
        );
      }
    }

    // 2) Crear la cita con las reglas del dominio y guardarla.
    //    PostgreSQL vuelve a revisar con la restricción EXCLUDE: es la guardia final.
    const cita = Cita.crear({
      id: randomUUID(),
      sedeId: estilista.sedeId,
      clienteId: s.clienteId,
      estilistaId: estilista.id,
      sillonId: estilista.sillonId,
      servicioId: servicio.id,
      rango,
    });
    cita.confirmar();
    await this.citas.guardar(cita);

    // 3) Liberar el bloqueo y avisar a la clienta.
    for (const clave of claves) await this.bloqueos.liberar(clave, s.clienteId);
    await this.notificador.citaConfirmada(cita);

    return {
      id: cita.id,
      estado: cita.estadoActual,
      inicio: rango.inicio.toISOString(),
      fin: rango.fin.toISOString(),
    };
  }
}
