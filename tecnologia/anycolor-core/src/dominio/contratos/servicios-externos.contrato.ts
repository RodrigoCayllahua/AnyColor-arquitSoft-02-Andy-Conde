// =============================================================
// DOMINIO · Contratos (puertos) de servicios externos y de soporte.
// Adaptadores: memoria/simulado (pruebas), Redis, Yape/Plin/Niubiz, WhatsApp...
// =============================================================

export interface ServicioBloqueos {
  /** true si se obtuvo el bloqueo; false si otro titular ya lo tiene vigente. */
  adquirir(clave: string, titular: string, ttlMs: number): Promise<boolean>;
  titularDe(clave: string): Promise<string | undefined>;
  liberar(clave: string, titular: string): Promise<void>;
}

export interface ResultadoPago {
  readonly aprobado: boolean;
  readonly idTransaccion: string;
}

export interface ProcesadorPagos {
  cobrar(monto: number, metodo: 'tarjeta' | 'yape_plin', referencia: string): Promise<ResultadoPago>;
}

export interface Notificador {
  confirmarCita(clienteId: string, citaId: string): Promise<void>;
}

export interface Reloj {
  ahora(): number;
}
