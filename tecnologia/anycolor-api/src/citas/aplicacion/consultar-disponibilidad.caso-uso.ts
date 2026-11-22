// =============================================================
// APLICACIÓN · Caso de uso: horarios libres de un estilista en un día (RF05)
// =============================================================
import type {
  RepositorioCatalogo,
  RepositorioCitas,
  ServicioBloqueos,
} from '../dominio/contratos';
import { NoEncontradoError } from '../dominio/errores';
import { RangoHorario } from '../dominio/modelos/rango-horario';
import {
  claveBloqueo,
  fechaHoraLocal,
  HORA_APERTURA,
  HORA_CIERRE,
  INTERVALO_TURNOS_MIN,
} from '../dominio/modelos/reglas-agenda';

export type EstadoTurno = 'libre' | 'ocupado' | 'en_proceso' | 'pasado';

export class ConsultarDisponibilidadCasoUso {
  constructor(
    private readonly citas: RepositorioCitas,
    private readonly catalogo: RepositorioCatalogo,
    private readonly bloqueos: ServicioBloqueos,
  ) {}

  async ejecutar(servicioId: string, estilistaId: string, fecha: string) {
    const servicio = await this.catalogo.obtenerServicio(servicioId);
    const estilista = await this.catalogo.obtenerEstilista(estilistaId);
    if (!servicio || !estilista)
      throw new NoEncontradoError('Servicio o estilista no encontrado');

    const dia = RangoHorario.crear(
      fechaHoraLocal(fecha, HORA_APERTURA),
      fechaHoraLocal(fecha, HORA_CIERRE),
    );
    const citasDelDia = await this.citas.buscarSolapadas(
      { estilistaId: estilista.id, sillonId: estilista.sillonId },
      dia,
    );

    // 1) Turnos del día y su estado según las citas ya guardadas
    const turnos: { inicio: string; fin: string; estado: EstadoTurno }[] = [];
    const porRevisar: { indice: number; claves: [string, string] }[] = [];
    for (
      let t = dia.inicio.getTime();
      t < dia.fin.getTime();
      t += INTERVALO_TURNOS_MIN * 60_000
    ) {
      const rango = RangoHorario.desdeDuracion(
        new Date(t),
        servicio.duracionMin,
      );
      if (rango.fin > dia.fin) break; // el servicio no alcanza a terminar antes del cierre

      let estado: EstadoTurno = 'libre';
      if (rango.inicio.getTime() < Date.now()) estado = 'pasado';
      else if (citasDelDia.some((c) => c.rango.solapaCon(rango)))
        estado = 'ocupado';
      else
        porRevisar.push({
          indice: turnos.length,
          claves: [
            claveBloqueo('estilista', estilista.id, rango.inicio, rango.fin),
            claveBloqueo('sillon', estilista.sillonId, rango.inicio, rango.fin),
          ],
        });

      turnos.push({
        inicio: rango.inicio.toISOString(),
        fin: rango.fin.toISOString(),
        estado,
      });
    }

    // 2) Bloqueos de 5 min de todos los turnos libres en UNA sola consulta (MGET)
    const titulares = await this.bloqueos.titulares(
      porRevisar.flatMap((p) => p.claves),
    );
    porRevisar.forEach((p, i) => {
      if (titulares[2 * i] || titulares[2 * i + 1])
        turnos[p.indice].estado = 'en_proceso';
    });

    return {
      servicio: servicio.nombre,
      estilista: estilista.nombre,
      fecha,
      turnos,
    };
  }
}
