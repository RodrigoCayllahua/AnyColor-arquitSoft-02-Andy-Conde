// =============================================================
// DOMINIO · Entidad TurnoCaja (apertura, arqueo y cierre)
// =============================================================
export class TurnoCaja {
  private abierto = true;
  private ingresos = 0;

  private constructor(
    public readonly id: string,
    public readonly sedeId: string,
    public readonly cajeroId: string,
    public readonly montoApertura: number,
  ) {}

  static abrir(id: string, sedeId: string, cajeroId: string, montoApertura: number): TurnoCaja {
    if (montoApertura < 0) throw new Error('El monto de apertura no puede ser negativo');
    return new TurnoCaja(id, sedeId, cajeroId, montoApertura);
  }

  get estaAbierto(): boolean { return this.abierto; }

  /** REGLA: no se registran ingresos en un turno cerrado. */
  registrarIngreso(monto: number): void {
    if (!this.abierto) throw new Error('El turno de caja está cerrado');
    if (monto <= 0) throw new Error('El ingreso debe ser positivo');
    this.ingresos += monto;
  }

  /** Arqueo: diferencia entre lo contado y lo esperado (negativo = faltante). */
  cerrar(montoContado: number): { esperado: number; diferencia: number } {
    if (!this.abierto) throw new Error('El turno ya fue cerrado');
    this.abierto = false;
    const esperado = this.montoApertura + this.ingresos;
    return { esperado, diferencia: montoContado - esperado };
  }
}
