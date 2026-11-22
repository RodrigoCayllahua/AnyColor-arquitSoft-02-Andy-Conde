// PRUEBAS · Estrategia de caché (cache-aside) y patrón Decorator del catálogo.
import { RepositorioCatalogoEnCache } from '../citas/infraestructura/repositorio-catalogo.cache';
import type { RepositorioCatalogo } from '../citas/dominio/contratos';
import { CacheDesactivada, CacheMemoria, leerConCache } from './cache';

describe('Caché', () => {
  it('cache-aside: la segunda lectura no consulta la base de datos', async () => {
    const cache = new CacheMemoria();
    const consulta = jest.fn(async () => ['corte', 'tinte']);
    await leerConCache(cache, 'catalogo:servicios', 300, consulta);
    const segunda = await leerConCache(
      cache,
      'catalogo:servicios',
      300,
      consulta,
    );
    expect(segunda).toEqual(['corte', 'tinte']);
    expect(consulta).toHaveBeenCalledTimes(1);
  });

  it('el dato vence al terminar su TTL', async () => {
    let t = 0;
    const cache = new CacheMemoria(() => t);
    await cache.guardar('clave', 'valor', 300);
    t = 299_000;
    expect(await cache.obtener('clave')).toBe('valor');
    t = 300_001;
    expect(await cache.obtener('clave')).toBeNull();
  });

  it('invalidación por prefijo borra solo las claves del catálogo', async () => {
    const cache = new CacheMemoria();
    await cache.guardar('catalogo:servicios', [1], 300);
    await cache.guardar('catalogo:sedes', [2], 300);
    await cache.guardar('otro:dato', 3, 300);
    await cache.borrarPrefijo('catalogo:');
    expect(await cache.obtener('catalogo:servicios')).toBeNull();
    expect(await cache.obtener('otro:dato')).toBe(3);
  });

  it('con la caché desactivada siempre se consulta la base de datos', async () => {
    const consulta = jest.fn(async () => 'dato');
    await leerConCache(new CacheDesactivada(), 'k', 300, consulta);
    await leerConCache(new CacheDesactivada(), 'k', 300, consulta);
    expect(consulta).toHaveBeenCalledTimes(2);
  });

  it('Decorator: el repositorio en caché llama una sola vez al repositorio real', async () => {
    const obtenerServicio = jest.fn(async (id: string) => ({
      id,
      nombre: 'Corte',
      duracionMin: 45,
      precio: 35,
    }));
    const obtenerEstilista = jest.fn(async (id: string) => ({
      id,
      nombre: 'Carla',
      sedeId: 's',
      sillonId: 'x',
    }));
    const estilistaHaceServicio = jest.fn(async () => false);
    const real: RepositorioCatalogo = {
      obtenerServicio,
      obtenerEstilista,
      estilistaHaceServicio,
    };
    const repo = new RepositorioCatalogoEnCache(real, new CacheMemoria());
    for (let i = 0; i < 5; i++) {
      await repo.obtenerServicio('srv');
      await repo.obtenerEstilista('est');
      expect(await repo.estilistaHaceServicio('est', 'srv')).toBe(false);
    }
    expect(obtenerServicio).toHaveBeenCalledTimes(1);
    expect(obtenerEstilista).toHaveBeenCalledTimes(1);
    expect(estilistaHaceServicio).toHaveBeenCalledTimes(1);
  });
});
