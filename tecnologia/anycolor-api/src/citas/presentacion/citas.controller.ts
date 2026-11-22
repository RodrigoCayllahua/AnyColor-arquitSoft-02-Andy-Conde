// =============================================================
// PRESENTACIÓN · Rutas HTTP del módulo Citas
// Traduce la petición (JSON) al caso de uso y devuelve la respuesta. No tiene reglas de negocio.
// =============================================================
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  Publico,
  Roles,
  UsuarioActual,
  type UsuarioToken,
} from '../../auth/autorizacion';
import { limiteDe } from '../../compartido/limite-peticiones';
import { BloquearHorarioCasoUso } from '../aplicacion/bloquear-horario.caso-uso';
import { CambiarEstadoCitaCasoUso } from '../aplicacion/cambiar-estado-cita.caso-uso';
import { ConfirmarCitaCasoUso } from '../aplicacion/confirmar-cita.caso-uso';
import { ConsultarDisponibilidadCasoUso } from '../aplicacion/consultar-disponibilidad.caso-uso';
import type { RepositorioCitas } from '../dominio/contratos';
import { fechaHoraLocal } from '../dominio/modelos/reglas-agenda';
import { REPOSITORIO_CITAS } from '../citas.tokens';
import {
  AgendaQuery,
  CambiarEstadoDto,
  DisponibilidadQuery,
  ReservaDto,
} from './citas.dto';

@ApiTags('Citas')
@ApiBearerAuth()
@Controller('citas')
export class CitasController {
  constructor(
    private readonly disponibilidad: ConsultarDisponibilidadCasoUso,
    private readonly bloquear: BloquearHorarioCasoUso,
    private readonly confirmar: ConfirmarCitaCasoUso,
    private readonly cambiarEstado: CambiarEstadoCitaCasoUso,
    @Inject(REPOSITORIO_CITAS) private readonly citas: RepositorioCitas,
  ) {}

  /** Turnos de un día: libre, ocupado, en_proceso o pasado */
  @Publico() // los horarios libres se ven antes de iniciar sesión (no muestran quién reservó)
  @Get('disponibilidad')
  verDisponibilidad(@Query() q: DisponibilidadQuery) {
    return this.disponibilidad.ejecutar(q.servicioId, q.estilistaId, q.fecha);
  }

  /** Bloquear un horario 5 minutos (409 si otra persona lo tiene) */
  @Post('bloqueos')
  @Roles('CLIENTE')
  // Evita que un bot bloquee todos los horarios del día: máx. 30 bloqueos por minuto por IP
  @Throttle({
    default: { limit: limiteDe('LIMITE_BLOQUEOS', 30), ttl: 60_000 },
  })
  bloquearHorario(@Body() dto: ReservaDto, @UsuarioActual() u: UsuarioToken) {
    return this.bloquear.ejecutar({
      ...dto,
      clienteId: u.sub,
      inicio: new Date(dto.inicio),
    });
  }

  /** Confirmar la cita (exige el bloqueo vigente; guardia final EXCLUDE) */
  @Post()
  @Roles('CLIENTE')
  confirmarCita(@Body() dto: ReservaDto, @UsuarioActual() u: UsuarioToken) {
    return this.confirmar.ejecutar({
      ...dto,
      clienteId: u.sub,
      inicio: new Date(dto.inicio),
    });
  }

  /** Citas de la clienta que inició sesión */
  @Get('mias')
  @Roles('CLIENTE')
  misCitas(@UsuarioActual() u: UsuarioToken) {
    return this.citas.listarDeCliente(u.sub);
  }

  /** Agenda del día para el panel del personal (filtrada por sede y rol) */
  @Get('agenda')
  @Roles('ESTILISTA', 'CAJERO', 'ADMIN_SEDE', 'SUPER_ADMIN')
  agenda(@Query() q: AgendaQuery, @UsuarioActual() u: UsuarioToken) {
    // Un trabajador sin sede asignada no puede ver agendas (si no, vería las de todas las sedes)
    if (u.rol !== 'SUPER_ADMIN' && !u.sedeId) {
      throw new ForbiddenException('Tu usuario no tiene una sede asignada');
    }
    const desde = fechaHoraLocal(q.fecha, 0);
    const hasta = new Date(desde.getTime() + 24 * 3600_000);
    return this.citas.listarAgenda({
      desde,
      hasta,
      sedeId: u.rol === 'SUPER_ADMIN' ? undefined : (u.sedeId ?? undefined), // cada uno ve solo su sede
      estilistaId: u.rol === 'ESTILISTA' ? u.sub : undefined, // la estilista ve solo lo suyo
    });
  }

  /** Iniciar, finalizar o cancelar una cita */
  @Patch(':id/estado')
  @Roles('CLIENTE', 'ESTILISTA', 'CAJERO', 'ADMIN_SEDE', 'SUPER_ADMIN') // permisos finos en el caso de uso
  cambiarEstadoCita(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoDto,
    @UsuarioActual() u: UsuarioToken,
  ) {
    return this.cambiarEstado.ejecutar(id, dto.accion, {
      id: u.sub,
      rol: u.rol,
      sedeId: u.sedeId,
    });
  }
}
