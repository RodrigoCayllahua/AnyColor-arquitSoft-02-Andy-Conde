// =============================================================
// INFRAESTRUCTURA · Bloqueos en memoria (equivale a SET NX PX de Redis)
// =============================================================
import { ServicioBloqueos, Reloj } from '../dominio/contratos/servicios-externos.contrato';

export class ServicioBloqueosMemoria implements ServicioBloqueos {
  private readonly datos = new Map<string, { titular: string; expira: number }>();

  constructor(private readonly reloj: Reloj) {}

  private vigente(clave: string): { titular: string; expira: number } | undefined {
    const b = this.datos.get(clave);
    if (b && b.expira <= this.reloj.ahora()) {
      this.datos.delete(clave);
      return undefined;
    }
    return b;
  }

  async adquirir(clave: string, titular: string, ttlMs: number): Promise<boolean> {
    if (this.vigente(clave)) return false;
    this.datos.set(clave, { titular, expira: this.reloj.ahora() + ttlMs });
    return true;
  }

  async titularDe(clave: string): Promise<string | undefined> {
    return this.vigente(clave)?.titular;
  }

  async liberar(clave: string, titular: string): Promise<void> {
    if (this.vigente(clave)?.titular === titular) this.datos.delete(clave);
  }
}
