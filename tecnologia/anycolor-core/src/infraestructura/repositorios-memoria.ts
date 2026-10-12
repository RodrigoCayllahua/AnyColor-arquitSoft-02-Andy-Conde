// =============================================================
// INFRAESTRUCTURA · Adaptadores en memoria (pruebas y demo)
// En producción se reemplazan por adaptadores PostgreSQL, sin tocar los casos de uso.
// =============================================================
import { Cita } from '../dominio/modelos/cita.modelo';
import { RangoHorario } from '../dominio/modelos/rango-horario';
import { ItemInventario } from '../dominio/modelos/inventario.modelo';
import { Venta } from '../dominio/modelos/venta.modelo';
import { Servicio } from '../dominio/modelos/servicio.modelo';
import {
  RepositorioCitas, RepositorioInventario, RepositorioVentas, RepositorioServicios,
} from '../dominio/contratos/repositorios.contrato';

export class RepositorioCitasMemoria implements RepositorioCitas {
  private readonly datos = new Map<string, Cita>();

  async guardar(c: Cita): Promise<void> { this.datos.set(c.id, c); }
  async obtener(id: string): Promise<Cita | undefined> { return this.datos.get(id); }

  async buscarSolapadas(
    r: { estilistaId?: string; sillonId?: string },
    rango: RangoHorario,
  ): Promise<Cita[]> {
    return [...this.datos.values()].filter(
      (c) =>
        c.ocupaHorario() &&
        c.rango.solapaCon(rango) &&
        ((r.estilistaId !== undefined && c.estilistaId === r.estilistaId) ||
          (r.sillonId !== undefined && c.sillonId === r.sillonId)),
    );
  }
}

export class RepositorioInventarioMemoria implements RepositorioInventario {
  private readonly datos = new Map<string, ItemInventario>();

  constructor(items: ItemInventario[] = []) {
    items.forEach((i) => this.datos.set(this.clave(i.sedeId, i.id), i));
  }
  private clave(sede: string, id: string): string { return `${sede}:${id}`; }

  async obtener(sede: string, id: string): Promise<ItemInventario | undefined> {
    return this.datos.get(this.clave(sede, id));
  }
  async guardar(i: ItemInventario): Promise<void> { this.datos.set(this.clave(i.sedeId, i.id), i); }
}

export class RepositorioVentasMemoria implements RepositorioVentas {
  private readonly datos = new Map<string, Venta>();

  async buscarPorClaveIdempotencia(clave: string): Promise<Venta | undefined> { return this.datos.get(clave); }
  async guardar(v: Venta): Promise<void> { this.datos.set(v.claveIdempotencia, v); }
  get cantidad(): number { return this.datos.size; }
}

export class RepositorioServiciosMemoria implements RepositorioServicios {
  constructor(private readonly servicios: Servicio[]) {}
  async obtener(id: string): Promise<Servicio | undefined> {
    return this.servicios.find((s) => s.id === id);
  }
}
