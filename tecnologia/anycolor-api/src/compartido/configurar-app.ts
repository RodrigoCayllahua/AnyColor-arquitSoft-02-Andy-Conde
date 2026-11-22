// =============================================================
// Configuración de seguridad de la API (OWASP). La usan main.ts y las pruebas e2e,
// así las pruebas validan exactamente lo mismo que corre en producción.
// =============================================================
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ErroresDominioFilter } from './errores-dominio.filter';
import { ErroresGeneralesFilter } from './errores-generales.filter';

export function configurarApp(app: NestExpressApplication) {
  const config = app.get(ConfigService);

  // Detrás del balanceador Nginx, la IP real de la clienta llega en X-Forwarded-For.
  // Solo se confía en ese encabezado si hay un proxy delante (si no, cualquiera podría falsificarlo).
  app.set('trust proxy', config.get('CONFIAR_EN_PROXY') === 'si' ? 1 : false);

  // Cabeceras de seguridad HTTP (quita X-Powered-By, agrega nosniff, frameguard, HSTS, CSP, etc.)
  app.use(helmet());

  // Tamaño máximo del cuerpo JSON: evita que alguien sature el servidor con peticiones enormes
  app.useBodyParser('json', { limit: '10kb' });

  app.setGlobalPrefix('api/v1'); // todas las rutas empiezan con /api/v1

  // CORS estricto: solo la aplicación web conocida, solo los métodos y cabeceras que se usan
  app.enableCors({
    origin: config
      .get<string>('URL_FRONTEND', 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim()),
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false, // el token viaja en la cabecera Authorization, no en cookies
    maxAge: 600,
  });

  // Validación de todos los datos de entrada: rechaza campos desconocidos y tipos incorrectos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // El filtro general va primero para que el del dominio atienda sus propios errores
  app.useGlobalFilters(
    new ErroresGeneralesFilter(),
    new ErroresDominioFilter(),
  );

  // Swagger: activo en desarrollo; en producción solo si SWAGGER=activado
  const swagger =
    config.get('SWAGGER') === 'activado' ||
    (config.get('NODE_ENV') !== 'production' &&
      config.get('SWAGGER') !== 'desactivado');
  if (swagger) {
    const documento = new DocumentBuilder()
      .setTitle('API AnyColor Salón')
      .setDescription(
        'API REST de reservas concurrentes, catálogo y autenticación. Inicia sesión en /auth/login y pega el token en "Authorize".',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(app, documento),
    );
  }
}
