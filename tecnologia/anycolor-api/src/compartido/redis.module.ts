// =============================================================
// Conexión a Redis compartida (bloqueos de 5 min y caché) + proveedor de caché.
// Si no se usa Redis (BLOQUEOS=memoria y CACHE distinto de redis), no se conecta.
// =============================================================
import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  CACHE,
  CacheDesactivada,
  CacheMemoria,
  CacheRedis,
  type Cache,
} from './cache';

export const REDIS = Symbol('Redis');

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis | null => {
        const usaRedis =
          config.get('BLOQUEOS') !== 'memoria' ||
          config.get('CACHE', 'redis') === 'redis';
        return usaRedis
          ? new Redis(config.getOrThrow<string>('REDIS_URL'))
          : null;
      },
    },
    {
      provide: CACHE,
      inject: [ConfigService, REDIS],
      useFactory: (config: ConfigService, redis: Redis | null): Cache => {
        const modo = config.get<string>('CACHE', 'redis');
        new Logger('Cache').log(`Caché del catálogo: ${modo}`);
        if (modo === 'desactivada') return new CacheDesactivada();
        if (modo === 'memoria' || !redis) return new CacheMemoria();
        return new CacheRedis(redis);
      },
    },
  ],
  exports: [REDIS, CACHE],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(
    @Optional() @Inject(REDIS) private readonly redis: Redis | null,
  ) {}

  async onApplicationShutdown() {
    await this.redis?.quit();
  }
}
