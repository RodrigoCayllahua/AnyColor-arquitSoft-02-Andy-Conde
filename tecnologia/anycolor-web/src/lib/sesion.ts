// Guarda el token JWT en el navegador para no pedir la clave en cada pantalla.
import type { Usuario } from './api';

const CLAVE = 'anycolor.sesion';

export interface Sesion { token: string; usuario: Usuario }

export function guardarSesion(sesion: Sesion) {
  localStorage.setItem(CLAVE, JSON.stringify(sesion));
  window.dispatchEvent(new Event('sesion'));          // avisa a la barra de navegación
}

export function obtenerSesion(): Sesion | null {
  if (typeof window === 'undefined') return null;      // en el servidor no hay localStorage
  const texto = localStorage.getItem(CLAVE);
  return texto ? (JSON.parse(texto) as Sesion) : null;
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE);
  window.dispatchEvent(new Event('sesion'));
}

/** A dónde va cada rol después de ingresar. */
export const inicioSegunRol = (rol: string) => (rol === 'CLIENTE' ? '/reservar' : '/panel');
