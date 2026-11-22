// =============================================================
// DOMINIO · Objeto de valor RangoHorario
// =============================================================
import { ReglaNegocioError } from '../errores';

export class RangoHorario {
  private constructor(
    public readonly inicio: Date,
    public readonly fin: Date,
  ) {}

  /** REGLA: un rango debe terminar después de empezar. */
  static crear(inicio: Date, fin: Date): RangoHorario {
    if (Number.isNaN(inicio.getTime()) || !(fin.getTime() > inicio.getTime())) {
      throw new ReglaNegocioError(
        'El rango horario debe terminar después de iniciar',
      );
    }
    return new RangoHorario(inicio, fin);
  }

  static desdeDuracion(inicio: Date, duracionMin: number): RangoHorario {
    return RangoHorario.crear(
      inicio,
      new Date(inicio.getTime() + duracionMin * 60_000),
    );
  }

  /** Dos rangos se solapan si cada uno empieza antes de que el otro termine. */
  solapaCon(otro: RangoHorario): boolean {
    return this.inicio < otro.fin && otro.inicio < this.fin;
  }
}
