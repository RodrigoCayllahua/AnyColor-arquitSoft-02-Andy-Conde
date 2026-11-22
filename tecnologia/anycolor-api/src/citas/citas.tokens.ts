// Tokens de inyección: identifican cada contrato del dominio dentro de NestJS.
// Viven fuera del dominio porque son un detalle del framework.
export const REPOSITORIO_CITAS = Symbol('RepositorioCitas');
export const REPOSITORIO_CATALOGO = Symbol('RepositorioCatalogo');
export const SERVICIO_BLOQUEOS = Symbol('ServicioBloqueos');
export const NOTIFICADOR = Symbol('Notificador');
