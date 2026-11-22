// =============================================================
// Sesión en el navegador.
// Se guarda solo el token JWT y datos NO sensibles (nombre, rol, sede): nunca la clave.
// Se usa sessionStorage: la sesión se borra al cerrar la pestaña o el navegador
// (más seguro en celulares o computadoras compartidas del salón).
// El token caduca solo: si ya venció, la sesión se descarta sin esperar al servidor.
// =============================================================
import type { Usuario } from './api';

const CLAVE = 'anycolor.sesion';

export interface Sesion { token: string; usuario: Usuario }

/** Lee la fecha de vencimiento (exp) del token. No valida la firma: eso lo hace el servidor. */
function venceEn(token: string): number {
  try {
    const carga = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(carga)) as { exp?: number };
    return typeof exp === 'number' ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}

export function guardarSesion(sesion: Sesion) {
  sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
  window.dispatchEvent(new Event('sesion'));          // avisa a la barra de navegación
}

export function obtenerSesion(): Sesion | null {
  if (typeof window === 'undefined') return null;      // en el servidor no hay sessionStorage
  const texto = sessionStorage.getItem(CLAVE);
  if (!texto) return null;
  try {
    const sesion = JSON.parse(texto) as Sesion;
    if (venceEn(sesion.token) <= Date.now()) {         // token vencido o dañado
      sessionStorage.removeItem(CLAVE);
      return null;
    }
    return sesion;
  } catch {
    sessionStorage.removeItem(CLAVE);
    return null;
  }
}

export function cerrarSesion() {
  sessionStorage.removeItem(CLAVE);
  localStorage.removeItem(CLAVE);                       // limpia sesiones de versiones anteriores
  window.dispatchEvent(new Event('sesion'));
}

/** A dónde va cada rol después de ingresar. */
export const inicioSegunRol = (rol: string) => (rol === 'CLIENTE' ? '/reservar' : '/panel');
