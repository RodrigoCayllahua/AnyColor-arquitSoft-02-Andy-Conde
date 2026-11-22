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
import { IntentosLogin } from './intentos-login';

const COSTO_BCRYPT = 10;
// Hash de relleno: si el correo no existe igual se compara una clave, así el tiempo de
// respuesta es el mismo y un atacante no puede descubrir qué correos están registrados.
const HASH_FALSO = bcrypt.hashSync(
  'clave-inexistente-para-igualar-tiempos',
  COSTO_BCRYPT,
);

@Injectable()
export class AuthService {
  constructor(
    @Inject(POOL) private readonly pool: Pool,
    private readonly jwt: JwtService,
    private readonly intentos: IntentosLogin,
  ) {}

  async login(dto: LoginDto, ip: string) {
    await this.intentos.verificar(dto.email, ip);

    // Consulta parametrizada ($1): el correo nunca se pega dentro del SQL
    const { rows } = await this.pool.query(
      'SELECT id, nombre, hash_clave, rol, sede_id FROM usuarios WHERE email = $1',
      [dto.email],
    );
    const u = rows[0];
    const claveCorrecta = await bcrypt.compare(
      dto.clave,
      u?.hash_clave ?? HASH_FALSO,
    );
    // Mismo mensaje si no existe el correo o si la clave falla: no damos pistas a un atacante.
    if (!u || !claveCorrecta) {
      await this.intentos.registrarFallo(dto.email, ip);
      throw new UnauthorizedException('Correo o clave incorrectos');
    }
    await this.intentos.limpiar(dto.email, ip);
    return this.emitirToken({
      sub: u.id,
      nombre: u.nombre,
      rol: u.rol,
      sedeId: u.sede_id,
    });
  }

  async registrarCliente(dto: RegistroDto) {
    const hash = await bcrypt.hash(dto.clave, COSTO_BCRYPT);
    try {
      // El rol se fija en el servidor: nadie puede registrarse como administrador
      const { rows } = await this.pool.query(
        `INSERT INTO usuarios (nombre, email, hash_clave, rol, telefono)
         VALUES ($1, $2, $3, 'CLIENTE', $4) RETURNING id`,
        [dto.nombre, dto.email, hash, dto.telefono ?? null],
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

  // El token solo lleva lo necesario para autorizar: nunca la clave, el hash ni datos personales
  private async emitirToken(usuario: UsuarioToken) {
    return { token: await this.jwt.signAsync({ ...usuario }), usuario };
  }
}
