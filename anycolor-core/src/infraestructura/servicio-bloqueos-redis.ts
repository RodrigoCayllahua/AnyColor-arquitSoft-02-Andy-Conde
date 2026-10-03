// =============================================================
// INFRAESTRUCTURA · Adaptador Redis del bloqueo temporal (producción)
// Mismo contrato que el adaptador en memoria: los casos de uso no cambian.
// El cliente se inyecta (ioredis cumple con RedisMinimo); aquí no se importa.
// =============================================================
import { ServicioBloqueos } from '../dominio/contratos/servicios-externos.contrato';

export interface RedisMinimo {
  set(clave: string, valor: string, modo: 'PX', ms: number, nx: 'NX'): Promise<'OK' | null>;
  get(clave: string): Promise<string | null>;
  eval(script: string, numClaves: number, ...args: string[]): Promise<unknown>;
}

// Libera solo si el valor coincide con el titular (no borra el bloqueo de otra persona).
const SCRIPT_LIBERAR =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

export class ServicioBloqueosRedis implements ServicioBloqueos {
  constructor(private readonly redis: RedisMinimo) {}

  async adquirir(clave: string, titular: string, ttlMs: number): Promise<boolean> {
    return (await this.redis.set(clave, titular, 'PX', ttlMs, 'NX')) === 'OK';
  }
  async titularDe(clave: string): Promise<string | undefined> {
    return (await this.redis.get(clave)) ?? undefined;
  }
  async liberar(clave: string, titular: string): Promise<void> {
    await this.redis.eval(SCRIPT_LIBERAR, 1, clave, titular);
  }
}
