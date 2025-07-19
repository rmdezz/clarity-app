'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/shared/ui/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UnitFormValues, unitSchema } from '../model/schemas';
import { UnitForm } from './UnitForm';
import { useCreateUnit } from '../model/useCreateUnit';

interface CreateUnitModalProps {
  propertyId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const CreateUnitModal = ({ propertyId, isOpen, onOpenChange }: CreateUnitModalProps) => {
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: { name: '' },
  });

  const { mutate: createUnit, isPending: isLoading } = useCreateUnit(propertyId);

  const onSubmit = (values: UnitFormValues) => {
    createUnit(values, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false); // Cierra el modal en caso de éxito
      },
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal Content */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <h2 className="text-lg font-semibold mb-4">Añadir Nueva Unidad</h2>
          
          <UnitForm form={form} />
          
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Guardar Unidad
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};