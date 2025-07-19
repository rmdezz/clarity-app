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
  const accessToken = useSessionStore((state) => state.accessToken);
  const hasHydrated = useSessionStore((state) => state._hasHydrated);

  useEffect(() => {
    // Solo verificar autenticación después de que el store se haya hidratado
    if (hasHydrated && !accessToken) {
      router.push('/login');
      return;
    }
  }, [accessToken, hasHydrated, router]);

  // Mostrar loading mientras el store se hidrata
  if (!hasHydrated) {
    return (
      <div className="flex justify-center items-center h-screen bg-neutral-50">
        <p>Cargando...</p>
      </div>
    );
  }

  // Si no hay token después de la hidratación, mostrar estado de verificación
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