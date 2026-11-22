'use client';
// Página de inicio: muestra el catálogo que viene de la API.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, type Servicio } from '@/lib/api';

export default function Inicio() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.servicios().then(setServicios).catch((e) => setError(e.message));
  }, []);

  return (
    <section>
      <h1 className="text-4xl font-bold text-marca">Reserva tu cita sin esperar respuesta por WhatsApp</h1>
      <p className="mt-3 text-lg text-gray-600">Elige el servicio, la estilista y un horario libre. Te lo guardamos 5 minutos mientras confirmas.</p>
      <Link href="/reservar" className="mt-6 inline-block rounded-lg bg-acento px-5 py-3 font-semibold text-white">Reservar ahora</Link>

      <h2 className="mt-12 text-2xl font-bold text-marca">Servicios</h2>
      {error && <p className="mt-3 text-red-600">No se pudo cargar el catálogo: {error}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {servicios.map((s) => (
          <div key={s.id} className="rounded-xl bg-suave p-5">
            <p className="text-sm font-semibold text-acento">{s.categoria}</p>
            <p className="text-xl font-bold">{s.nombre}</p>
            <p className="text-gray-600">{s.duracionMin} min · S/ {s.precio.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
