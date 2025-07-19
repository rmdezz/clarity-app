'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { isTokenExpiredError } from '@/shared/lib/http-client';
import { useSessionStore } from '@/entities/user/model/session.store';
import toast from 'react-hot-toast';

// Global error handler for authentication errors
const handleGlobalAuthError = (error: Error) => {
  console.log('🔍 Global Error Handler: Called with error:', error);
  console.log('🔍 Global Error Handler: Error name:', error.name);
  console.log('🔍 Global Error Handler: Error message:', error.message);
  console.log('🔍 Global Error Handler: Error constructor:', error.constructor.name);
  console.log('🔍 Global Error Handler: instanceof TokenExpiredError:', error instanceof Error);
  console.log('🔍 Global Error Handler: isTokenExpiredError check:', isTokenExpiredError(error));
  
  if (isTokenExpiredError(error)) {
    console.log('✅ Global Error Handler: Handling TokenExpiredError');
    toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    useSessionStore.getState().clearSession();
    // Use window.location for navigation in global context to avoid hook rules
    window.location.href = '/login';
  } else {
    console.log('❌ Global Error Handler: Not a TokenExpiredError, skipping');
  }
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry if it's a token expiration error
          if (isTokenExpiredError(error)) {
            return false;
          }
          // Default retry logic for other errors
          return failureCount < 3;
        },
        onError: handleGlobalAuthError,
      },
      mutations: {
        retry: (failureCount, error) => {
          // Don't retry if it's a token expiration error
          if (isTokenExpiredError(error)) {
            return false;
          }
          // Default retry logic for other errors
          return failureCount < 3;
        },
        onError: handleGlobalAuthError,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}