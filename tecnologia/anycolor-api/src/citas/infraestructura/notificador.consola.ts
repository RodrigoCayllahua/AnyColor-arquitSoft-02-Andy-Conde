// =============================================================
// INFRAESTRUCTURA · Notificador simulado
// Escribe en la consola. En la etapa 2 se reemplaza por WhatsApp sin tocar los casos de uso.
// =============================================================
import { Logger } from '@nestjs/common';
import type { Notificador } from '../dominio/contratos';
import type { Cita } from '../dominio/modelos/cita.modelo';

export class NotificadorConsola implements Notificador {
  private readonly log = new Logger('Notificador');

  async citaConfirmada(cita: Cita): Promise<void> {
    this.log.log(
      `[WhatsApp simulado] Cita ${cita.id} confirmada para ${cita.rango.inicio.toISOString()}`,
    );
  }
}
