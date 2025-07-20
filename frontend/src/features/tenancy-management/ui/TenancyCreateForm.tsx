// frontend/src/features/tenancy-management/ui/TenancyCreateForm.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTenancy, useAvailableTenants } from '@/entities/tenancy/model/hooks';
import { TenancyCreateData } from '@/entities/tenancy/model/types';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const tenancyCreateSchema = z.object({
  // Hacer opcional el tenant para permitir crear uno nuevo
  tenant: z.number().optional(),
  // Campos para crear nuevo inquilino
  tenant_name: z.string().optional(),
  tenant_email: z.string().email('Email inválido').optional(),
  number_of_occupants: z.number()
    .min(1, 'Debe haber al menos 1 ocupante')
    .max(20, 'Máximo 20 ocupantes'),
  start_date: z.string()
    .min(1, 'La fecha de inicio es requerida')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'La fecha de inicio no puede ser anterior a hoy'),
  end_date: z.string().optional().or(z.literal('')),
}).refine((data) => {
  // Validar que se seleccione un inquilino existente O se proporcionen datos para crear uno nuevo
  if (!data.tenant && (!data.tenant_name || !data.tenant_email)) {
    return false;
  }
  return true;
}, {
  message: 'Debe seleccionar un inquilino existente o proporcionar nombre y email para crear uno nuevo',
  path: ['tenant']
}).refine((data) => {
  if (data.end_date && data.end_date !== '') {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    return endDate > startDate;
  }
  return true;
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['end_date']
});

type TenancyCreateFormData = z.infer<typeof tenancyCreateSchema>;

interface TenancyCreateFormProps {
  unitId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TenancyCreateForm({ unitId, onSuccess, onCancel }: TenancyCreateFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<TenancyCreateFormData>({
    resolver: zodResolver(tenancyCreateSchema),
    defaultValues: {
      number_of_occupants: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      tenant_name: '',
      tenant_email: '',
    },
  });

  const { data: availableTenants, isLoading: tenantsLoading } = useAvailableTenants(unitId);
  const createTenancyMutation = useCreateTenancy();

  const onSubmit = async (data: TenancyCreateFormData) => {
    setSubmitError(null);
    
    try {
      const submitData: any = {
        number_of_occupants: data.number_of_occupants,
        start_date: data.start_date,
        ...(data.end_date && data.end_date !== '' && { end_date: data.end_date }),
      };

      // Si hay un inquilino seleccionado, usar ese
      if (data.tenant) {
        submitData.tenant = data.tenant;
      } 
      // Si no hay inquilino seleccionado, enviar datos para crear uno nuevo
      else if (data.tenant_name && data.tenant_email) {
        submitData.tenant_name = data.tenant_name;
        submitData.tenant_email = data.tenant_email;
      }

      await createTenancyMutation.mutateAsync({
        unitId,
        data: submitData,
      });

      onSuccess();
    } catch (error: any) {
      if (error.response?.status === 409) {
        setSubmitError('Las fechas del arrendamiento se superponen con otro arrendamiento existente.');
      } else if (error.response?.status === 400) {
        setSubmitError('Datos inválidos. Verifique las fechas y ocupantes.');
      } else {
        setSubmitError('Error al crear el arrendamiento. Intente nuevamente.');
      }
    }
  };

  if (tenantsLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500">Cargando inquilinos disponibles...</div>
      </div>
    );
  }

  const hasAvailableTenants = availableTenants && availableTenants.length > 0;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {hasAvailableTenants ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Inquilino</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...form.register("tenant", { valueAsNumber: true })}
          >
            <option value="">Seleccionar inquilino</option>
            {availableTenants?.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.email})
              </option>
            ))}
          </select>
          {form.formState.errors.tenant && (
            <p className="text-sm text-red-600">{form.formState.errors.tenant.message}</p>
          )}
        </div>
      ) : (
        <>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-blue-900 mb-2">Crear Nuevo Inquilino</h4>
            <p className="text-sm text-blue-700">
              No hay inquilinos registrados. Complete los datos para crear un nuevo inquilino.
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre del Inquilino</label>
            <Input
              type="text"
              placeholder="Ej: Juan Pérez"
              {...form.register("tenant_name")}
            />
            {form.formState.errors.tenant_name && (
              <p className="text-sm text-red-600">{form.formState.errors.tenant_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email del Inquilino</label>
            <Input
              type="email"
              placeholder="Ej: juan@example.com"
              {...form.register("tenant_email")}
            />
            {form.formState.errors.tenant_email && (
              <p className="text-sm text-red-600">{form.formState.errors.tenant_email.message}</p>
            )}
          </div>
        </>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Número de Ocupantes</label>
        <Input
          type="number"
          min="1"
          max="20"
          {...form.register("number_of_occupants", { valueAsNumber: true })}
        />
        {form.formState.errors.number_of_occupants && (
          <p className="text-sm text-red-600">{form.formState.errors.number_of_occupants.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Fecha de Inicio</label>
        <Input type="date" {...form.register("start_date")} />
        {form.formState.errors.start_date && (
          <p className="text-sm text-red-600">{form.formState.errors.start_date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Fecha de Fin (Opcional)</label>
        <Input 
          type="date" 
          {...form.register("end_date")}
          placeholder="Dejar vacío para arrendamiento activo"
        />
        {form.formState.errors.end_date && (
          <p className="text-sm text-red-600">{form.formState.errors.end_date.message}</p>
        )}
        <p className="text-sm text-gray-500">
          Si no especifica fecha de fin, el arrendamiento será considerado activo.
        </p>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={createTenancyMutation.isPending}
        >
          {createTenancyMutation.isPending ? 'Creando...' : 'Crear Arrendamiento'}
        </Button>
      </div>
    </form>
  );
}