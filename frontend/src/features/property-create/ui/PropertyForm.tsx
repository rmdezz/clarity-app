'use client';

import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
// No necesitamos useForm ni UseFormReturn aquí, solo el tipo de la prop 'form'
// import { useForm } from 'react-hook-form'; // ELIMINAR
import type { UseFormReturn } from 'react-hook-form';
import { PropertyFormValues } from '../model/schemas';
import { BaseSyntheticEvent } from 'react';

interface PropertyFormProps {
  // Aseguramos que 'form' es un objeto de UseFormReturn.
  // Su presencia es un contrato del componente.
  form: UseFormReturn<PropertyFormValues>; 
  onSubmit: (e?: BaseSyntheticEvent) => Promise<void>; 
  isLoading?: boolean;
  onCancel: () => void; 
}

export const PropertyForm = ({ form, onSubmit, isLoading, onCancel }: PropertyFormProps) => {
  // El componente asume que 'form' siempre estará presente y será válido.
  // La validación de que 'form' no es undefined recae en el componente que lo renderiza (el StoryWrapper).
  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <Input
        id="name"
        label="Nombre de la Propiedad"
        {...form.register('name')}
        error={form.formState.errors.name?.message}
        disabled={isLoading}
      />
      <Input
        id="address"
        label="Dirección"
        placeholder="Ej: Calle Falsa 123, Springfield"
        {...form.register('address')}
        error={form.formState.errors.address?.message}
        disabled={isLoading}
      />
      <div className="flex justify-end gap-4 mt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Guardar
        </Button>
      </div>
    </form>
  );
};