// DTO = Data Transfer Object: forma y validación de lo que llega en el cuerpo (JSON) de la petición.
// Todo dato que viene de afuera se valida aquí: tipo, longitud y caracteres permitidos.
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Quita espacios al inicio y al final; el correo además va en minúsculas. */
const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const correo = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
  @Transform(correo)
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(254)
  email!: string;

  // bcrypt solo usa los primeros 72 bytes: un límite evita trabajo inútil con textos gigantes
  @IsString()
  @IsNotEmpty({ message: 'Escribe tu clave' })
  @MaxLength(72)
  clave!: string;
}

export class RegistroDto {
  @Transform(recortar)
  @IsString()
  @MinLength(3, { message: 'Escribe tu nombre completo' })
  @MaxLength(80)
  // Solo letras, números, espacios y . ' - : bloquea etiquetas HTML y caracteres de control
  @Matches(/^[\p{L}\p{N} .'-]+$/u, {
    message: "El nombre solo puede tener letras, números, espacios y . ' -",
  })
  nombre!: string;

  @Transform(correo)
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La clave debe tener al menos 8 caracteres' })
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'La clave debe tener letras y números',
  })
  clave!: string;

  // Un campo vacío se trata como "no enviado"
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === ''
      ? undefined
      : recortar({ value }),
  )
  @IsOptional()
  @Matches(/^\+?[\d\s-]{6,20}$/, { message: 'El celular no es válido' })
  telefono?: string;
}
