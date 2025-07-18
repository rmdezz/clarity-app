'use client';

import { useLogin } from '../model/useLogin';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { FormServerError } from '@/shared/ui/FormServerError';

export const LoginForm = () => {
  const { form, onSubmit, isLoading, serverError } = useLogin();

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormServerError message={serverError} />

      <Input
        id="email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        {...form.register('email')}
        error={form.formState.errors.email?.message}
        disabled={isLoading}
      />

      <Input
        id="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        {...form.register('password')}
        error={form.formState.errors.password?.message}
        disabled={isLoading}
      />
      
      <Button type="submit" isLoading={isLoading} className="mt-4">
        Iniciar Sesión
      </Button>
    </form>
  );
};