'use client';

// Dialog components no longer needed - using custom modal
import { Button } from '@/shared/ui/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TenantFormValues,
  TenantFormRawValues,
  tenantSchema,
} from '../model/schemas';
import { TenantForm } from './TenantForm';
import { useAssignTenant } from '../model/useAssignTenant';
import { IUnit } from '@/entities/unit/model/types';

interface AssignTenantModalProps {
  propertyId: string;
  unit: IUnit | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const AssignTenantModal = ({
  propertyId,
  unit,
  isOpen,
  onOpenChange,
}: AssignTenantModalProps) => {
  /* ───────────────────────── RHF ───────────────────────── */
  const form = useForm<TenantFormRawValues, any, TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      email: '',
      number_of_occupants: 1,
    },
  });

  const { mutate: assignTenant, isPending: isLoading } =
    useAssignTenant(propertyId);

  const onSubmit = (values: TenantFormValues) => {
    if (!unit) return;

    assignTenant(
      { unitId: unit.id, data: values },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      },
    );
  };

  if (!isOpen) return null;

  /* ───────────────────────── Render ───────────────────────── */
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={() => {
          form.reset();
          onOpenChange(false);
        }}
      />
      
      {/* Modal Content */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <h2 className="text-lg font-semibold mb-2">Asignar Inquilino a {unit?.name}</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Complete los detalles del nuevo inquilino para esta unidad.
          </p>

          <TenantForm form={form} />

          <div className="flex justify-end gap-2 mt-4">
            <Button 
              type="button" 
              variant="secondary" 
              disabled={isLoading}
              onClick={() => {
                form.reset();
                onOpenChange(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Asignar Inquilino
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};
