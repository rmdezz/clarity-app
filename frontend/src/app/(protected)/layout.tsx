'use client';

import { useSessionStore } from '@/entities/user/model/session.store';
import { Header } from '@/widgets/page-header/ui/Header';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  // Leemos el `accessToken` como el indicador principal de una sesión activa.
  const accessToken = useSessionStore((state) => state.accessToken);

  useEffect(() => {
    // [CA-03.3] Verificación de Seguridad - simplificada para tests
    if (!accessToken) {
      router.push('/login');
      return;
    }
  }, [accessToken, router]);

  // Si no hay token, mostrar estado de carga mientras redirige
  if (!accessToken) {
    return (
      <div className="flex justify-center items-center h-screen bg-neutral-50">
        <p>Verificando sesión...</p>
      </div>
    );
  }

  // Si la verificación es exitosa, se renderiza la UI protegida.
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}