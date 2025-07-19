'use client';

import { Input } from '@/shared/ui/Input';
import type { UseFormReturn } from 'react-hook-form';

import { TenantFormValues } from '../model/schemas';

/* ────────────────────────────────────────────────────────────────────── */
/*  Tipado de la prop `form`                                             */
/*      ‣ Raw     : number_of_occupants puede ser `unknown`              */
/*      ‣ Context : any (no usamos)                                      */
/*      ‣ Output  : TenantFormValues (ya transformado)                   */
/* ────────────────────────────────────────────────────────────────────── */

interface TenantFormProps {
  form: UseFormReturn<
    { name: string; email: string; number_of_occupants: unknown },
    any,
    TenantFormValues
  >;
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Componente                                                           */
/* ────────────────────────────────────────────────────────────────────── */

export const TenantForm = ({ form }: TenantFormProps) => (
  <div className="grid gap-4 py-4">
    {/* Nombre */}
    <Input
      id="tenant-name"
      label="Nombre Completo del Inquilino"
      placeholder="Ej: Juan Pérez"
      {...form.register('name')}
      error={form.formState.errors.name?.message}
    />

    {/* Correo */}
    <Input
      id="tenant-email"
      label="Correo Electrónico"
      type="email"
      placeholder="Ej: juan.perez@dominio.com"
      {...form.register('email')}
      error={form.formState.errors.email?.message}
    />

    {/* Número de ocupantes */}
    <Input
      id="tenant-occupants"
      label="Número de Ocupantes"
      type="number"
      placeholder="Ej: 3"
      {...form.register('number_of_occupants', { valueAsNumber: true })}
      error={form.formState.errors.number_of_occupants?.message}
    />
  </div>
);
