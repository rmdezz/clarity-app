'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { useSessionStore } from '@/entities/user/model/session.store';
import { loginSchema, LoginFormValues } from './schemas';
import { loginUser } from './api';

export const useLogin = () => {
  const router = useRouter();
  const setTokens = useSessionStore((state) => state.setTokens);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Note que este hook es casi idéntico a `useRegistration`.
  // Esto no es coincidencia; es el resultado de una arquitectura consistente.
  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setTokens({ access: data.access, refresh: data.refresh });      // [CA-02.3]
      router.push('/dashboard'); // [CA-02.3]
    },
    onError: (error: Error) => {
      form.setError('root.serverError', { type: 'manual', message: error.message });
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    mutation.mutate(values);
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading: mutation.isPending,
    serverError: form.formState.errors.root?.serverError?.message,
  };
};