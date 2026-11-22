// =============================================================
// PRESENTACIÓN · Rutas HTTP del módulo Citas
// Traduce la petición (JSON) al caso de uso y devuelve la respuesta. No tiene reglas de negocio.
// =============================================================
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AutorizacionGuard,
  Roles,
  UsuarioActual,
  type UsuarioToken,
} from '../../auth/autorizacion';
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

@Controller('citas')
export class CitasController {
  constructor(
    private readonly disponibilidad: ConsultarDisponibilidadCasoUso,
    private readonly bloquear: BloquearHorarioCasoUso,
    private readonly confirmar: ConfirmarCitaCasoUso,
    private readonly cambiarEstado: CambiarEstadoCitaCasoUso,
    @Inject(REPOSITORIO_CITAS) private readonly citas: RepositorioCitas,
  ) {}

  /** GET /api/v1/citas/disponibilidad?servicioId=&estilistaId=&fecha=2026-11-10 (público) */
  @Get('disponibilidad')
  verDisponibilidad(@Query() q: DisponibilidadQuery) {
    return this.disponibilidad.ejecutar(q.servicioId, q.estilistaId, q.fecha);
  }

  /** POST /api/v1/citas/bloqueos → reserva el horario 5 minutos */
  @Post('bloqueos')
  @UseGuards(AutorizacionGuard)
  @Roles('CLIENTE')
  bloquearHorario(@Body() dto: ReservaDto, @UsuarioActual() u: UsuarioToken) {
    return this.bloquear.ejecutar({
      ...dto,
      clienteId: u.sub,
      inicio: new Date(dto.inicio),
    });
  }

  /** POST /api/v1/citas → confirma la cita (debe existir el bloqueo) */
  @Post()
  @UseGuards(AutorizacionGuard)
  @Roles('CLIENTE')
  confirmarCita(@Body() dto: ReservaDto, @UsuarioActual() u: UsuarioToken) {
    return this.confirmar.ejecutar({
      ...dto,
      clienteId: u.sub,
      inicio: new Date(dto.inicio),
    });
  }

  /** GET /api/v1/citas/mias → citas de la clienta que inició sesión */
  @Get('mias')
  @UseGuards(AutorizacionGuard)
  @Roles('CLIENTE')
  misCitas(@UsuarioActual() u: UsuarioToken) {
    return this.citas.listarDeCliente(u.sub);
  }

  /** GET /api/v1/citas/agenda?fecha=2026-11-10 → panel del personal */
  @Get('agenda')
  @UseGuards(AutorizacionGuard)
  @Roles('ESTILISTA', 'CAJERO', 'ADMIN_SEDE', 'SUPER_ADMIN')
  agenda(@Query() q: AgendaQuery, @UsuarioActual() u: UsuarioToken) {
    const desde = fechaHoraLocal(q.fecha, 0);
    const hasta = new Date(desde.getTime() + 24 * 3600_000);
    return this.citas.listarAgenda({
      desde,
      hasta,
      sedeId: u.rol === 'SUPER_ADMIN' ? undefined : (u.sedeId ?? undefined), // cada uno ve solo su sede
      estilistaId: u.rol === 'ESTILISTA' ? u.sub : undefined, // la estilista ve solo lo suyo
    });
  }

  /** PATCH /api/v1/citas/:id/estado  { accion: "iniciar" | "finalizar" | "cancelar" } */
  @Patch(':id/estado')
  @UseGuards(AutorizacionGuard)
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
