// =============================================================
// DOMINIO · Errores del negocio
// La capa de presentación los traduce a códigos HTTP (400, 404, 409).
// =============================================================
export class ReglaNegocioError extends Error {}

export class NoEncontradoError extends Error {}

/** El horario ya está tomado o lo está reservando otra persona. */
export class HorarioOcupadoError extends Error {}

/** El usuario no tiene permiso para esta acción. */
export class PermisoDenegadoError extends Error {}
