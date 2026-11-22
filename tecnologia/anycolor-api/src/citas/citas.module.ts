// =============================================================
// RAÍZ DE COMPOSICIÓN del módulo Citas
// Único lugar donde se eligen las implementaciones concretas (PostgreSQL, Redis o memoria).
// =============================================================
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import type { Pool } from 'pg';
import { POOL } from '../compartido/base-datos.module';
import { CACHE, type Cache } from '../compartido/cache';
import { REDIS } from '../compartido/redis.module';
import { BloquearHorarioCasoUso } from './aplicacion/bloquear-horario.caso-uso';
import { CambiarEstadoCitaCasoUso } from './aplicacion/cambiar-estado-cita.caso-uso';
import { ConfirmarCitaCasoUso } from './aplicacion/confirmar-cita.caso-uso';
import { ConsultarDisponibilidadCasoUso } from './aplicacion/consultar-disponibilidad.caso-uso';
import {
  NOTIFICADOR,
  REPOSITORIO_CATALOGO,
  REPOSITORIO_CITAS,
  SERVICIO_BLOQUEOS,
} from './citas.tokens';
import type {
  Notificador,
  RepositorioCatalogo,
  RepositorioCitas,
  ServicioBloqueos,
} from './dominio/contratos';
import { NotificadorConsola } from './infraestructura/notificador.consola';
import { RepositorioCatalogoEnCache } from './infraestructura/repositorio-catalogo.cache';
import { RepositorioCatalogoPostgres } from './infraestructura/repositorio-catalogo.postgres';
import { RepositorioCitasPostgres } from './infraestructura/repositorio-citas.postgres';
import { ServicioBloqueosMemoria } from './infraestructura/servicio-bloqueos.memoria';
import { ServicioBloqueosRedis } from './infraestructura/servicio-bloqueos.redis';
import { CitasController } from './presentacion/citas.controller';

@Module({
  controllers: [CitasController],
  providers: [
    // ---- Contratos del dominio → implementación elegida
    {
      provide: REPOSITORIO_CITAS,
      inject: [POOL],
      useFactory: (pool: Pool) => new RepositorioCitasPostgres(pool),
    },
    {
      provide: REPOSITORIO_CATALOGO,
      inject: [POOL, CACHE],
      // Decorator: el repositorio PostgreSQL envuelto con caché (Redis o memoria)
      useFactory: (pool: Pool, cache: Cache) =>
        new RepositorioCatalogoEnCache(
          new RepositorioCatalogoPostgres(pool),
          cache,
        ),
    },
    {
      provide: SERVICIO_BLOQUEOS,
      inject: [ConfigService, REDIS],
      useFactory: (
        config: ConfigService,
        redis: Redis | null,
      ): ServicioBloqueos => {
        if (config.get('BLOQUEOS') === 'memoria' || !redis) {
          new Logger('Citas').warn(
            'Bloqueos EN MEMORIA: solo para desarrollo con una instancia',
          );
          return new ServicioBloqueosMemoria();
        }
        return new ServicioBloqueosRedis(redis);
      },
    },
    { provide: NOTIFICADOR, useClass: NotificadorConsola },

    // ---- Casos de uso: reciben contratos, nunca clases concretas (inversión de dependencias)
    {
      provide: ConsultarDisponibilidadCasoUso,
      inject: [REPOSITORIO_CITAS, REPOSITORIO_CATALOGO, SERVICIO_BLOQUEOS],
      useFactory: (
        c: RepositorioCitas,
        cat: RepositorioCatalogo,
        b: ServicioBloqueos,
      ) => new ConsultarDisponibilidadCasoUso(c, cat, b),
    },
    {
      provide: BloquearHorarioCasoUso,
      inject: [REPOSITORIO_CITAS, REPOSITORIO_CATALOGO, SERVICIO_BLOQUEOS],
      useFactory: (
        c: RepositorioCitas,
        cat: RepositorioCatalogo,
        b: ServicioBloqueos,
      ) => new BloquearHorarioCasoUso(c, cat, b),
    },
    {
      provide: ConfirmarCitaCasoUso,
      inject: [
        REPOSITORIO_CITAS,
        REPOSITORIO_CATALOGO,
        SERVICIO_BLOQUEOS,
        NOTIFICADOR,
      ],
      useFactory: (
        c: RepositorioCitas,
        cat: RepositorioCatalogo,
        b: ServicioBloqueos,
        n: Notificador,
      ) => new ConfirmarCitaCasoUso(c, cat, b, n),
    },
    {
      provide: CambiarEstadoCitaCasoUso,
      inject: [REPOSITORIO_CITAS],
      useFactory: (c: RepositorioCitas) => new CambiarEstadoCitaCasoUso(c),
    },
  ],
})
export class CitasModule {}
