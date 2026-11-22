import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoginDto, RegistroDto } from './auth.dto';
import { AuthService } from './auth.service';
import {
  AutorizacionGuard,
  UsuarioActual,
  type UsuarioToken,
} from './autorizacion';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Iniciar sesión: devuelve el token JWT y los datos del usuario */
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /** Registrar una cuenta de clienta */
  @Post('registro')
  registro(@Body() dto: RegistroDto) {
    return this.auth.registrarCliente(dto);
  }

  /** Datos del usuario que inició sesión */
  @ApiBearerAuth()
  @Get('yo')
  @UseGuards(AutorizacionGuard)
  yo(@UsuarioActual() usuario: UsuarioToken) {
    return usuario;
  }
}
