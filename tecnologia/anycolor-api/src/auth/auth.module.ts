import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AutorizacionGuard } from './autorizacion';
import { IntentosLogin } from './intentos-login';

const EMISOR = 'anycolor-api';
const AUDIENCIA = 'anycolor-web';

/** Rechaza arrancar con una clave de firma débil o con la de ejemplo en producción. */
export function validarSecretoJwt(secreto: string, entorno?: string): string {
  if (secreto.length < 32) {
    throw new Error('JWT_SECRETO debe tener al menos 32 caracteres');
  }
  if (entorno === 'production' && secreto.startsWith('cambia-esta')) {
    throw new Error(
      'JWT_SECRETO sigue siendo el valor de ejemplo: genera uno propio para producción',
    );
  }
  return secreto;
}

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: validarSecretoJwt(
          config.getOrThrow<string>('JWT_SECRETO'),
          config.get('NODE_ENV'),
        ),
        // Algoritmo fijo: impide ataques que cambian el "alg" del token (por ejemplo "none")
        signOptions: {
          expiresIn: config.get('JWT_DURACION', '2h'),
          algorithm: 'HS256',
          issuer: EMISOR,
          audience: AUDIENCIA,
        },
        verifyOptions: {
          algorithms: ['HS256'],
          issuer: EMISOR,
          audience: AUDIENCIA,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AutorizacionGuard, IntentosLogin],
  exports: [AutorizacionGuard],
})
export class AuthModule {}
