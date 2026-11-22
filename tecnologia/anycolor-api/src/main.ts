import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // Documentación OpenAPI/Swagger: http://localhost:3001/api/docs
  const config = new DocumentBuilder()
    .setTitle('API AnyColor Salón')
    .setDescription(
      'API REST de reservas concurrentes, catálogo y autenticación. Inicia sesión en /auth/login y pega el token en "Authorize".',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const puerto = Number(process.env.PUERTO ?? 3001);
  await app.listen(puerto);
  console.log(`API AnyColor escuchando en http://localhost:${puerto}/api/v1`);
}
void bootstrap();
