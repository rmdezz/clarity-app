'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { useSessionStore } from '@/entities/user/model/session.store';
import { registrationSchema, RegistrationFormValues } from './schemas';
import { registerUser } from './api';

export const useRegistration = () => {
  const router = useRouter();
  
  // 1. CORRECCIÓN: Obtener la acción `setTokens` del store en lugar de la obsoleta `setToken`.
  const setTokens = useSessionStore((state) => state.setTokens);
  
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    // Asegurarse de que los valores por defecto incluyan todos los campos del formulario
    defaultValues: { email: '', password: '', password2: '' }, 
    mode: 'onBlur',
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      // 2. CORRECCIÓN: Al tener éxito, llamar a `setTokens` con el objeto completo.
      //    Se asume que la API de registro ahora devuelve un objeto con `access` y `refresh`.
      //    El Criterio de Aceptación [CA-01.3] ahora implica recibir ambos tokens.
      setTokens({ access: data.access, refresh: data.refresh });
      
      // La redirección sigue siendo la misma.
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      form.setError('root.serverError', { type: 'manual', message: error.message });
    },
  });

  const onSubmit = (values: RegistrationFormValues) => {
    mutation.mutate(values);
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading: mutation.isPending,
    serverError: form.formState.errors.root?.serverError?.message,
  };
};