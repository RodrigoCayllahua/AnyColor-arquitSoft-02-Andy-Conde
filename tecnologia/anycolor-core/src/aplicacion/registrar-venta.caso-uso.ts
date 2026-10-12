// =============================================================
// APLICACIÓN · Caso de uso: registrar venta en el POS (HU03)
// =============================================================
import { Venta, LineaVenta, MetodoPago } from '../dominio/modelos/venta.modelo';
import { ItemInventario } from '../dominio/modelos/inventario.modelo';
import { RepositorioVentas, RepositorioInventario } from '../dominio/contratos/repositorios.contrato';
import { ProcesadorPagos } from '../dominio/contratos/servicios-externos.contrato';

export interface SolicitudVenta {
  sedeId: string;
  cajeroId: string;
  lineas: ReadonlyArray<LineaVenta>;
  metodoPago: MetodoPago;
  claveIdempotencia: string;
  /** Insumos/productos a descontar por esta venta (resueltos desde el catálogo). */
  consumos: ReadonlyArray<{ itemInventarioId: string; cantidad: number }>;
}

export class RegistrarVentaCasoUso {
  constructor(
    private readonly ventas: RepositorioVentas,
    private readonly inventario: RepositorioInventario,
    private readonly pagos: ProcesadorPagos,
  ) {}

  async ejecutar(s: SolicitudVenta): Promise<Venta> {
    // IDEMPOTENCIA: el mismo reintento devuelve la venta ya registrada.
    const previa = await this.ventas.buscarPorClaveIdempotencia(s.claveIdempotencia);
    if (previa) return previa;

    // ATOMICIDAD: se valida TODO el stock antes de descontar algo.
    const aDescontar: { item: ItemInventario; cantidad: number }[] = [];
    for (const c of s.consumos) {
      const item = await this.inventario.obtener(s.sedeId, c.itemInventarioId);
      if (!item) throw new Error(`El ítem ${c.itemInventarioId} no existe en la sede`);
      if (!item.tieneStock(c.cantidad)) throw new Error(`Stock insuficiente de ${item.nombre}`);
      aDescontar.push({ item, cantidad: c.cantidad });
    }

    const total = s.lineas.reduce((t, l) => t + l.cantidad * l.precioUnitario, 0);
    let idTransaccion = 'EFECTIVO-' + s.claveIdempotencia;
    if (s.metodoPago !== 'efectivo') {
      const r = await this.pagos.cobrar(total, s.metodoPago, s.claveIdempotencia);
      if (!r.aprobado) throw new Error('El pago fue rechazado');
      idTransaccion = r.idTransaccion;
    }

    for (const { item, cantidad } of aDescontar) {
      item.descontar(cantidad);
      await this.inventario.guardar(item);
    }

    const venta = Venta.crear({
      id: 'VTA-' + s.claveIdempotencia,
      sedeId: s.sedeId,
      cajeroId: s.cajeroId,
      lineas: s.lineas,
      metodoPago: s.metodoPago,
      claveIdempotencia: s.claveIdempotencia,
      idTransaccion,
    });
    await this.ventas.guardar(venta);
    return venta;
  }
}
