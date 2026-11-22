import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CatalogoModule } from './catalogo/catalogo.module';
import { CitasModule } from './citas/citas.module';
import { BaseDatosModule } from './compartido/base-datos.module';
import { RedisModule } from './compartido/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // lee el archivo .env
    BaseDatosModule,
    RedisModule,
    AuthModule,
    CatalogoModule,
    CitasModule,
  ],
})
export class AppModule {}
