// =============================================================
// Traduce los errores del dominio a respuestas HTTP con JSON.
// Así el dominio no conoce HTTP y el frontend recibe mensajes claros.
// =============================================================
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  HorarioOcupadoError,
  NoEncontradoError,
  PermisoDenegadoError,
  ReglaNegocioError,
} from '../citas/dominio/errores';

@Catch(
  ReglaNegocioError,
  NoEncontradoError,
  HorarioOcupadoError,
  PermisoDenegadoError,
)
export class ErroresDominioFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const estado =
      error instanceof HorarioOcupadoError
        ? HttpStatus.CONFLICT // 409
        : error instanceof NoEncontradoError
          ? HttpStatus.NOT_FOUND // 404
          : error instanceof PermisoDenegadoError
            ? HttpStatus.FORBIDDEN // 403
            : HttpStatus.BAD_REQUEST; // 400
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(estado)
      .json({ statusCode: estado, message: error.message });
  }
}
