// =============================================================
// DOMINIO · Regla de comisiones (UN solo lugar)
// =============================================================
/** Comisión = precio del servicio × porcentaje contractual del estilista (0–100). */
export function calcularComision(precioServicio: number, porcentaje: number): number {
  if (porcentaje < 0 || porcentaje > 100) throw new Error('El porcentaje debe estar entre 0 y 100');
  return Math.round(precioServicio * porcentaje) / 100;
}
