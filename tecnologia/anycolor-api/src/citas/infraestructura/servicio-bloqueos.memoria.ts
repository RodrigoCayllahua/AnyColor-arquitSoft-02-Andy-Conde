// =============================================================
// INFRAESTRUCTURA · Bloqueo en memoria (para desarrollo y pruebas, sin Redis)
// Mismo contrato que Redis: los casos de uso no notan la diferencia.
// Solo sirve con UNA instancia del backend; en producción se usa Redis.
// =============================================================
import type { ServicioBloqueos } from '../dominio/contratos';

export class ServicioBloqueosMemoria implements ServicioBloqueos {
  private readonly bloqueos = new Map<
    string,
    { titular: string; vence: number }
  >();

  constructor(private readonly ahora: () => number = Date.now) {}

  private vigente(clave: string) {
    const b = this.bloqueos.get(clave);
    if (b && b.vence <= this.ahora()) {
      this.bloqueos.delete(clave);
      return undefined;
    }
    return b;
  }

  async adquirir(
    clave: string,
    titular: string,
    ttlMs: number,
  ): Promise<boolean> {
    if (this.vigente(clave)) return false;
    this.bloqueos.set(clave, { titular, vence: this.ahora() + ttlMs });
    return true;
  }

  async titularDe(clave: string): Promise<string | null> {
    return this.vigente(clave)?.titular ?? null;
  }

  async liberar(clave: string, titular: string): Promise<void> {
    if (this.vigente(clave)?.titular === titular) this.bloqueos.delete(clave);
  }
}
