// =============================================================
// EQ-01 (rendimiento) y EQ-03 (escalabilidad)
// Sube progresivamente hasta 2 000 usuarios virtuales que consultan el
// catálogo y los horarios libres, como en una campaña.
// Ejecutar: docker compose run --rm k6 run /scripts/rendimiento-catalogo.js
// =============================================================
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE || 'http://balanceador/api/v1';
const CORTE = '44444444-1111-4111-8111-000000000001';
const CARLA = '33333333-1111-4111-8111-000000000004';

export const options = {
  stages: [
    { duration: '30s', target: 200 },
    { duration: '30s', target: 500 },
    { duration: '30s', target: 1000 },
    { duration: '45s', target: 2000 },
    { duration: '45s', target: 2000 }, // meseta con 2 000 usuarios
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    'http_req_failed': ['rate<0.01'], // menos de 1 % de errores
    'http_req_duration{tipo:catalogo}': ['p(95)<200'], // EQ-01
    'http_req_duration{tipo:disponibilidad}': ['p(95)<3000'], // EQ-03 (bajo carga)
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'max'],
};

function fecha(dias) {
  const d = new Date(Date.now() + dias * 86400000);
  return d.toISOString().slice(0, 10);
}

export default function () {
  const servicios = http.get(`${BASE}/catalogo/servicios`, { tags: { tipo: 'catalogo' } });
  check(servicios, { 'catálogo 200': (r) => r.status === 200 });

  const estilistas = http.get(`${BASE}/catalogo/servicios/${CORTE}/estilistas`, { tags: { tipo: 'catalogo' } });
  check(estilistas, { 'estilistas 200': (r) => r.status === 200 });

  const dia = fecha(1 + Math.floor(Math.random() * 14));
  const disp = http.get(`${BASE}/citas/disponibilidad?servicioId=${CORTE}&estilistaId=${CARLA}&fecha=${dia}`, {
    tags: { tipo: 'disponibilidad' },
  });
  check(disp, { 'disponibilidad 200': (r) => r.status === 200 });

  sleep(1); // la persona mira la pantalla antes de la siguiente acción
}
