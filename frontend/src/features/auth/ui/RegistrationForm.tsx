'use client'; // Necesario porque usamos hooks (useRegistration).

import { useRegistration } from '../model/useRegistration';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { FormServerError } from '@/shared/ui/FormServerError';

export const RegistrationForm = () => {
  // El componente pide al hook toda la lógica y el estado que necesita.
  // No sabe CÓMO se registra, solo sabe QUÉ estado tiene el proceso.
  const { form, onSubmit, isLoading, serverError } = useRegistration();

  return (
    // 'noValidate' previene las validaciones y popups por defecto del navegador.
    // Nosotros controlamos la validación con react-hook-form y Zod.
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      
      {/* 
        MOLÉCULA 3: Alerta de Error del Servidor.
        Se renderiza solo cuando el hook `useRegistration` reporta un `serverError`.
      */}
      <FormServerError message={serverError} />

      {/* 
        MOLÉCULA 1: Campo de Correo Electrónico.
        Conectado a react-hook-form a través de `{...form.register('email')}`.
        El error se pasa directamente desde el estado del formulario.
      */}
      <Input
        id="email" // Importante para que el <label> se asocie correctamente
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        {...form.register('email')}
        error={form.formState.errors.email?.message}
        disabled={isLoading}
      />

      {/* 
        MOLÉCULA 2: Campo de Contraseña.
      */}
      <Input
        id="password"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        {...form.register('password')}
        error={form.formState.errors.password?.message}
        disabled={isLoading}
      />

      <Input
        id="password2"
        label="Confirmar Contraseña"
        type="password"
        autoComplete="new-password"
        {...form.register('password2')}
        error={form.formState.errors.password2?.message}
        disabled={isLoading}
      />
      
      {/* 
        MOLÉCULA 4: Botón de Envío.
        El estado `isLoading` se pasa directamente a nuestro átomo `Button`,
        que sabe cómo mostrar un spinner y deshabilitarse.
      */}
      <Button type="submit" isLoading={isLoading} className="mt-4">
        Registrar Cuenta
      </Button>
    </form>
  );
};