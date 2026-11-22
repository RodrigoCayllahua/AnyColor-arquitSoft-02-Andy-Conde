// =============================================================
// EQ-01 (rendimiento) en hora punta: 300 clientas navegando a la vez
// durante 1 minuto. Meta: p95 ≤ 200 ms en catálogo y < 1 % de errores.
// Ejecutar: docker compose run --rm k6 run /scripts/hora-punta.js
// =============================================================
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE || 'http://balanceador/api/v1';
const CORTE = '44444444-1111-4111-8111-000000000001';
const CARLA = '33333333-1111-4111-8111-000000000004';

export const options = {
  stages: [
    { duration: '15s', target: 300 },
    { duration: '60s', target: 300 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration{tipo:catalogo}': ['p(95)<200'],
    'http_req_duration{tipo:disponibilidad}': ['p(95)<500'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'max'],
};

export default function () {
  const r1 = http.get(`${BASE}/catalogo/servicios`, { tags: { tipo: 'catalogo' } });
  const r2 = http.get(`${BASE}/catalogo/servicios/${CORTE}/estilistas`, { tags: { tipo: 'catalogo' } });
  const dia = new Date(Date.now() + (1 + Math.floor(Math.random() * 14)) * 86400000).toISOString().slice(0, 10);
  const r3 = http.get(`${BASE}/citas/disponibilidad?servicioId=${CORTE}&estilistaId=${CARLA}&fecha=${dia}`, {
    tags: { tipo: 'disponibilidad' },
  });
  check(r1, { 'catálogo 200': (r) => r.status === 200 });
  check(r2, { 'estilistas 200': (r) => r.status === 200 });
  check(r3, { 'disponibilidad 200': (r) => r.status === 200 });
  sleep(1);
}
