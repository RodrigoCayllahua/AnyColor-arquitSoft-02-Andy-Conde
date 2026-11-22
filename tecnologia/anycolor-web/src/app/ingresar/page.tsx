'use client';
// Iniciar sesión o crear una cuenta de clienta.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { guardarSesion, inicioSegunRol } from '@/lib/sesion';

export default function Ingresar() {
  const router = useRouter();
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [form, setForm] = useState({ nombre: '', email: '', clave: '', telefono: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const cambiar = (campo: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [campo]: e.target.value });

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const sesion = modo === 'login'
        ? await api.login(form.email, form.clave)
        : await api.registro(form.nombre, form.email, form.clave, form.telefono);
      guardarSesion(sesion);
      router.push(inicioSegunRol(sesion.usuario.rol));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }

  const campo = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2';
  return (
    <section className="mx-auto max-w-sm">
      <h1 className="text-3xl font-bold text-marca">{modo === 'login' ? 'Ingresar' : 'Crear cuenta'}</h1>
      <form onSubmit={enviar} className="mt-6 space-y-4">
        {modo === 'registro' && (
          <>
            <label className="block">Nombre completo<input className={campo} value={form.nombre} onChange={cambiar('nombre')} required /></label>
            <label className="block">Celular<input className={campo} value={form.telefono} onChange={cambiar('telefono')} /></label>
          </>
        )}
        <label className="block">Correo<input type="email" className={campo} value={form.email} onChange={cambiar('email')} required /></label>
        <label className="block">Clave<input type="password" className={campo} value={form.clave} onChange={cambiar('clave')} required /></label>
        {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
        <button disabled={cargando} className="w-full rounded-lg bg-marca py-3 font-semibold text-white disabled:opacity-60">
          {cargando ? 'Enviando…' : modo === 'login' ? 'Ingresar' : 'Crear cuenta'}
        </button>
      </form>
      <button className="mt-4 text-acento underline" onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}>
        {modo === 'login' ? '¿No tienes cuenta? Regístrate' : 'Ya tengo cuenta'}
      </button>
    </section>
  );
}
