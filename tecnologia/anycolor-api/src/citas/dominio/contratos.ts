// =============================================================
// DOMINIO · Contratos (puertos)
// El dominio dice QUÉ necesita; la infraestructura decide CÓMO (PostgreSQL, Redis…).
// =============================================================
import type { Cita, EstadoCita } from './modelos/cita.modelo';
import type { RangoHorario } from './modelos/rango-horario';

export interface Servicio {
  id: string;
  nombre: string;
  duracionMin: number;
  precio: number;
}

export interface Estilista {
  id: string;
  nombre: string;
  sedeId: string;
  sillonId: string;
}

/** Vista de lectura para pantallas (agenda, mis citas). */
export interface CitaVista {
  id: string;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  servicio: string;
  precio: number;
  estilista: string;
  cliente: string;
  sede: string;
}

export interface RepositorioCitas {
  guardar(cita: Cita): Promise<void>;
  actualizarEstado(cita: Cita): Promise<void>;
  obtener(id: string): Promise<Cita | null>;
  /** Citas activas (no canceladas) del estilista o del sillón que se cruzan con el rango. */
  buscarSolapadas(
    recurso: { estilistaId: string; sillonId: string },
    rango: RangoHorario,
  ): Promise<Cita[]>;
  listarAgenda(filtro: {
    desde: Date;
    hasta: Date;
    sedeId?: string;
    estilistaId?: string;
  }): Promise<CitaVista[]>;
  listarDeCliente(clienteId: string): Promise<CitaVista[]>;
}

export interface RepositorioCatalogo {
  obtenerServicio(id: string): Promise<Servicio | null>;
  obtenerEstilista(id: string): Promise<Estilista | null>;
  estilistaHaceServicio(
    estilistaId: string,
    servicioId: string,
  ): Promise<boolean>;
}

export interface ServicioBloqueos {
  /** true si se obtuvo el bloqueo; false si otra persona ya lo tiene vigente. */
  adquirir(clave: string, titular: string, ttlMs: number): Promise<boolean>;
  titularDe(clave: string): Promise<string | null>;
  /** Titulares de varias claves en una sola consulta (null si la clave está libre). */
  titulares(claves: string[]): Promise<(string | null)[]>;
  liberar(clave: string, titular: string): Promise<void>;
}

export interface Notificador {
  citaConfirmada(cita: Cita): Promise<void>;
}
