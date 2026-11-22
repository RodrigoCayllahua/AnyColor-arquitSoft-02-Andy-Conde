'use client';
// Panel (dashboard) del personal: agenda del día con indicadores y acciones.
// La API decide qué ve cada uno: la estilista sus citas, el admin y el cajero su sede, el superadmin todo.
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, hora, hoyEnLima, type CitaVista } from '@/lib/api';
import { obtenerSesion } from '@/lib/sesion';

const COLOR: Record<string, string> = {
  confirmada: 'bg-blue-100 text-blue-800',
  en_atencion: 'bg-amber-100 text-amber-800',
  finalizada: 'bg-green-100 text-green-800',
  cancelada: 'bg-gray-200 text-gray-600',
};

export default function Panel() {
  const router = useRouter();
  const [fecha, setFecha] = useState(hoyEnLima());
  const [citas, setCitas] = useState<CitaVista[]>([]);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    api.agenda(fecha).then(setCitas).catch((e) => setError(e.message));
  }, [fecha]);

  useEffect(() => {
    const sesion = obtenerSesion();
    if (!sesion || sesion.usuario.rol === 'CLIENTE') router.push('/ingresar');
    else cargar();
  }, [cargar, router]);

  async function accion(id: string, a: 'iniciar' | 'finalizar' | 'cancelar') {
    setError('');
    try {
      await api.cambiarEstado(id, a);
      cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const activas = citas.filter((c) => c.estado !== 'cancelada');
  const indicadores = [
    { titulo: 'Citas del día', valor: activas.length },
    { titulo: 'En atención', valor: citas.filter((c) => c.estado === 'en_atencion').length },
    { titulo: 'Finalizadas', valor: citas.filter((c) => c.estado === 'finalizada').length },
    { titulo: 'Ingreso estimado', valor: 'S/ ' + activas.reduce((t, c) => t + c.precio, 0).toFixed(2) },
  ];

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold text-marca">Agenda del día</h1>
        <input type="date" className="rounded-lg border px-3 py-2" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {indicadores.map((i) => (
          <div key={i.titulo} className="rounded-xl bg-suave p-4">
            <p className="text-sm text-gray-600">{i.titulo}</p>
            <p className="text-3xl font-bold text-marca">{i.valor}</p>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}

      <table className="mt-6 w-full text-left">
        <thead className="bg-marca text-white">
          <tr><th className="p-3">Hora</th><th>Cliente</th><th>Servicio</th><th>Estilista</th><th>Estado</th><th>Acción</th></tr>
        </thead>
        <tbody>
          {citas.length === 0 && <tr><td className="p-3 text-gray-500" colSpan={6}>No hay citas para esta fecha.</td></tr>}
          {citas.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-3 font-semibold">{hora(c.inicio)}</td>
              <td>{c.cliente}</td>
              <td>{c.servicio}</td>
              <td>{c.estilista}</td>
              <td><span className={`rounded-full px-2 py-1 text-sm ${COLOR[c.estado] ?? ''}`}>{c.estado}</span></td>
              <td className="space-x-2 text-sm">
                {c.estado === 'confirmada' && <button className="text-blue-700 underline" onClick={() => accion(c.id, 'iniciar')}>Iniciar</button>}
                {c.estado === 'en_atencion' && <button className="text-green-700 underline" onClick={() => accion(c.id, 'finalizar')}>Finalizar</button>}
                {c.estado === 'confirmada' && <button className="text-red-600 underline" onClick={() => accion(c.id, 'cancelar')}>Cancelar</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
