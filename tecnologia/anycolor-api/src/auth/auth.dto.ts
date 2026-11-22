// DTO = Data Transfer Object: forma y validación de lo que llega en el cuerpo (JSON) de la petición.
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El correo no es válido' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
  clave!: string;
}

export class RegistroDto extends LoginDto {
  @IsString()
  @MinLength(3, { message: 'Escribe tu nombre completo' })
  nombre!: string;

  @IsOptional()
  @IsString()
  telefono?: string;
}
