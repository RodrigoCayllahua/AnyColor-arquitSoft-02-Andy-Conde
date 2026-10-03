// =============================================================
// DOMINIO · Entidad ItemInventario (insumos y productos por sede)
// =============================================================
export class ItemInventario {
  private constructor(
    public readonly id: string,
    public readonly sedeId: string,
    public readonly nombre: string,
    private stock: number,
    public readonly puntoReorden: number,
  ) {}

  static crear(id: string, sedeId: string, nombre: string, stock: number, puntoReorden: number): ItemInventario {
    if (stock < 0) throw new Error('El stock inicial no puede ser negativo');
    return new ItemInventario(id, sedeId, nombre, stock, puntoReorden);
  }

  get stockActual(): number { return this.stock; }

  tieneStock(cantidad: number): boolean { return this.stock >= cantidad; }

  /** REGLA: nunca se permite stock negativo. */
  descontar(cantidad: number): void {
    if (cantidad <= 0) throw new Error('La cantidad a descontar debe ser positiva');
    if (!this.tieneStock(cantidad)) {
      throw new Error(`Stock insuficiente de ${this.nombre}: hay ${this.stock}, se requieren ${cantidad}`);
    }
    this.stock -= cantidad;
  }

  reponer(cantidad: number): void {
    if (cantidad <= 0) throw new Error('La cantidad a reponer debe ser positiva');
    this.stock += cantidad;
  }

  /** Alerta visual de stock bajo o agotado. */
  estaBajo(): boolean { return this.stock <= this.puntoReorden; }
}
