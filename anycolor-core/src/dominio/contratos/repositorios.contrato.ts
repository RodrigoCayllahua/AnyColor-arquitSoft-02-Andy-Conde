// =============================================================
// DOMINIO · Contratos (puertos) de persistencia.
// Viven en el dominio; la infraestructura los implementa.
// =============================================================
import { Cita } from '../modelos/cita.modelo';
import { RangoHorario } from '../modelos/rango-horario';
import { ItemInventario } from '../modelos/inventario.modelo';
import { Venta } from '../modelos/venta.modelo';
import { Servicio } from '../modelos/servicio.modelo';

export interface RepositorioCitas {
  guardar(cita: Cita): Promise<void>;
  obtener(id: string): Promise<Cita | undefined>;
  /** Citas activas del recurso que solapan el rango (guardia final anti-choque). */
  buscarSolapadas(
    recurso: { estilistaId?: string; sillonId?: string },
    rango: RangoHorario,
  ): Promise<Cita[]>;
}

export interface RepositorioInventario {
  obtener(sedeId: string, itemId: string): Promise<ItemInventario | undefined>;
  guardar(item: ItemInventario): Promise<void>;
}

export interface RepositorioVentas {
  buscarPorClaveIdempotencia(clave: string): Promise<Venta | undefined>;
  guardar(venta: Venta): Promise<void>;
}

export interface RepositorioServicios {
  obtener(id: string): Promise<Servicio | undefined>;
}
