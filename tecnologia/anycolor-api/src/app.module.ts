import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type Redis from 'ioredis';
import { AuthModule } from './auth/auth.module';
import { AutorizacionGuard } from './auth/autorizacion';
import { CatalogoModule } from './catalogo/catalogo.module';
import { CitasModule } from './citas/citas.module';
import { BaseDatosModule } from './compartido/base-datos.module';
import { opcionesLimite } from './compartido/limite-peticiones';
import { REDIS, RedisModule } from './compartido/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // lee el archivo .env
    BaseDatosModule,
    RedisModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService, REDIS],
      useFactory: (config: ConfigService, redis: Redis | null) =>
        opcionesLimite(config, redis),
    }),
    AuthModule,
    CatalogoModule,
    CitasModule,
  ],
  providers: [
    // 1.º límite de peticiones (frena bots y fuerza bruta antes de gastar en verificar tokens)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // 2.º autenticación y roles en TODAS las rutas; las públicas se marcan con @Publico()
    { provide: APP_GUARD, useClass: AutorizacionGuard },
  ],
})
export class AppModule {}
