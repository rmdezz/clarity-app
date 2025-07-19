'use client';

import { useSessionStore } from '@/entities/user/model/session.store';
import { useRouter } from 'next/navigation';
import { logoutUser } from './api';

export const useLogout = () => {
  const sessionStore = useSessionStore();
  const router = useRouter();

  const handleLogout = async () => {
    // 1. Leer ambos tokens del estado.
    const { accessToken, refreshToken } = sessionStore;

    // 2. Reacción inmediata de la UI.
    sessionStore.clearSession();
    router.push('/login');

    // 3. Ejecutar la invalidación segura en el backend.
    if (accessToken && refreshToken) {
      // Pasamos un objeto con ambos tokens, cumpliendo el nuevo contrato.
      await logoutUser({ accessToken, refreshToken });
    }
  };

  return { handleLogout };
};