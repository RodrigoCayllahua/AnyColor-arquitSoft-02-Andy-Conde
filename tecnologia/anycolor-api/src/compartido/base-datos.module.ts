// =============================================================
// Conexión a PostgreSQL compartida por todos los módulos.
// Un "pool" mantiene varias conexiones abiertas y las reutiliza.
// =============================================================
import { Global, Module, OnApplicationShutdown, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const POOL = Symbol('PoolPostgres');

@Global()
@Module({
  providers: [
    {
      provide: POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Pool({
          connectionString: config.getOrThrow<string>('DATABASE_URL'),
          max: 20,
        }),
    },
  ],
  exports: [POOL],
})
export class BaseDatosModule implements OnApplicationShutdown {
  constructor(@Inject(POOL) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
