// DTO: lo que el frontend envía en JSON y sus validaciones.
import {
  IsDateString,
  IsIn,
  IsISO8601,
  IsUUID,
  Matches,
} from 'class-validator';

export class ReservaDto {
  @IsUUID('4', { message: 'servicioId no es válido' })
  servicioId!: string;

  @IsUUID('4', { message: 'estilistaId no es válido' })
  estilistaId!: string;

  @IsDateString(
    { strict: true },
    {
      message:
        'inicio debe ser una fecha ISO, por ejemplo 2026-11-10T10:00:00-05:00',
    },
  )
  inicio!: string;
}

export class DisponibilidadQuery {
  @IsUUID('4')
  servicioId!: string;

  @IsUUID('4')
  estilistaId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fecha debe tener el formato AAAA-MM-DD',
  })
  @IsISO8601({ strict: true }, { message: 'fecha no es una fecha real' }) // rechaza 2026-13-45
  fecha!: string;
}

export class AgendaQuery {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fecha debe tener el formato AAAA-MM-DD',
  })
  @IsISO8601({ strict: true }, { message: 'fecha no es una fecha real' }) // rechaza 2026-13-45
  fecha!: string;
}

export class CambiarEstadoDto {
  @IsIn(['iniciar', 'finalizar', 'cancelar'])
  accion!: 'iniciar' | 'finalizar' | 'cancelar';
}
