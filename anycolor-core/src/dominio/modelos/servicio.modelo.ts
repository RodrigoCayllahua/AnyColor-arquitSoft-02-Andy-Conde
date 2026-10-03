// =============================================================
// DOMINIO · Entidad Servicio de belleza
// =============================================================
export interface InsumoRequerido {
  readonly itemInventarioId: string;
  readonly cantidad: number;
}

export interface Servicio {
  readonly id: string;
  readonly nombre: string;
  readonly categoria: string;
  readonly duracionMin: number;
  readonly precioBase: number;
  readonly insumos: ReadonlyArray<InsumoRequerido>;
  readonly estilistasHabilitados: ReadonlyArray<string>;
}
