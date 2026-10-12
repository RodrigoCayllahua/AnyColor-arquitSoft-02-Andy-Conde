// =============================================================
// PRUEBAS · Corren SIN Angular/Next/Nest, SIN base de datos y SIN Redis.
// Esa es la prueba de que el núcleo no depende de la tecnología.
// Ejecutar:  npm run pruebas
// =============================================================
import assert from 'node:assert/strict';
import { Cita } from '../dominio/modelos/cita.modelo';
import { RangoHorario } from '../dominio/modelos/rango-horario';
import { ItemInventario } from '../dominio/modelos/inventario.modelo';
import { TurnoCaja } from '../dominio/modelos/turno-caja.modelo';
import { calcularComision } from '../dominio/modelos/comision';
import { DURACION_BLOQUEO_MS } from '../dominio/modelos/bloqueo.modelo';
import { Servicio } from '../dominio/modelos/servicio.modelo';
import { BloquearHorarioCasoUso } from '../aplicacion/bloquear-horario.caso-uso';
import { ConfirmarCitaCasoUso } from '../aplicacion/confirmar-cita.caso-uso';
import { RegistrarVentaCasoUso } from '../aplicacion/registrar-venta.caso-uso';
import {
  RepositorioCitasMemoria, RepositorioInventarioMemoria,
  RepositorioVentasMemoria, RepositorioServiciosMemoria,
} from '../infraestructura/repositorios-memoria';
import { ServicioBloqueosMemoria } from '../infraestructura/servicio-bloqueos-memoria';
import { ProcesadorPagosSimulado, NotificadorConsola } from '../infraestructura/adaptadores-simulados';

let ok = 0;
async function prueba(nombre: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    ok++;
    console.log('  ✔', nombre);
  } catch (e) {
    console.error('  ✘', nombre, '\n    ', (e as Error).message);
    process.exitCode = 1;
  }
}

const corte: Servicio = {
  id: 'srv-corte', nombre: 'Corte', categoria: 'Cabello', duracionMin: 45, precioBase: 40,
  insumos: [], estilistasHabilitados: ['est-1', 'est-2'],
};
const inicio = new Date('2026-11-10T10:00:00Z');

function armar() {
  let t = 1_000_000;
  const reloj = { ahora: () => t };
  const citas = new RepositorioCitasMemoria();
  const bloqueos = new ServicioBloqueosMemoria(reloj);
  const notif = new NotificadorConsola();
  return {
    avanzar: (ms: number) => { t += ms; },
    citas, bloqueos, notif,
    bloquear: new BloquearHorarioCasoUso(citas, new RepositorioServiciosMemoria([corte]), bloqueos),
    confirmar: new ConfirmarCitaCasoUso(citas, bloqueos, notif),
  };
}
const solicitud = (clienteId: string, sillonId = 'sil-1', estilistaId = 'est-1') =>
  ({ clienteId, servicioId: 'srv-corte', estilistaId, sillonId, inicio });

(async () => {
  console.log('\nDominio');
  await prueba('RangoHorario detecta solapes y respeta bordes', () => {
    const a = RangoHorario.desdeDuracion(inicio, 60);
    assert.equal(a.solapaCon(RangoHorario.desdeDuracion(new Date(inicio.getTime() + 30 * 60000), 60)), true);
    assert.equal(a.solapaCon(RangoHorario.desdeDuracion(new Date(inicio.getTime() + 60 * 60000), 30)), false);
  });
  await prueba('Cita: solo permite transiciones válidas', () => {
    const c = Cita.crear({ id: 'c1', sedeId: 's', clienteId: 'u', estilistaId: 'e', sillonId: 'x', servicioId: 'v',
      rango: RangoHorario.desdeDuracion(inicio, 45) });
    assert.throws(() => c.finalizar(), /Transición inválida/);
    c.confirmar(); c.iniciarAtencion(); c.finalizar();
    assert.equal(c.estadoActual, 'finalizada');
    assert.throws(() => c.cancelar(), /Transición inválida/);
  });
  await prueba('Inventario: no permite stock negativo y avisa stock bajo', () => {
    const i = ItemInventario.crear('tinte', 'sede-1', 'Tinte', 3, 2);
    assert.throws(() => i.descontar(5), /Stock insuficiente/);
    i.descontar(1);
    assert.equal(i.estaBajo(), true);
  });
  await prueba('Comisión = precio × porcentaje', () => {
    assert.equal(calcularComision(200, 30), 60);
    assert.throws(() => calcularComision(100, 120), /entre 0 y 100/);
  });
  await prueba('Caja: arqueo y bloqueo tras el cierre', () => {
    const t = TurnoCaja.abrir('t1', 's', 'cj', 100);
    t.registrarIngreso(250);
    assert.deepEqual(t.cerrar(340), { esperado: 350, diferencia: -10 });
    assert.throws(() => t.registrarIngreso(10), /cerrado/);
  });

  console.log('\nMotor de citas (concurrencia)');
  await prueba('Dos clientas piden el mismo horario: solo una obtiene el bloqueo', async () => {
    const a = armar();
    const resultados = await Promise.allSettled([
      a.bloquear.ejecutar(solicitud('ana')),
      a.bloquear.ejecutar(solicitud('bea')),
    ]);
    assert.equal(resultados.filter((r) => r.status === 'fulfilled').length, 1);
  });
  await prueba('Si falla el sillón, se libera el estilista (todo o nada)', async () => {
    const a = armar();
    await a.bloquear.ejecutar(solicitud('ana', 'sil-1', 'est-1'));
    await assert.rejects(a.bloquear.ejecutar(solicitud('bea', 'sil-1', 'est-2')), /sillón/);
    await a.bloquear.ejecutar(solicitud('cami', 'sil-2', 'est-2')); // est-2 quedó libre
  });
  await prueba('El bloqueo expira a los 5 minutos y otra clienta puede tomarlo', async () => {
    const a = armar();
    await a.bloquear.ejecutar(solicitud('ana'));
    a.avanzar(DURACION_BLOQUEO_MS + 1);
    await a.bloquear.ejecutar(solicitud('bea'));
  });
  await prueba('Confirmar con bloqueo vencido se rechaza', async () => {
    const a = armar();
    const { rango } = await a.bloquear.ejecutar(solicitud('ana'));
    a.avanzar(DURACION_BLOQUEO_MS + 1);
    await assert.rejects(
      a.confirmar.ejecutar({ id: 'c1', sedeId: 's', clienteId: 'ana', estilistaId: 'est-1',
        sillonId: 'sil-1', servicioId: 'srv-corte', rango }),
      /expiró/,
    );
  });
  await prueba('Confirmar guarda la cita, libera el bloqueo y notifica', async () => {
    const a = armar();
    const { rango } = await a.bloquear.ejecutar(solicitud('ana'));
    const cita = await a.confirmar.ejecutar({ id: 'c1', sedeId: 's', clienteId: 'ana', estilistaId: 'est-1',
      sillonId: 'sil-1', servicioId: 'srv-corte', rango });
    assert.equal(cita.estadoActual, 'confirmada');
    assert.deepEqual(a.notif.enviados, ['ana:c1']);
    await assert.rejects(a.bloquear.ejecutar(solicitud('bea')), /ocupado/); // la BD manda
  });
  await prueba('Una cita cancelada libera el horario', async () => {
    const a = armar();
    const { rango } = await a.bloquear.ejecutar(solicitud('ana'));
    const cita = await a.confirmar.ejecutar({ id: 'c1', sedeId: 's', clienteId: 'ana', estilistaId: 'est-1',
      sillonId: 'sil-1', servicioId: 'srv-corte', rango });
    cita.cancelar();
    await a.bloquear.ejecutar(solicitud('bea'));
  });

  console.log('\nPOS e inventario');
  const lineas = [{ tipo: 'servicio' as const, referenciaId: 'srv-tinte', cantidad: 1, precioUnitario: 120 }];
  const nuevoPos = (stock: number, aprobar = true) => {
    const inventario = new RepositorioInventarioMemoria([ItemInventario.crear('tinte', 'sede-1', 'Tinte', stock, 2)]);
    const ventas = new RepositorioVentasMemoria();
    return { inventario, ventas,
      pos: new RegistrarVentaCasoUso(ventas, inventario, new ProcesadorPagosSimulado(aprobar)) };
  };
  const venta = (clave: string, cantidad = 1, metodoPago: 'efectivo' | 'tarjeta' = 'tarjeta') => ({
    sedeId: 'sede-1', cajeroId: 'cj', lineas, metodoPago, claveIdempotencia: clave,
    consumos: [{ itemInventarioId: 'tinte', cantidad }],
  });
  await prueba('La venta descuenta los insumos de la sede', async () => {
    const p = nuevoPos(5);
    await p.pos.ejecutar(venta('k1', 2));
    assert.equal((await p.inventario.obtener('sede-1', 'tinte'))!.stockActual, 3);
  });
  await prueba('Idempotencia: reintentar la misma venta no cobra ni descuenta dos veces', async () => {
    const p = nuevoPos(5);
    const v1 = await p.pos.ejecutar(venta('k1'));
    const v2 = await p.pos.ejecutar(venta('k1'));
    assert.equal(v1, v2);
    assert.equal(p.ventas.cantidad, 1);
    assert.equal((await p.inventario.obtener('sede-1', 'tinte'))!.stockActual, 4);
  });
  await prueba('Sin stock suficiente no se cobra ni se registra nada', async () => {
    const p = nuevoPos(1);
    await assert.rejects(p.pos.ejecutar(venta('k2', 3)), /Stock insuficiente/);
    assert.equal(p.ventas.cantidad, 0);
    assert.equal((await p.inventario.obtener('sede-1', 'tinte'))!.stockActual, 1);
  });
  await prueba('Pago rechazado: el inventario queda intacto', async () => {
    const p = nuevoPos(5, false);
    await assert.rejects(p.pos.ejecutar(venta('k3')), /rechazado/);
    assert.equal((await p.inventario.obtener('sede-1', 'tinte'))!.stockActual, 5);
  });
  await prueba('Aislamiento por sede: el stock de otra sede no se toca', async () => {
    const p = nuevoPos(5);
    await assert.rejects(p.pos.ejecutar({ ...venta('k4'), sedeId: 'sede-2' }), /no existe en la sede/);
  });

  console.log(`\n${ok} pruebas correctas${process.exitCode ? ' — HAY FALLOS' : ''}\n`);
})();
