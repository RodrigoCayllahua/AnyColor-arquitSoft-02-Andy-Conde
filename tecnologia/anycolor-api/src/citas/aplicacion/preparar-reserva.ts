// =============================================================
// APLICACIÓN · Paso común a bloquear y confirmar:
// valida servicio y estilista y calcula el rango con la duración real del servicio.
// =============================================================
import type {
  Estilista,
  RepositorioCatalogo,
  Servicio,
} from '../dominio/contratos';
import { NoEncontradoError, ReglaNegocioError } from '../dominio/errores';
import { claveBloqueo } from '../dominio/modelos/reglas-agenda';
import { RangoHorario } from '../dominio/modelos/rango-horario';

export interface SolicitudReserva {
  clienteId: string;
  servicioId: string;
  estilistaId: string;
  inicio: Date;
}

export interface ReservaPreparada {
  servicio: Servicio;
  estilista: Estilista;
  rango: RangoHorario;
  claves: [string, string];
}

export async function prepararReserva(
  catalogo: RepositorioCatalogo,
  s: SolicitudReserva,
): Promise<ReservaPreparada> {
  const servicio = await catalogo.obtenerServicio(s.servicioId);
  if (!servicio) throw new NoEncontradoError('El servicio no existe');
  const estilista = await catalogo.obtenerEstilista(s.estilistaId);
  if (!estilista) throw new NoEncontradoError('El estilista no existe');
  if (!(await catalogo.estilistaHaceServicio(estilista.id, servicio.id))) {
    throw new ReglaNegocioError(
      'El estilista no está habilitado para este servicio',
    );
  }
  if (s.inicio.getTime() < Date.now()) {
    throw new ReglaNegocioError('No se puede reservar un horario que ya pasó');
  }
  const rango = RangoHorario.desdeDuracion(s.inicio, servicio.duracionMin);
  const claves: [string, string] = [
    claveBloqueo('estilista', estilista.id, rango.inicio, rango.fin),
    claveBloqueo('sillon', estilista.sillonId, rango.inicio, rango.fin),
  ];
  return { servicio, estilista, rango, claves };
}
