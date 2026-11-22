// =============================================================
// DOMINIO · Reglas de la agenda del salón
// Si el negocio cambia una regla, se cambia SOLO aquí.
// =============================================================

/** RF07: el horario elegido queda bloqueado 5 minutos mientras la clienta confirma. */
export const DURACION_BLOQUEO_MS = 5 * 60 * 1000;

/** Horario de atención y cada cuánto se ofrecen turnos. */
export const HORA_APERTURA = 9;
export const HORA_CIERRE = 19;
export const INTERVALO_TURNOS_MIN = 30;

/** Zona horaria de las sedes (Perú, UTC-5). */
export const ZONA_HORARIA = '-05:00';

/** La clave identifica el recurso bloqueado: un estilista o un sillón en un rango. */
export function claveBloqueo(
  tipo: 'estilista' | 'sillon',
  recursoId: string,
  inicio: Date,
  fin: Date,
): string {
  return `bloqueo:${tipo}:${recursoId}:${inicio.toISOString()}:${fin.toISOString()}`;
}

/** Convierte "2026-11-10" y 9 → la fecha y hora en Perú. */
export function fechaHoraLocal(fecha: string, hora: number, minuto = 0): Date {
  const hh = String(hora).padStart(2, '0');
  const mm = String(minuto).padStart(2, '0');
  return new Date(`${fecha}T${hh}:${mm}:00${ZONA_HORARIA}`);
}
