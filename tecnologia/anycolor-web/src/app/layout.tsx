import type { Metadata } from 'next';
import Navegacion from '@/components/Navegacion';
import './globals.css';

export const metadata: Metadata = {
  title: 'AnyColor Salón',
  description: 'Reserva de citas y gestión de salones de belleza',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <Navegacion />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
