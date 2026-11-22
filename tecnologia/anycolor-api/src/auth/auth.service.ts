import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Pool } from 'pg';
import { POOL } from '../compartido/base-datos.module';
import type { LoginDto, RegistroDto } from './auth.dto';
import type { UsuarioToken } from './autorizacion';

@Injectable()
export class AuthService {
  constructor(
    @Inject(POOL) private readonly pool: Pool,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const { rows } = await this.pool.query(
      'SELECT id, nombre, email, hash_clave, rol, sede_id FROM usuarios WHERE email = $1',
      [dto.email.toLowerCase()],
    );
    const u = rows[0];
    // Mismo mensaje si no existe el correo o si la clave falla: no damos pistas a un atacante.
    if (!u || !(await bcrypt.compare(dto.clave, u.hash_clave))) {
      throw new UnauthorizedException('Correo o clave incorrectos');
    }
    return this.emitirToken({
      sub: u.id,
      nombre: u.nombre,
      rol: u.rol,
      sedeId: u.sede_id,
    });
  }

  async registrarCliente(dto: RegistroDto) {
    const hash = await bcrypt.hash(dto.clave, 10);
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO usuarios (nombre, email, hash_clave, rol, telefono)
         VALUES ($1, $2, $3, 'CLIENTE', $4) RETURNING id`,
        [dto.nombre, dto.email.toLowerCase(), hash, dto.telefono ?? null],
      );
      return this.emitirToken({
        sub: rows[0].id,
        nombre: dto.nombre,
        rol: 'CLIENTE',
        sedeId: null,
      });
    } catch (e) {
      if ((e as { code?: string }).code === '23505')
        throw new ConflictException('Ese correo ya está registrado');
      throw e;
    }
  }

  private async emitirToken(usuario: UsuarioToken) {
    return { token: await this.jwt.signAsync(usuario), usuario };
  }
}
