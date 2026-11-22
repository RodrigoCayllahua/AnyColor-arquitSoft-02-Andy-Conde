// =============================================================
// PRUEBAS DE PUNTA A PUNTA · API real + PostgreSQL + Redis (los de docker compose).
// Requisito: `docker compose up -d` y `npm run db:iniciar`. Ejecutar: npm run test:e2e
// =============================================================
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ErroresDominioFilter } from '../src/compartido/errores-dominio.filter';

const CORTE = '44444444-1111-4111-8111-000000000001';
const CARLA = '33333333-1111-4111-8111-000000000004';
const CLAVE = 'AnyColor2026';
const dentroDe = (dias: number) =>
  new Date(Date.now() + dias * 86_400_000).toLocaleDateString('en-CA', {
    timeZone: 'America/Lima',
  });

describe('API AnyColor (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let pool: Pool;
  const fecha = dentroDe(7 + Math.floor(Math.random() * 300)); // fecha libre en cada ejecución

  const login = async (email: string) =>
    (await http.post('/api/v1/auth/login').send({ email, clave: CLAVE })).body
      .token as string;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new ErroresDominioFilter());
    await app.init();
    http = request(app.getHttpServer());
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  });

  afterAll(async () => {
    await pool.end();
    await app.close();
  });

  it('EQ-04 · seguridad: sin token 401, rol indebido 403, clave mala 401', async () => {
    await http.get('/api/v1/citas/mias').expect(401);
    const ana = await login('ana@correo.com');
    await http
      .get(`/api/v1/citas/agenda?fecha=${fecha}`)
      .set('Authorization', `Bearer ${ana}`)
      .expect(403);
    await http
      .post('/api/v1/auth/login')
      .send({ email: 'ana@correo.com', clave: 'incorrecta' })
      .expect(401);
  });

  it('valida los datos de entrada (400)', async () => {
    const ana = await login('ana@correo.com');
    await http
      .post('/api/v1/citas/bloqueos')
      .set('Authorization', `Bearer ${ana}`)
      .send({ servicioId: 'x' })
      .expect(400);
  });

  it('catálogo y disponibilidad responden con datos', async () => {
    const servicios = await http.get('/api/v1/catalogo/servicios').expect(200);
    expect(servicios.body).toHaveLength(4);
    const disp = await http
      .get(
        `/api/v1/citas/disponibilidad?servicioId=${CORTE}&estilistaId=${CARLA}&fecha=${fecha}`,
      )
      .expect(200);
    expect(disp.body.turnos.length).toBeGreaterThan(10);
  });

  it('EQ-05 · consistencia: 20 clientas piden el mismo horario a la vez → solo 1 lo obtiene', async () => {
    const tokens: string[] = [];
    for (let i = 0; i < 20; i++) {
      const r = await http.post('/api/v1/auth/registro').send({
        nombre: `Clienta Prueba ${i}`,
        email: `e2e-${Date.now()}-${i}@correo.com`,
        clave: CLAVE,
      });
      tokens.push(r.body.token);
    }
    const pedido = {
      servicioId: CORTE,
      estilistaId: CARLA,
      inicio: `${fecha}T10:00:00-05:00`,
    };
    const respuestas = await Promise.all(
      tokens.map((t) =>
        http
          .post('/api/v1/citas/bloqueos')
          .set('Authorization', `Bearer ${t}`)
          .send(pedido),
      ),
    );
    const ganadoras = respuestas.filter((r) => r.status === 201);
    expect(ganadoras).toHaveLength(1);
    expect(respuestas.filter((r) => r.status === 409)).toHaveLength(19);

    const indice = respuestas.findIndex((r) => r.status === 201);
    const confirmada = await http
      .post('/api/v1/citas')
      .set('Authorization', `Bearer ${tokens[indice]}`)
      .send(pedido)
      .expect(201);
    expect(confirmada.body.estado).toBe('confirmada');
    // la perdedora no puede confirmar
    await http
      .post('/api/v1/citas')
      .set('Authorization', `Bearer ${tokens[(indice + 1) % 20]}`)
      .send(pedido)
      .expect(409);
  });

  it('EQ-05 · guardia final: PostgreSQL rechaza una cita cruzada aunque no haya bloqueo (EXCLUDE)', async () => {
    const { rows } = await pool.query(
      `SELECT * FROM citas WHERE estilista_id = $1 AND estado <> 'cancelada' ORDER BY creado_en DESC LIMIT 1`,
      [CARLA],
    );
    const c = rows[0];
    await expect(
      pool.query(
        `INSERT INTO citas (id, sede_id, cliente_id, estilista_id, sillon_id, servicio_id, inicio, fin, estado)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'confirmada')`,
        [
          c.sede_id,
          c.cliente_id,
          c.estilista_id,
          c.sillon_id,
          c.servicio_id,
          new Date(c.inicio.getTime() + 15 * 60_000),
          new Date(c.fin.getTime() + 15 * 60_000),
        ],
      ),
    ).rejects.toMatchObject({ code: '23P01' });
  });

  it('el personal ve la agenda de su sede y cambia los estados', async () => {
    const admin = await login('admin.centro@anycolor.pe');
    const agenda = await http
      .get(`/api/v1/citas/agenda?fecha=${fecha}`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    expect(agenda.body.length).toBeGreaterThanOrEqual(1);
    const carla = await login('carla@anycolor.pe');
    const id = agenda.body[0].id as string;
    await http
      .patch(`/api/v1/citas/${id}/estado`)
      .set('Authorization', `Bearer ${carla}`)
      .send({ accion: 'finalizar' })
      .expect(400);
    const r = await http
      .patch(`/api/v1/citas/${id}/estado`)
      .set('Authorization', `Bearer ${carla}`)
      .send({ accion: 'iniciar' })
      .expect(200);
    expect(r.body.estado).toBe('en_atencion');
  });
});
