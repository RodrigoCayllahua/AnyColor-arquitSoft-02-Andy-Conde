import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AutorizacionGuard } from './autorizacion';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRETO'),
        signOptions: { expiresIn: config.get('JWT_DURACION', '8h') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AutorizacionGuard],
  exports: [AutorizacionGuard],
})
export class AuthModule {}
