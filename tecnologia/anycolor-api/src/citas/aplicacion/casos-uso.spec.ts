// PRUEBAS · Disponibilidad, cambio de estado y permisos (sin base de datos ni Redis).
import type {
  CitaVista,
  RepositorioCatalogo,
  RepositorioCitas,
} from '../dominio/contratos';
import {
  NoEncontradoError,
  PermisoDenegadoError,
  ReglaNegocioError,
} from '../dominio/errores';
import { Cita } from '../dominio/modelos/cita.modelo';
import { RangoHorario } from '../dominio/modelos/rango-horario';
import { claveBloqueo, fechaHoraLocal } from '../dominio/modelos/reglas-agenda';
import { ServicioBloqueosMemoria } from '../infraestructura/servicio-bloqueos.memoria';
import { CambiarEstadoCitaCasoUso } from './cambiar-estado-cita.caso-uso';
import { ConsultarDisponibilidadCasoUso } from './consultar-disponibilidad.caso-uso';
import { prepararReserva } from './preparar-reserva';

const manana = new Date(Date.now() + 86_400_000).toLocaleDateString('en-CA', {
  timeZone: 'America/Lima',
});

function nuevaCita(
  id = 'c1',
  estado: Parameters<typeof Cita.reconstruir>[1] = 'confirmada',
) {
  return Cita.reconstruir(
    {
      id,
      sedeId: 'sede-A',
      clienteId: 'ana',
      estilistaId: 'est',
      sillonId: 'sil',
      servicioId: 'srv',
      rango: RangoHorario.desdeDuracion(fechaHoraLocal(manana, 10), 45),
    },
    estado,
  );
}

function repoCitas(citas: Cita[]): RepositorioCitas {
  return {
    guardar: async (c) => void citas.push(c),
    actualizarEstado: async () => undefined,
    obtener: async (id) => citas.find((c) => c.id === id) ?? null,
    buscarSolapadas: async (_r, rango) =>
      citas.filter(
        (c) => c.estadoActual !== 'cancelada' && c.rango.solapaCon(rango),
      ),
    listarAgenda: async (): Promise<CitaVista[]> => [],
    listarDeCliente: async (): Promise<CitaVista[]> => [],
  };
}

const catalogo: RepositorioCatalogo = {
  obtenerServicio: async (id) =>
    id === 'srv' ? { id, nombre: 'Corte', duracionMin: 45, precio: 35 } : null,
  obtenerEstilista: async (id) =>
    id === 'est'
      ? { id, nombre: 'Carla', sedeId: 'sede-A', sillonId: 'sil' }
      : null,
  estilistaHaceServicio: async (e, s) => e === 'est' && s === 'srv',
};

describe('Consultar disponibilidad', () => {
  it('marca cada turno como libre, ocupado o en proceso', async () => {
    const bloqueos = new ServicioBloqueosMemoria();
    const uc = new ConsultarDisponibilidadCasoUso(
      repoCitas([nuevaCita()]),
      catalogo,
      bloqueos,
    );
    const inicio14 = fechaHoraLocal(manana, 14);
    const r14 = RangoHorario.desdeDuracion(inicio14, 45);
    await bloqueos.adquirir(
      claveBloqueo('estilista', 'est', r14.inicio, r14.fin),
      'bea',
      300_000,
    );

    const { turnos } = await uc.ejecutar('srv', 'est', manana);
    const estado = (h: number, m = 0) =>
      turnos.find(
        (t) => t.inicio === fechaHoraLocal(manana, h, m).toISOString(),
      )?.estado;
    expect(turnos.length).toBe(19); // 9:00 a 18:00 cada 30 min (el servicio dura 45)
    expect(estado(10)).toBe('ocupado');
    expect(estado(9, 30)).toBe('ocupado'); // 9:30–10:15 se cruza con 10:00
    expect(estado(14)).toBe('en_proceso');
    expect(estado(16)).toBe('libre');
  });

  it('servicio o estilista inexistente → error 404', async () => {
    const uc = new ConsultarDisponibilidadCasoUso(
      repoCitas([]),
      catalogo,
      new ServicioBloqueosMemoria(),
    );
    await expect(uc.ejecutar('nada', 'est', manana)).rejects.toThrow(
      NoEncontradoError,
    );
  });
});

describe('Preparar reserva', () => {
  const base = {
    clienteId: 'ana',
    servicioId: 'srv',
    estilistaId: 'est',
    inicio: fechaHoraLocal(manana, 10),
  };
  it('rechaza un estilista no habilitado y un horario pasado', async () => {
    const otro = { ...catalogo, estilistaHaceServicio: async () => false };
    await expect(prepararReserva(otro, base)).rejects.toThrow(
      ReglaNegocioError,
    );
    await expect(
      prepararReserva(catalogo, {
        ...base,
        inicio: new Date(Date.now() - 60_000),
      }),
    ).rejects.toThrow('ya pasó');
  });
  it('calcula el rango con la duración real del servicio', async () => {
    const r = await prepararReserva(catalogo, base);
    expect(r.rango.fin.getTime() - r.rango.inicio.getTime()).toBe(45 * 60_000);
  });
});

describe('Cambiar estado de una cita', () => {
  const estilista = { id: 'est', rol: 'ESTILISTA', sedeId: 'sede-A' };

  it('el personal inicia y finaliza una cita de su sede', async () => {
    const uc = new CambiarEstadoCitaCasoUso(repoCitas([nuevaCita()]));
    expect((await uc.ejecutar('c1', 'iniciar', estilista)).estado).toBe(
      'en_atencion',
    );
    expect((await uc.ejecutar('c1', 'finalizar', estilista)).estado).toBe(
      'finalizada',
    );
  });

  it('la clienta solo puede cancelar sus propias citas', async () => {
    const uc = new CambiarEstadoCitaCasoUso(repoCitas([nuevaCita()]));
    await expect(
      uc.ejecutar('c1', 'cancelar', {
        id: 'bea',
        rol: 'CLIENTE',
        sedeId: null,
      }),
    ).rejects.toThrow(PermisoDenegadoError);
    await expect(
      uc.ejecutar('c1', 'iniciar', { id: 'ana', rol: 'CLIENTE', sedeId: null }),
    ).rejects.toThrow(PermisoDenegadoError);
    expect(
      (
        await uc.ejecutar('c1', 'cancelar', {
          id: 'ana',
          rol: 'CLIENTE',
          sedeId: null,
        })
      ).estado,
    ).toBe('cancelada');
  });

  it('el personal de otra sede no puede tocar la cita; el superadmin sí', async () => {
    const uc = new CambiarEstadoCitaCasoUso(repoCitas([nuevaCita()]));
    await expect(
      uc.ejecutar('c1', 'iniciar', {
        id: 'x',
        rol: 'ADMIN_SEDE',
        sedeId: 'sede-B',
      }),
    ).rejects.toThrow(PermisoDenegadoError);
    expect(
      (
        await uc.ejecutar('c1', 'cancelar', {
          id: 'r',
          rol: 'SUPER_ADMIN',
          sedeId: null,
        })
      ).estado,
    ).toBe('cancelada');
  });

  it('cita inexistente → 404', async () => {
    await expect(
      new CambiarEstadoCitaCasoUso(repoCitas([])).ejecutar(
        'nada',
        'iniciar',
        estilista,
      ),
    ).rejects.toThrow(NoEncontradoError);
  });
});
