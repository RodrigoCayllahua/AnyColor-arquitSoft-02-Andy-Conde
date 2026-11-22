// =============================================================
// EQ-05 (consistencia): N clientas intentan reservar EL MISMO horario
// en el mismo instante. Debe ganar exactamente una: 0 citas cruzadas.
// Ejecutar: docker compose run --rm k6 run /scripts/concurrencia-reservas.js
// =============================================================
import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const BASE = __ENV.BASE || 'http://balanceador/api/v1';
const CLIENTAS = Number(__ENV.CLIENTAS || 300);
const CORTE = '44444444-1111-4111-8111-000000000001';
const CARLA = '33333333-1111-4111-8111-000000000004';
const JSON_H = { headers: { 'Content-Type': 'application/json' } };

const bloqueosOk = new Counter('bloqueos_ganados');
const bloqueosRechazados = new Counter('bloqueos_rechazados_409');
const citasConfirmadas = new Counter('citas_confirmadas');

export const options = {
  setupTimeout: '180s',
  scenarios: {
    mismo_horario: { executor: 'per-vu-iterations', vus: CLIENTAS, iterations: 1, maxDuration: '60s' },
  },
  thresholds: {
    bloqueos_ganados: ['count==1'],
    citas_confirmadas: ['count==1'],
  },
};

export function setup() {
  // Fecha lejana y distinta en cada ejecución para empezar con el horario libre
  const dias = 30 + Math.floor(Math.random() * 300);
  const fecha = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
  const tokens = [];
  const sello = Date.now();
  for (let i = 0; i < CLIENTAS; i++) {
    const r = http.post(
      `${BASE}/auth/registro`,
      JSON.stringify({ nombre: `Clienta Carga ${i}`, email: `k6-${sello}-${i}@correo.com`, clave: 'AnyColor2026' }),
      JSON_H,
    );
    tokens.push(r.json('token'));
  }
  return { tokens, pedido: { servicioId: CORTE, estilistaId: CARLA, inicio: `${fecha}T10:00:00-05:00` }, fecha };
}

export default function (datos) {
  const token = datos.tokens[__VU - 1];
  const opciones = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
  const cuerpo = JSON.stringify(datos.pedido);

  const bloqueo = http.post(`${BASE}/citas/bloqueos`, cuerpo, opciones);
  check(bloqueo, { 'respuesta 201 o 409': (r) => r.status === 201 || r.status === 409 });
  if (bloqueo.status === 201) {
    bloqueosOk.add(1);
    const cita = http.post(`${BASE}/citas`, cuerpo, opciones);
    if (cita.status === 201) citasConfirmadas.add(1);
  } else if (bloqueo.status === 409) {
    bloqueosRechazados.add(1);
  }
}

export function teardown(datos) {
  // Verificación final en la base de datos a través de la agenda del administrador
  const login = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: 'admin.centro@anycolor.pe', clave: 'AnyColor2026' }),
    JSON_H,
  );
  const agenda = http.get(`${BASE}/citas/agenda?fecha=${datos.fecha}`, {
    headers: { Authorization: `Bearer ${login.json('token')}` },
  });
  const enEseHorario = agenda.json().filter((c) => c.estado !== 'cancelada').length;
  console.log(`Citas guardadas para Carla el ${datos.fecha} a las 10:00 → ${enEseHorario} (esperado: 1)`);
}
