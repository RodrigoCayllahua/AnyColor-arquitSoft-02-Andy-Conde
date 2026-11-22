// =============================================================
// APLICACIÓN · Caso de uso: bloquear un horario 5 minutos (HU02, RF07)
// =============================================================
import type {
  RepositorioCatalogo,
  RepositorioCitas,
  ServicioBloqueos,
} from '../dominio/contratos';
import { HorarioOcupadoError } from '../dominio/errores';
import { DURACION_BLOQUEO_MS } from '../dominio/modelos/reglas-agenda';
import { prepararReserva, type SolicitudReserva } from './preparar-reserva';

export class BloquearHorarioCasoUso {
  constructor(
    private readonly citas: RepositorioCitas,
    private readonly catalogo: RepositorioCatalogo,
    private readonly bloqueos: ServicioBloqueos,
  ) {}

  async ejecutar(s: SolicitudReserva) {
    const { estilista, rango, claves } = await prepararReserva(
      this.catalogo,
      s,
    );

    // 1) ¿Ya hay una cita guardada en ese horario?
    const ocupadas = await this.citas.buscarSolapadas(
      { estilistaId: estilista.id, sillonId: estilista.sillonId },
      rango,
    );
    if (ocupadas.length > 0)
      throw new HorarioOcupadoError('El horario ya está ocupado');

    // 2) Bloquear estilista y sillón. Todo o nada: si el segundo falla, se suelta el primero.
    const [kEstilista, kSillon] = claves;
    if (
      !(await this.bloqueos.adquirir(
        kEstilista,
        s.clienteId,
        DURACION_BLOQUEO_MS,
      ))
    ) {
      throw new HorarioOcupadoError(
        'Otra persona está reservando este horario',
      );
    }
    if (
      !(await this.bloqueos.adquirir(kSillon, s.clienteId, DURACION_BLOQUEO_MS))
    ) {
      await this.bloqueos.liberar(kEstilista, s.clienteId);
      throw new HorarioOcupadoError(
        'Otra persona está reservando este horario',
      );
    }

    return {
      inicio: rango.inicio.toISOString(),
      fin: rango.fin.toISOString(),
      expiraEn: new Date(Date.now() + DURACION_BLOQUEO_MS).toISOString(),
    };
  }
}
