// =============================================================
// Rate limiting (límite de peticiones por IP) compartido entre las réplicas.
// Los contadores viven en Redis: así las 3 copias de la API cuentan juntas
// y un atacante no puede saltarse el límite repartiéndose entre réplicas.
// =============================================================
import type { ConfigService } from '@nestjs/config';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import type Redis from 'ioredis';

interface RegistroLimite {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

export class AlmacenLimitesRedis implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(
    clave: string,
    ttlMs: number,
    limite: number,
    bloqueoMs: number,
    nombre: string,
  ): Promise<RegistroLimite> {
    const contador = `limite:${nombre}:${clave}`;
    const bloqueo = `${contador}:bloqueado`;

    const restanteBloqueo = await this.redis.pttl(bloqueo);
    if (restanteBloqueo > 0) {
      return {
        totalHits: limite + 1,
        timeToExpire: Math.ceil(restanteBloqueo / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(restanteBloqueo / 1000),
      };
    }

    // INCR + expiración solo la primera vez (ventana fija), en una sola ida a Redis
    const resultado = await this.redis
      .multi()
      .incr(contador)
      .pexpire(contador, ttlMs, 'NX')
      .pttl(contador)
      .exec();
    const total = Number(resultado?.[0]?.[1] ?? 1);
    const restante = Math.max(Number(resultado?.[2]?.[1] ?? ttlMs), 0);

    if (total > limite && bloqueoMs > 0) {
      await this.redis.set(bloqueo, '1', 'PX', bloqueoMs);
      return {
        totalHits: total,
        timeToExpire: Math.ceil(restante / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(bloqueoMs / 1000),
      };
    }
    return {
      totalHits: total,
      timeToExpire: Math.ceil(restante / 1000),
      isBlocked: total > limite,
      timeToBlockExpire: total > limite ? Math.ceil(restante / 1000) : 0,
    };
  }
}

/** Lee un número del entorno en el momento de la petición (permite ajustar sin recompilar). */
export const limiteDe = (variable: string, porDefecto: number) => () =>
  Number(process.env[variable] ?? porDefecto);

export function opcionesLimite(
  config: ConfigService,
  redis: Redis | null,
): ThrottlerModuleOptions {
  return {
    throttlers: [
      {
        name: 'default',
        ttl: 60_000, // ventana de 1 minuto
        limit: limiteDe('LIMITE_GENERAL', 300), // 300 peticiones por minuto por IP
      },
    ],
    storage: redis ? new AlmacenLimitesRedis(redis) : undefined,
    // Solo para pruebas de carga: k6 envía miles de peticiones desde UNA sola IP
    skipIf: () => config.get('LIMITE_PETICIONES') === 'desactivado',
    errorMessage:
      'Demasiadas peticiones. Espera un momento y vuelve a intentarlo.',
  };
}
