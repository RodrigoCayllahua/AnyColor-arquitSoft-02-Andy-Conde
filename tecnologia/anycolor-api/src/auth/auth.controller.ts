import { Body, Controller, Get, HttpCode, Ip, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { limiteDe } from '../compartido/limite-peticiones';
import { LoginDto, RegistroDto } from './auth.dto';
import { AuthService } from './auth.service';
import { Publico, UsuarioActual, type UsuarioToken } from './autorizacion';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Iniciar sesión: devuelve el token JWT y los datos del usuario (máx. 20 intentos por minuto por IP; 5 fallos seguidos bloquean 15 min) */
  @Publico()
  @Throttle({ default: { limit: limiteDe('LIMITE_LOGIN', 20), ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.auth.login(dto, ip);
  }

  /** Registrar una cuenta de clienta (máx. 10 registros cada 10 minutos por IP) */
  @Publico()
  @Throttle({
    default: { limit: limiteDe('LIMITE_REGISTRO', 10), ttl: 600_000 },
  })
  @Post('registro')
  registro(@Body() dto: RegistroDto) {
    return this.auth.registrarCliente(dto);
  }

  /** Datos del usuario que inició sesión */
  @ApiBearerAuth()
  @Get('yo')
  yo(@UsuarioActual() usuario: UsuarioToken) {
    return usuario;
  }
}
