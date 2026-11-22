// =============================================================
// Filtro de último recurso (OWASP: manejo de errores).
// - Los errores HTTP conocidos (400, 401, 403, 404, 409, 429...) se devuelven tal cual.
// - Cualquier otro error se registra completo en el servidor, pero la clienta solo recibe
//   un mensaje genérico: nunca se muestran SQL, rutas de archivos ni el stack trace.
// =============================================================
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class ErroresGeneralesFilter implements ExceptionFilter {
  private readonly log = new Logger('Errores');

  catch(error: unknown, host: ArgumentsHost) {
    const respuesta = host.switchToHttp().getResponse<Response>();

    if (error instanceof HttpException) {
      const cuerpo = error.getResponse();
      respuesta
        .status(error.getStatus())
        .json(
          typeof cuerpo === 'string'
            ? { statusCode: error.getStatus(), message: cuerpo }
            : cuerpo,
        );
      return;
    }

    // Errores del body-parser (JSON mal formado o demasiado grande) traen su propio estado
    const conEstado = error as { status?: number; type?: string };
    if (conEstado.status === 400 || conEstado.status === 413) {
      respuesta.status(conEstado.status).json({
        statusCode: conEstado.status,
        message:
          conEstado.status === 413
            ? 'La petición es demasiado grande'
            : 'El cuerpo de la petición no es un JSON válido',
      });
      return;
    }

    this.log.error(error instanceof Error ? error.stack : String(error));
    respuesta.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Ocurrió un error inesperado. Intenta de nuevo en unos minutos.',
    });
  }
}
