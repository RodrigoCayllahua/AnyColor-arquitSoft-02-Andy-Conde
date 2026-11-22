import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configurarApp } from './compartido/configurar-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configurarApp(app); // seguridad, validación, CORS, errores y Swagger
  app.enableShutdownHooks();

  const puerto = Number(process.env.PUERTO ?? 3001);
  await app.listen(puerto);
  // Mantener vivas las conexiones más tiempo que el balanceador (evita errores 502)
  const servidor = app.getHttpServer();
  servidor.keepAliveTimeout = 65_000;
  servidor.headersTimeout = 66_000;
  console.log(`API AnyColor escuchando en el puerto ${puerto}`);
}
void bootstrap();
