'use client';
// Citas de la clienta: puede cancelar las que aún no se atienden.
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, fechaLarga, hora, type CitaVista } from '@/lib/api';
import { obtenerSesion } from '@/lib/sesion';

export default function MisCitas() {
  const router = useRouter();
  const [citas, setCitas] = useState<CitaVista[]>([]);
  const [error, setError] = useState('');

  const cargar = () => api.misCitas().then(setCitas).catch((e) => setError(e.message));

  useEffect(() => {
    if (obtenerSesion()?.usuario.rol !== 'CLIENTE') router.push('/ingresar');
    else cargar();
  }, [router]);

  async function cancelar(id: string) {
    try {
      await api.cambiarEstado(id, 'cancelar');
      cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section>
      <h1 className="text-3xl font-bold text-marca">Mis citas</h1>
      {error && <p className="mt-3 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {citas.length === 0 && <p className="mt-4 text-gray-600">Aún no tienes citas.</p>}
      <ul className="mt-4 space-y-3">
        {citas.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-xl bg-suave p-4">
            <div>
              <p className="font-semibold">{c.servicio} con {c.estilista}</p>
              <p className="text-sm text-gray-600">{fechaLarga(c.inicio)} · {hora(c.inicio)} · {c.sede}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white px-3 py-1 text-sm">{c.estado}</span>
              {['pendiente', 'confirmada'].includes(c.estado) && (
                <button className="text-sm text-red-600 underline" onClick={() => cancelar(c.id)}>Cancelar</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
