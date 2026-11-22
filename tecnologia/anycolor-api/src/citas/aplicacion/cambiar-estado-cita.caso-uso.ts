// =============================================================
// APLICACIÓN · Caso de uso: iniciar, finalizar o cancelar una cita (RF08)
// =============================================================
import type { RepositorioCitas } from '../dominio/contratos';
import { NoEncontradoError, PermisoDenegadoError } from '../dominio/errores';

export type AccionCita = 'iniciar' | 'finalizar' | 'cancelar';

export interface UsuarioQueActua {
  id: string;
  rol: string;
  sedeId: string | null;
}

export class CambiarEstadoCitaCasoUso {
  constructor(private readonly citas: RepositorioCitas) {}

  async ejecutar(citaId: string, accion: AccionCita, usuario: UsuarioQueActua) {
    const cita = await this.citas.obtener(citaId);
    if (!cita) throw new NoEncontradoError('La cita no existe');

    // Permisos: la clienta solo cancela sus citas; el personal solo toca citas de su sede.
    if (usuario.rol === 'CLIENTE') {
      if (cita.clienteId !== usuario.id || accion !== 'cancelar') {
        throw new PermisoDenegadoError(
          'Solo puedes cancelar tus propias citas',
        );
      }
    } else if (
      usuario.rol !== 'SUPER_ADMIN' &&
      cita.sedeId !== usuario.sedeId
    ) {
      throw new PermisoDenegadoError('La cita pertenece a otra sede');
    }

    if (accion === 'iniciar') cita.iniciarAtencion();
    if (accion === 'finalizar') cita.finalizar();
    if (accion === 'cancelar') cita.cancelar();

    await this.citas.actualizarEstado(cita);
    return { id: cita.id, estado: cita.estadoActual };
  }
}
