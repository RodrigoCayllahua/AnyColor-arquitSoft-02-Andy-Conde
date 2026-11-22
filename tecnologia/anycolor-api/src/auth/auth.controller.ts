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

  /** POST /api/v1/auth/login  { email, clave } → { token, usuario } */
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /** POST /api/v1/auth/registro  { nombre, email, clave, telefono } → crea una clienta */
  @Post('registro')
  registro(@Body() dto: RegistroDto) {
    return this.auth.registrarCliente(dto);
  }

  /** GET /api/v1/auth/yo → datos del usuario del token */
  @ApiBearerAuth()
  @Get('yo')
  @UseGuards(AutorizacionGuard)
  yo(@UsuarioActual() usuario: UsuarioToken) {
    return usuario;
  }
}
