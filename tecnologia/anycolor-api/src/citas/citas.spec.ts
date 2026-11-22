// =============================================================
// PRUEBAS · Reglas del dominio y casos de uso, sin base de datos ni Redis.
// Ejecutar: npm test
// =============================================================
import { BloquearHorarioCasoUso } from './aplicacion/bloquear-horario.caso-uso';
import { ConfirmarCitaCasoUso } from './aplicacion/confirmar-cita.caso-uso';
import type {
  CitaVista,
  RepositorioCatalogo,
  RepositorioCitas,
} from './dominio/contratos';
import { HorarioOcupadoError, ReglaNegocioError } from './dominio/errores';
import { Cita } from './dominio/modelos/cita.modelo';
import { RangoHorario } from './dominio/modelos/rango-horario';
import { DURACION_BLOQUEO_MS } from './dominio/modelos/reglas-agenda';
import { ServicioBloqueosMemoria } from './infraestructura/servicio-bloqueos.memoria';

// ---- Dobles de prueba: implementan los contratos en memoria
class CitasEnMemoria implements RepositorioCitas {
  guardadas: Cita[] = [];
  async guardar(c: Cita) {
    if ((await this.buscarSolapadas(c, c.rango)).length)
      throw new HorarioOcupadoError('cruce');
    this.guardadas.push(c);
  }
  async actualizarEstado() {}
  async obtener(id: string) {
    return this.guardadas.find((c) => c.id === id) ?? null;
  }
  async buscarSolapadas(
    r: { estilistaId: string; sillonId: string },
    rango: RangoHorario,
  ) {
    return this.guardadas.filter(
      (c) =>
        c.estadoActual !== 'cancelada' &&
        (c.estilistaId === r.estilistaId || c.sillonId === r.sillonId) &&
        c.rango.solapaCon(rango),
    );
  }
  async listarAgenda(): Promise<CitaVista[]> {
    return [];
  }
  async listarDeCliente(): Promise<CitaVista[]> {
    return [];
  }
}

const catalogo: RepositorioCatalogo = {
  obtenerServicio: async () => ({
    id: 'srv',
    nombre: 'Corte',
    duracionMin: 45,
    precio: 35,
  }),
  obtenerEstilista: async () => ({
    id: 'est',
    nombre: 'Carla',
    sedeId: 'sede',
    sillonId: 'sil',
  }),
  estilistaHaceServicio: async () => true,
};
const notificador = { citaConfirmada: jest.fn(async () => undefined) };
const manana = new Date(Date.now() + 24 * 3600_000);
manana.setUTCMinutes(0, 0, 0);

function armar() {
  let t = Date.now();
  const citas = new CitasEnMemoria();
  const bloqueos = new ServicioBloqueosMemoria(() => t);
  return {
    citas,
    avanzar: (ms: number) => {
      t += ms;
    },
    bloquear: new BloquearHorarioCasoUso(citas, catalogo, bloqueos),
    confirmar: new ConfirmarCitaCasoUso(citas, catalogo, bloqueos, notificador),
  };
}
const pedido = (clienteId: string) => ({
  clienteId,
  servicioId: 'srv',
  estilistaId: 'est',
  inicio: manana,
});

describe('Dominio', () => {
  it('RangoHorario detecta solapes y respeta los bordes', () => {
    const a = RangoHorario.desdeDuracion(new Date('2026-11-10T10:00:00Z'), 60);
    expect(
      a.solapaCon(
        RangoHorario.desdeDuracion(new Date('2026-11-10T10:30:00Z'), 60),
      ),
    ).toBe(true);
    expect(
      a.solapaCon(
        RangoHorario.desdeDuracion(new Date('2026-11-10T11:00:00Z'), 60),
      ),
    ).toBe(false);
  });

  it('una cita solo permite transiciones válidas', () => {
    const c = Cita.crear({
      id: '1',
      sedeId: 's',
      clienteId: 'c',
      estilistaId: 'e',
      sillonId: 'x',
      servicioId: 'v',
      rango: RangoHorario.desdeDuracion(manana, 45),
    });
    expect(() => c.finalizar()).toThrow(ReglaNegocioError);
    c.confirmar();
    c.iniciarAtencion();
    c.finalizar();
    expect(c.estadoActual).toBe('finalizada');
  });
});

describe('Reserva concurrente', () => {
  it('dos clientas piden el mismo horario: solo una obtiene el bloqueo', async () => {
    const { bloquear } = armar();
    const resultados = await Promise.allSettled([
      bloquear.ejecutar(pedido('ana')),
      bloquear.ejecutar(pedido('bea')),
    ]);
    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });

  it('confirmar guarda la cita y notifica', async () => {
    const { bloquear, confirmar, citas } = armar();
    await bloquear.ejecutar(pedido('ana'));
    const r = await confirmar.ejecutar(pedido('ana'));
    expect(r.estado).toBe('confirmada');
    expect(citas.guardadas).toHaveLength(1);
    expect(notificador.citaConfirmada).toHaveBeenCalled();
  });

  it('si pasan los 5 minutos, el bloqueo vence y no se puede confirmar', async () => {
    const { bloquear, confirmar, avanzar } = armar();
    await bloquear.ejecutar(pedido('ana'));
    avanzar(DURACION_BLOQUEO_MS + 1);
    await expect(confirmar.ejecutar(pedido('ana'))).rejects.toThrow(
      HorarioOcupadoError,
    );
  });

  it('un horario ya confirmado no se puede volver a bloquear', async () => {
    const { bloquear, confirmar } = armar();
    await bloquear.ejecutar(pedido('ana'));
    await confirmar.ejecutar(pedido('ana'));
    await expect(bloquear.ejecutar(pedido('bea'))).rejects.toThrow(
      HorarioOcupadoError,
    );
  });
});
