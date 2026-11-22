// =============================================================
// Caché de lecturas frecuentes (catálogo, servicios, estilistas).
// Estrategia cache-aside: se busca primero en la caché; si no está, se lee
// de PostgreSQL y se guarda con un tiempo de vida (TTL).
// =============================================================
import type Redis from 'ioredis';

export interface Cache {
  obtener<T>(clave: string): Promise<T | null>;
  guardar(clave: string, valor: unknown, ttlSeg: number): Promise<void>;
  /** Borra todas las claves que empiezan con el prefijo (invalidación). */
  borrarPrefijo(prefijo: string): Promise<void>;
}

export const CACHE = Symbol('Cache');

/** Producción: Redis, compartida por todas las copias de la API. */
export class CacheRedis implements Cache {
  constructor(private readonly redis: Redis) {}

  async obtener<T>(clave: string): Promise<T | null> {
    const texto = await this.redis.get(clave);
    return texto ? (JSON.parse(texto) as T) : null;
  }

  async guardar(clave: string, valor: unknown, ttlSeg: number): Promise<void> {
    await this.redis.set(clave, JSON.stringify(valor), 'EX', ttlSeg);
  }

  async borrarPrefijo(prefijo: string): Promise<void> {
    const claves = await this.redis.keys(`${prefijo}*`);
    if (claves.length) await this.redis.del(...claves);
  }
}

/** Desarrollo y pruebas: memoria del proceso. */
export class CacheMemoria implements Cache {
  private readonly datos = new Map<string, { valor: unknown; vence: number }>();

  constructor(private readonly ahora: () => number = Date.now) {}

  async obtener<T>(clave: string): Promise<T | null> {
    const d = this.datos.get(clave);
    if (!d || d.vence <= this.ahora()) {
      this.datos.delete(clave);
      return null;
    }
    return d.valor as T;
  }

  async guardar(clave: string, valor: unknown, ttlSeg: number): Promise<void> {
    this.datos.set(clave, { valor, vence: this.ahora() + ttlSeg * 1000 });
  }

  async borrarPrefijo(prefijo: string): Promise<void> {
    for (const clave of this.datos.keys()) {
      if (clave.startsWith(prefijo)) this.datos.delete(clave);
    }
  }
}

/** Sin caché: sirve para medir la diferencia en las pruebas de carga. */
export class CacheDesactivada implements Cache {
  async obtener<T>(): Promise<T | null> {
    return null;
  }
  async guardar(): Promise<void> {}
  async borrarPrefijo(): Promise<void> {}
}

/** Lee de la caché o, si no está, ejecuta la consulta y la guarda. */
export async function leerConCache<T>(
  cache: Cache,
  clave: string,
  ttlSeg: number,
  consultar: () => Promise<T>,
): Promise<T> {
  const enCache = await cache.obtener<T>(clave);
  if (enCache !== null) return enCache;
  const valor = await consultar();
  if (valor !== null && valor !== undefined)
    await cache.guardar(clave, valor, ttlSeg);
  return valor;
}
