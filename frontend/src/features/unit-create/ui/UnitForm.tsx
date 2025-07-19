'use client';

import type { UseFormReturn } from 'react-hook-form';
import { UnitFormValues } from '../model/schemas';
import { Input } from '@/shared/ui/Input';

interface UnitFormProps {
  form: UseFormReturn<UnitFormValues>;
  // No necesita botones aquí, ya que el Modal los gestionará
}

export const UnitForm = ({ form }: UnitFormProps) => {
  return (
    // Usamos un div en lugar de un form, ya que el <form> estará en el modal
    <div className="grid gap-4 py-4">
      <Input
        id="name"
        label="Nombre / Número de Unidad"
        placeholder="Ej: Apto 101"
        {...form.register('name')}
        error={form.formState.errors.name?.message}
      />
    </div>
  );
};