// =============================================================
// INFRAESTRUCTURA · Bloqueo temporal con Redis (patrón Adapter)
// SET clave valor NX PX ms  → guarda SOLO si no existe y lo borra solo al vencer.
// =============================================================
import type Redis from 'ioredis';
import type { ServicioBloqueos } from '../dominio/contratos';

// Borra el bloqueo solo si es del mismo titular (no borra el bloqueo de otra persona).
const SCRIPT_LIBERAR =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

export class ServicioBloqueosRedis implements ServicioBloqueos {
  constructor(private readonly redis: Redis) {}

  async adquirir(
    clave: string,
    titular: string,
    ttlMs: number,
  ): Promise<boolean> {
    return (await this.redis.set(clave, titular, 'PX', ttlMs, 'NX')) === 'OK';
  }

  async titularDe(clave: string): Promise<string | null> {
    return this.redis.get(clave);
  }

  /** MGET: una sola ida y vuelta a Redis para todas las claves (táctica de rendimiento). */
  async titulares(claves: string[]): Promise<(string | null)[]> {
    return claves.length ? this.redis.mget(...claves) : [];
  }

  async liberar(clave: string, titular: string): Promise<void> {
    await this.redis.eval(SCRIPT_LIBERAR, 1, clave, titular);
  }
}
