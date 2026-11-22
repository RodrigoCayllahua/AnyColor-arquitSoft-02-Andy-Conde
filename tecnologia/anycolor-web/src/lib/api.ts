// =============================================================
// Cliente de la API REST: el ÚNICO lugar del frontend que sabe dónde está el backend.
// Cada función hace una petición HTTP con JSON y devuelve los datos ya convertidos.
// =============================================================
import { cerrarSesion, obtenerSesion } from './sesion';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export type Rol = 'CLIENTE' | 'ESTILISTA' | 'CAJERO' | 'ADMIN_SEDE' | 'SUPER_ADMIN';
export interface Usuario { sub: string; nombre: string; rol: Rol; sedeId: string | null }
export interface Servicio { id: string; nombre: string; categoria: string; duracionMin: number; precio: number }
export interface Estilista { id: string; nombre: string; sede: string }
export interface Turno { inicio: string; fin: string; estado: 'libre' | 'ocupado' | 'en_proceso' | 'pasado' }
export interface CitaVista {
  id: string; inicio: string; fin: string; estado: string;
  servicio: string; precio: number; estilista: string; cliente: string; sede: string;
}

/** Error con el mensaje que envía el backend (por ejemplo "Otra persona está reservando este horario"). */
export class ErrorApi extends Error {
  constructor(public estado: number, mensaje: string) { super(mensaje); }
}

async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  const sesion = obtenerSesion();
  const respuesta = await fetch(API + ruta, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(sesion ? { Authorization: `Bearer ${sesion.token}` } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const datos = await respuesta.json().catch(() => null);
  // Token vencido o inválido: se cierra la sesión para que vuelva a ingresar
  if (respuesta.status === 401 && sesion) cerrarSesion();
  if (!respuesta.ok) {
    const mensaje = Array.isArray(datos?.message) ? datos.message.join('. ') : datos?.message;
    throw new ErrorApi(respuesta.status, mensaje ?? 'Error de conexión con el servidor');
  }
  return datos as T;
}

export const api = {
  // Autenticación
  login: (email: string, clave: string) =>
    pedir<{ token: string; usuario: Usuario }>('POST', '/auth/login', { email, clave }),
  registro: (nombre: string, email: string, clave: string, telefono: string) =>
    pedir<{ token: string; usuario: Usuario }>('POST', '/auth/registro', { nombre, email, clave, telefono }),

  // Catálogo
  servicios: () => pedir<Servicio[]>('GET', '/catalogo/servicios'),
  estilistas: (servicioId: string) => pedir<Estilista[]>('GET', `/catalogo/servicios/${encodeURIComponent(servicioId)}/estilistas`),

  // Citas
  disponibilidad: (servicioId: string, estilistaId: string, fecha: string) =>
    pedir<{ turnos: Turno[] }>('GET', `/citas/disponibilidad?${new URLSearchParams({ servicioId, estilistaId, fecha })}`),
  bloquear: (servicioId: string, estilistaId: string, inicio: string) =>
    pedir<{ inicio: string; fin: string; expiraEn: string }>('POST', '/citas/bloqueos', { servicioId, estilistaId, inicio }),
  confirmar: (servicioId: string, estilistaId: string, inicio: string) =>
    pedir<{ id: string; estado: string }>('POST', '/citas', { servicioId, estilistaId, inicio }),
  misCitas: () => pedir<CitaVista[]>('GET', '/citas/mias'),
  agenda: (fecha: string) => pedir<CitaVista[]>('GET', `/citas/agenda?${new URLSearchParams({ fecha })}`),
  cambiarEstado: (id: string, accion: 'iniciar' | 'finalizar' | 'cancelar') =>
    pedir<{ id: string; estado: string }>('PATCH', `/citas/${encodeURIComponent(id)}/estado`, { accion }),
};

/** Utilidades de formato para Perú */
export const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' });
export const fechaLarga = (iso: string) =>
  new Date(iso).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Lima' });
export const hoyEnLima = (diasMas = 0) =>
  new Date(Date.now() + diasMas * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
