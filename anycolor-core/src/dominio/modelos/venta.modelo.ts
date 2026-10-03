// =============================================================
// DOMINIO · Entidad Venta (POS)
// =============================================================
export type MetodoPago = 'efectivo' | 'tarjeta' | 'yape_plin';

export interface LineaVenta {
  readonly tipo: 'servicio' | 'producto';
  readonly referenciaId: string;
  readonly cantidad: number;
  readonly precioUnitario: number;
}

export class Venta {
  private constructor(
    public readonly id: string,
    public readonly sedeId: string,
    public readonly cajeroId: string,
    public readonly lineas: ReadonlyArray<LineaVenta>,
    public readonly total: number,
    public readonly metodoPago: MetodoPago,
    /** Clave de idempotencia: un reintento de red no duplica el cobro. */
    public readonly claveIdempotencia: string,
    /** Solo el identificador de transacción; nunca datos bancarios. */
    public readonly idTransaccion: string,
  ) {}

  static crear(datos: {
    id: string; sedeId: string; cajeroId: string; lineas: ReadonlyArray<LineaVenta>;
    metodoPago: MetodoPago; claveIdempotencia: string; idTransaccion: string;
  }): Venta {
    if (datos.lineas.length === 0) throw new Error('Una venta no puede estar vacía');
    if (!datos.claveIdempotencia) throw new Error('La venta requiere clave de idempotencia');
    const total = datos.lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
    if (total <= 0) throw new Error('El total de la venta debe ser mayor que cero');
    return new Venta(
      datos.id, datos.sedeId, datos.cajeroId, datos.lineas, total,
      datos.metodoPago, datos.claveIdempotencia, datos.idTransaccion,
    );
  }
}
