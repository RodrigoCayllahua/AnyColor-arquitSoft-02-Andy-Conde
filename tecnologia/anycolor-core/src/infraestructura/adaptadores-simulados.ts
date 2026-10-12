// =============================================================
// INFRAESTRUCTURA · Pago y notificación simulados (sin credenciales ni internet)
// Reemplazables por Niubiz/Izipay/Yape y WhatsApp API cumpliendo el mismo contrato.
// =============================================================
import {
  ProcesadorPagos, ResultadoPago, Notificador,
} from '../dominio/contratos/servicios-externos.contrato';

export class ProcesadorPagosSimulado implements ProcesadorPagos {
  constructor(private readonly aprobar = true) {}
  async cobrar(_monto: number, _metodo: 'tarjeta' | 'yape_plin', referencia: string): Promise<ResultadoPago> {
    return { aprobado: this.aprobar, idTransaccion: 'SIM-' + referencia };
  }
}

export class NotificadorConsola implements Notificador {
  readonly enviados: string[] = [];
  async confirmarCita(clienteId: string, citaId: string): Promise<void> {
    this.enviados.push(`${clienteId}:${citaId}`);
  }
}
