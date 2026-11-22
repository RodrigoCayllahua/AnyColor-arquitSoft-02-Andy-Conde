import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErroresDominioFilter } from './compartido/errores-dominio.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1'); // todas las rutas empiezan con /api/v1
  app.enableCors({
    origin: process.env.URL_FRONTEND ?? 'http://localhost:3000',
  }); // permite que el frontend llame a la API
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ErroresDominioFilter());
  app.enableShutdownHooks();

  const puerto = Number(process.env.PUERTO ?? 3001);
  await app.listen(puerto);
  console.log(`API AnyColor escuchando en http://localhost:${puerto}/api/v1`);
}
void bootstrap();
