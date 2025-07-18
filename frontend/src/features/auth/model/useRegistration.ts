'use client'; // Este hook se usará en un Componente Cliente

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { useSessionStore } from '@/entities/user/model/session.store';
import { registrationSchema, RegistrationFormValues } from './schemas';
import { registerUser } from './api'; // Importamos la función de API que acabamos de crear

export const useRegistration = () => {
  const router = useRouter();
  const setToken = useSessionStore((state) => state.setToken);
  
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur', // Para validar cuando el usuario deja el campo
  });

  const mutation = useMutation({
    mutationFn: registerUser, // Aquí conectamos la función de la API
    onSuccess: (data) => {
      // data aquí es lo que devuelve nuestra función registerUser en caso de éxito
      setToken(data.token);      // [CA-01.4] Almacenar el token
      router.push('/dashboard'); // [CA-01.4] Redirigir
    },
    onError: (error: Error) => {
      // error aquí es lo que lanzamos en la función de la API
      // [CA-01.4] Mostrar error del servidor en el formulario
      form.setError('root.serverError', { type: 'manual', message: error.message });
    },
  });

  const onSubmit = (values: RegistrationFormValues) => {
    mutation.mutate(values);
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    // Exportamos explícitamente el estado desde la mutación para que el componente de UI lo use
    isLoading: mutation.isPending,
    serverError: form.formState.errors.root?.serverError?.message,
  };
};