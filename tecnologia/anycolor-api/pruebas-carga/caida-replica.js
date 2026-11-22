// =============================================================
// EQ-02 (disponibilidad): se apaga una réplica de la API en plena carga
// y el balanceador debe seguir respondiendo sin errores para la clienta.
// Ejecutar (mientras corre, apagar una réplica):
//   docker compose run --rm k6 run /scripts/caida-replica.js
//   docker stop anycolor-api-api-2   (a los ~20 s)   y luego   docker start anycolor-api-api-2
// =============================================================
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE || 'http://balanceador/api/v1';
const CORTE = '44444444-1111-4111-8111-000000000001';
const CARLA = '33333333-1111-4111-8111-000000000004';

export const options = {
  vus: 200,
  duration: '70s',
  thresholds: { http_req_failed: ['rate<0.01'] },
  summaryTrendStats: ['avg', 'med', 'p(95)', 'max'],
};

export default function () {
  const dia = new Date(Date.now() + 86400000 * (1 + Math.floor(Math.random() * 14))).toISOString().slice(0, 10);
  const r1 = http.get(`${BASE}/catalogo/servicios`);
  const r2 = http.get(`${BASE}/citas/disponibilidad?servicioId=${CORTE}&estilistaId=${CARLA}&fecha=${dia}`);
  check(r1, { 'catálogo 200': (r) => r.status === 200 });
  check(r2, { 'disponibilidad 200': (r) => r.status === 200 });
  sleep(0.5);
}
