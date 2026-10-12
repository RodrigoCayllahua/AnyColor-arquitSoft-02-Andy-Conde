// =============================================================
// DOMINIO · Bloqueo temporal de horario (RF07)
// =============================================================
/** REGLA DE NEGOCIO: el bloqueo dura 5 minutos. */
export const DURACION_BLOQUEO_MS = 5 * 60 * 1000;

/** La clave identifica el recurso bloqueado: un estilista o un sillón en un rango. */
export function claveBloqueo(
  tipo: 'estilista' | 'sillon', recursoId: string, inicio: Date, fin: Date,
): string {
  return `bloqueo:${tipo}:${recursoId}:${inicio.toISOString()}:${fin.toISOString()}`;
}
