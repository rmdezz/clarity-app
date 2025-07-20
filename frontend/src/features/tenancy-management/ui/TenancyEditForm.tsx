// frontend/src/features/tenancy-management/ui/TenancyEditForm.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateTenancy } from '@/entities/tenancy/model/hooks';
import { Tenancy, TenancyUpdateData } from '@/entities/tenancy/model/types';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const tenancyEditSchema = z.object({
  number_of_occupants: z.number()
    .min(1, 'Debe haber al menos 1 ocupante')
    .max(20, 'Máximo 20 ocupantes'),
  start_date: z.string()
    .min(1, 'La fecha de inicio es requerida'),
  end_date: z.string().optional().or(z.literal('')),
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

type TenancyEditFormData = z.infer<typeof tenancyEditSchema>;

interface TenancyEditFormProps {
  tenancy: Tenancy;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TenancyEditForm({ tenancy, onSuccess, onCancel }: TenancyEditFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<TenancyEditFormData>({
    resolver: zodResolver(tenancyEditSchema),
    defaultValues: {
      number_of_occupants: tenancy.number_of_occupants,
      start_date: tenancy.start_date,
      end_date: tenancy.end_date || '',
    },
  });

  const updateTenancyMutation = useUpdateTenancy();

  const onSubmit = async (data: TenancyEditFormData) => {
    setSubmitError(null);
    
    try {
      const submitData: TenancyUpdateData = {
        number_of_occupants: data.number_of_occupants,
        start_date: data.start_date,
        ...(data.end_date && data.end_date !== '' ? { end_date: data.end_date } : { end_date: undefined }),
      };

      await updateTenancyMutation.mutateAsync({
        tenancyId: tenancy.id,
        data: submitData,
      });

      onSuccess();
    } catch (error: any) {
      if (error.response?.status === 409) {
        setSubmitError('Las fechas del arrendamiento se superponen con otro arrendamiento existente.');
      } else if (error.response?.status === 400) {
        setSubmitError('Datos inválidos. Verifique las fechas y ocupantes.');
      } else {
        setSubmitError('Error al actualizar el arrendamiento. Intente nuevamente.');
      }
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Información del inquilino (solo lectura) */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Información del Inquilino</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <p><strong>Nombre:</strong> {tenancy.tenant_name}</p>
          <p><strong>Email:</strong> {tenancy.tenant_email}</p>
          <p><strong>Unidad:</strong> {tenancy.unit_name}</p>
        </div>
      </div>

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
        <label className="text-sm font-medium">Fecha de Fin</label>
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
          disabled={updateTenancyMutation.isPending}
        >
          {updateTenancyMutation.isPending ? 'Actualizando...' : 'Actualizar Arrendamiento'}
        </Button>
      </div>
    </form>
  );
}