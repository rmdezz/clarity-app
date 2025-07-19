'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/entities/user/model/session.store';
import { isTokenExpiredError } from '@/shared/lib/http-client';
import toast from 'react-hot-toast';

export const useTokenExpiredHandler = (error: Error | null) => {
  const router = useRouter();
  const clearSession = useSessionStore((state) => state.clearSession);

  useEffect(() => {
    if (error && isTokenExpiredError(error)) {
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      clearSession();
      router.push('/login');
    }
  }, [error, clearSession, router]);
};