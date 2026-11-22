// =============================================================
// INFRAESTRUCTURA · Patrón Decorator: agrega caché al repositorio del catálogo
// sin modificarlo. Los casos de uso siguen recibiendo un RepositorioCatalogo.
// =============================================================
import { leerConCache, type Cache } from '../../compartido/cache';
import type {
  Estilista,
  RepositorioCatalogo,
  Servicio,
} from '../dominio/contratos';

export const TTL_CATALOGO_SEG = 300; // 5 minutos

export class RepositorioCatalogoEnCache implements RepositorioCatalogo {
  constructor(
    private readonly interno: RepositorioCatalogo,
    private readonly cache: Cache,
    private readonly ttlSeg = TTL_CATALOGO_SEG,
  ) {}

  obtenerServicio(id: string): Promise<Servicio | null> {
    return leerConCache(
      this.cache,
      `catalogo:servicio:${id}`,
      this.ttlSeg,
      () => this.interno.obtenerServicio(id),
    );
  }

  obtenerEstilista(id: string): Promise<Estilista | null> {
    return leerConCache(
      this.cache,
      `catalogo:estilista:${id}`,
      this.ttlSeg,
      () => this.interno.obtenerEstilista(id),
    );
  }

  estilistaHaceServicio(
    estilistaId: string,
    servicioId: string,
  ): Promise<boolean> {
    return leerConCache(
      this.cache,
      `catalogo:habilitado:${estilistaId}:${servicioId}`,
      this.ttlSeg,
      () => this.interno.estilistaHaceServicio(estilistaId, servicioId),
    );
  }
}
