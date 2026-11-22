'use client';
// Barra superior: cambia según el rol del usuario que inició sesión.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cerrarSesion, obtenerSesion, type Sesion } from '@/lib/sesion';

export default function Navegacion() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const router = useRouter();

  useEffect(() => {
    const actualizar = () => setSesion(obtenerSesion());
    actualizar();
    window.addEventListener('sesion', actualizar);
    return () => window.removeEventListener('sesion', actualizar);
  }, []);

  const rol = sesion?.usuario.rol;
  return (
    <header className="bg-marca text-white">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
        <Link href="/" className="text-lg font-bold">AnyColor Salón</Link>
        {rol === 'CLIENTE' && <Link href="/reservar">Reservar</Link>}
        {rol === 'CLIENTE' && <Link href="/mis-citas">Mis citas</Link>}
        {rol && rol !== 'CLIENTE' && <Link href="/panel">Panel</Link>}
        <div className="ml-auto flex items-center gap-4 text-sm">
          {sesion ? (
            <>
              <span>{sesion.usuario.nombre} · {rol}</span>
              <button className="rounded bg-white/15 px-3 py-1" onClick={() => { cerrarSesion(); router.push('/'); }}>
                Salir
              </button>
            </>
          ) : (
            <Link href="/ingresar" className="rounded bg-acento px-3 py-1">Ingresar</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
