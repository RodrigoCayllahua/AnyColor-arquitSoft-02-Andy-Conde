// =============================================================
// Seguridad: quién eres (JWT) y qué puedes hacer (roles). ADR-005
// =============================================================
import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

export type Rol =
  'CLIENTE' | 'ESTILISTA' | 'CAJERO' | 'ADMIN_SEDE' | 'SUPER_ADMIN';

/** Lo que viaja dentro del token JWT. */
export interface UsuarioToken {
  sub: string;
  nombre: string;
  rol: Rol;
  sedeId: string | null;
}

/** @Roles('CLIENTE') encima de un método: solo esos roles pueden usarlo. */
export const Roles = (...roles: Rol[]) => SetMetadata('roles', roles);

/** @UsuarioActual() en un parámetro: entrega el usuario del token. */
export const UsuarioActual = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UsuarioToken =>
    ctx.switchToHttp().getRequest().usuario,
);

@Injectable()
export class AutorizacionGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token)
      throw new UnauthorizedException('Falta el token. Inicia sesión.');

    try {
      req.usuario = await this.jwt.verifyAsync<UsuarioToken>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o vencido');
    }

    const roles = this.reflector.getAllAndOverride<Rol[] | undefined>('roles', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (roles && !roles.includes(req.usuario.rol)) {
      throw new ForbiddenException('Tu rol no tiene permiso para esta acción');
    }
    return true;
  }
}
