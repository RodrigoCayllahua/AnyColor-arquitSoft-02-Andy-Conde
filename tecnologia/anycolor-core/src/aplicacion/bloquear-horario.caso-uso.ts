// =============================================================
// APLICACIÓN · Caso de uso: bloquear un horario 5 minutos (HU02, RF07)
// =============================================================
import { claveBloqueo, DURACION_BLOQUEO_MS } from '../dominio/modelos/bloqueo.modelo';
import { RangoHorario } from '../dominio/modelos/rango-horario';
import { RepositorioCitas, RepositorioServicios } from '../dominio/contratos/repositorios.contrato';
import { ServicioBloqueos } from '../dominio/contratos/servicios-externos.contrato';

export interface SolicitudBloqueo {
  clienteId: string;
  servicioId: string;
  estilistaId: string;
  sillonId: string;
  inicio: Date;
}

export class BloquearHorarioCasoUso {
  constructor(
    private readonly citas: RepositorioCitas,
    private readonly servicios: RepositorioServicios,
    private readonly bloqueos: ServicioBloqueos,
  ) {}

  async ejecutar(s: SolicitudBloqueo): Promise<{ rango: RangoHorario }> {
    const servicio = await this.servicios.obtener(s.servicioId);
    if (!servicio) throw new Error('El servicio no existe');
    if (!servicio.estilistasHabilitados.includes(s.estilistaId)) {
      throw new Error('El estilista no está habilitado para este servicio');
    }

    const rango = RangoHorario.desdeDuracion(s.inicio, servicio.duracionMin);

    const ocupadas = await this.citas.buscarSolapadas(
      { estilistaId: s.estilistaId, sillonId: s.sillonId },
      rango,
    );
    if (ocupadas.length > 0) throw new Error('El horario ya está ocupado');

    const kEst = claveBloqueo('estilista', s.estilistaId, rango.inicio, rango.fin);
    const kSil = claveBloqueo('sillon', s.sillonId, rango.inicio, rango.fin);

    if (!(await this.bloqueos.adquirir(kEst, s.clienteId, DURACION_BLOQUEO_MS))) {
      throw new Error('El estilista está siendo reservado por otra persona');
    }
    if (!(await this.bloqueos.adquirir(kSil, s.clienteId, DURACION_BLOQUEO_MS))) {
      // Todo o nada: si el sillón falla, se libera el estilista.
      await this.bloqueos.liberar(kEst, s.clienteId);
      throw new Error('El sillón está siendo reservado por otra persona');
    }
    return { rango };
  }
}
