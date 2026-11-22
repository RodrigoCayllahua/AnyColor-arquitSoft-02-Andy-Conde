// =============================================================
// Protección contra fuerza bruta en el login (OWASP).
// Cuenta los intentos FALLIDOS por correo + IP. Tras 5 fallos, ese correo queda
// bloqueado 15 minutos desde esa IP (aunque luego escriba la clave correcta).
// Un login correcto borra el contador. Se guarda en Redis para que valga en todas las réplicas.
// =============================================================
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { REDIS } from '../compartido/redis.module';

@Injectable()
export class IntentosLogin {
  private readonly memoria = new Map<
    string,
    { fallos: number; hasta: number }
  >();

  constructor(
    private readonly config: ConfigService,
    @Optional() @Inject(REDIS) private readonly redis: Redis | null,
  ) {}

  private get maximo() {
    return Number(this.config.get('LOGIN_MAX_INTENTOS', 5));
  }

  private get bloqueoSeg() {
    return Number(this.config.get('LOGIN_BLOQUEO_MIN', 15)) * 60;
  }

  private clave(email: string, ip: string) {
    return `login:fallos:${email}:${ip}`;
  }

  /** Lanza 429 si ese correo ya superó los intentos permitidos desde esa IP. */
  async verificar(email: string, ip: string) {
    if ((await this.fallos(email, ip)) >= this.maximo) {
      throw new HttpException(
        `Demasiados intentos fallidos. Espera ${this.bloqueoSeg / 60} minutos.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async registrarFallo(email: string, ip: string) {
    const k = this.clave(email, ip);
    if (this.redis) {
      await this.redis.multi().incr(k).expire(k, this.bloqueoSeg).exec();
      return;
    }
    const actual = this.memoria.get(k);
    const vigente = actual && actual.hasta > Date.now();
    this.memoria.set(k, {
      fallos: vigente ? actual.fallos + 1 : 1,
      hasta: Date.now() + this.bloqueoSeg * 1000,
    });
  }

  async limpiar(email: string, ip: string) {
    const k = this.clave(email, ip);
    if (this.redis) await this.redis.del(k);
    else this.memoria.delete(k);
  }

  private async fallos(email: string, ip: string): Promise<number> {
    const k = this.clave(email, ip);
    if (this.redis) return Number((await this.redis.get(k)) ?? 0);
    const actual = this.memoria.get(k);
    return actual && actual.hasta > Date.now() ? actual.fallos : 0;
  }
}
