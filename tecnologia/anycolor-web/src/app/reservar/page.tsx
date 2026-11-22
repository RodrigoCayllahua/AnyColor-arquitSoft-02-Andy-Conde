'use client';
// Reserva en 4 pasos: servicio → estilista → horario (se bloquea 5 min) → confirmar.
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, fechaLarga, hora, hoyEnLima, type Estilista, type Servicio, type Turno } from '@/lib/api';
import { obtenerSesion } from '@/lib/sesion';

export default function Reservar() {
  const router = useRouter();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [estilistas, setEstilistas] = useState<Estilista[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [estilista, setEstilista] = useState<Estilista | null>(null);
  const [fecha, setFecha] = useState(hoyEnLima(1));
  const [bloqueo, setBloqueo] = useState<{ inicio: string; expiraEn: string } | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Solo una clienta con sesión puede reservar.
  useEffect(() => {
    const sesion = obtenerSesion();
    if (!sesion || sesion.usuario.rol !== 'CLIENTE') router.push('/ingresar');
    else api.servicios().then(setServicios);
  }, [router]);

  // Al elegir servicio, se cargan las estilistas que lo hacen.
  useEffect(() => {
    if (servicio) api.estilistas(servicio.id).then(setEstilistas);
  }, [servicio]);

  // Al tener servicio, estilista y fecha, se piden los horarios.
  const cargarTurnos = () => {
    if (servicio && estilista) api.disponibilidad(servicio.id, estilista.id, fecha).then((d) => setTurnos(d.turnos));
  };
  useEffect(cargarTurnos, [servicio, estilista, fecha]);

  // Cuenta regresiva del bloqueo de 5 minutos.
  useEffect(() => {
    if (!bloqueo) return;
    const reloj = setInterval(() => {
      const restante = Math.max(0, Math.round((new Date(bloqueo.expiraEn).getTime() - Date.now()) / 1000));
      setSegundos(restante);
      if (restante === 0) {
        setBloqueo(null);
        setError('Se acabaron los 5 minutos. Elige el horario otra vez.');
        cargarTurnos();
      }
    }, 1000);
    return () => clearInterval(reloj);
  }, [bloqueo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function elegirTurno(t: Turno) {
    if (!servicio || !estilista) return;
    setError('');
    try {
      setBloqueo(await api.bloquear(servicio.id, estilista.id, t.inicio));
    } catch (e) {
      setError((e as Error).message);     // por ejemplo: "Otra persona está reservando este horario" (409)
      cargarTurnos();
    }
  }

  async function confirmar() {
    if (!servicio || !estilista || !bloqueo) return;
    try {
      await api.confirmar(servicio.id, estilista.id, bloqueo.inicio);
      setMensaje(`¡Listo! Tu cita de ${servicio.nombre} con ${estilista.nombre} quedó confirmada para el ${fechaLarga(bloqueo.inicio)} a las ${hora(bloqueo.inicio)}`);
      setBloqueo(null);
    } catch (e) {
      setError((e as Error).message);
      setBloqueo(null);
      cargarTurnos();
    }
  }

  if (mensaje) {
    return (
      <section className="rounded-xl bg-green-50 p-6">
        <p className="text-xl font-semibold text-green-800">{mensaje}</p>
        <button className="mt-4 rounded-lg bg-marca px-4 py-2 text-white" onClick={() => router.push('/mis-citas')}>Ver mis citas</button>
      </section>
    );
  }

  const boton = (activo: boolean) => `rounded-lg border px-4 py-3 text-left ${activo ? 'border-acento bg-pink-50' : 'border-gray-200 hover:bg-suave'}`;
  return (
    <section className="space-y-8">
      <h1 className="text-3xl font-bold text-marca">Reservar una cita</h1>

      <div>
        <h2 className="font-semibold">1. Servicio</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {servicios.map((s) => (
            <button key={s.id} className={boton(servicio?.id === s.id)} onClick={() => { setServicio(s); setEstilista(null); setTurnos([]); }}>
              <b>{s.nombre}</b> · {s.duracionMin} min · S/ {s.precio.toFixed(2)}
            </button>
          ))}
        </div>
      </div>

      {servicio && (
        <div>
          <h2 className="font-semibold">2. Estilista</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {estilistas.map((e) => (
              <button key={e.id} className={boton(estilista?.id === e.id)} onClick={() => setEstilista(e)}>
                <b>{e.nombre}</b> · {e.sede}
              </button>
            ))}
          </div>
        </div>
      )}

      {estilista && (
        <div>
          <h2 className="font-semibold">3. Fecha y hora</h2>
          <input type="date" className="mt-2 rounded-lg border px-3 py-2" value={fecha} min={hoyEnLima()} onChange={(e) => setFecha(e.target.value)} />
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {turnos.map((t) => (
              <button
                key={t.inicio}
                disabled={t.estado !== 'libre' || !!bloqueo}
                onClick={() => elegirTurno(t)}
                className={`rounded-lg py-2 text-sm font-semibold ${t.estado === 'libre' ? 'bg-marca text-white' : 'bg-gray-200 text-gray-500'} disabled:cursor-not-allowed`}
                aria-label={`${hora(t.inicio)} ${t.estado}`}
              >
                {hora(t.inicio)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">Gris = ocupado o en proceso por otra persona.</p>
        </div>
      )}

      {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}

      {bloqueo && (
        <div className="rounded-xl border-2 border-acento p-5">
          <h2 className="font-semibold">4. Confirmar</h2>
          <p className="mt-1">{servicio?.nombre} con {estilista?.nombre} · {fechaLarga(bloqueo.inicio)} a las {hora(bloqueo.inicio)}</p>
          <p className="mt-1 text-acento">Te guardamos este horario por {Math.floor(segundos / 60)}:{String(segundos % 60).padStart(2, '0')} minutos.</p>
          <button className="mt-3 rounded-lg bg-acento px-5 py-3 font-semibold text-white" onClick={confirmar}>Confirmar cita</button>
        </div>
      )}
    </section>
  );
}
