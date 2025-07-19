'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useSessionStore } from '@/entities/user/model/session.store';
import { TenantFormValues } from './schemas';
import { assignTenantToUnit } from './api';
import { IProperty } from '@/entities/property/model/types';
import { ITenant } from '@/entities/tenant/model/types';

export const useAssignTenant = (propertyId: string) => {
  const queryClient = useQueryClient();
  const accessToken = useSessionStore((state) => state.accessToken);

  return useMutation({
    // La función de mutación ahora también necesita el ID de la unidad
    mutationFn: ({ unitId, data }: { unitId: number, data: TenantFormValues }) => 
      assignTenantToUnit({ unitId, data, accessToken: accessToken! }),
      
    onSuccess: (newTenant, { unitId }) => {
      toast.success(`Inquilino '${newTenant.name}' asignado con éxito.`);
      
      // --- [CA-07.4] ACTUALIZACIÓN INSTANTÁNEA ---
      const queryKey = ['property', propertyId];

      queryClient.setQueryData(queryKey, (oldData: IProperty | undefined) => {
        if (!oldData) return undefined;

        // Actualizamos el estado de la propiedad en la caché de TanStack Query
        return {
          ...oldData,
          units: oldData.units.map(unit => 
            unit.id === unitId 
              ? { ...unit, tenant: newTenant } // Asignamos el nuevo inquilino a la unidad correcta
              : unit
          ),
        };
      });
    },
    onError: (error: Error) => {
      // Manejo de errores genérico y de validación
      try {
        const parsedError = JSON.parse(error.message);
        const firstError = Object.values(parsedError)[0] as string[];
        toast.error(`Error: ${firstError[0] || 'No se pudo asignar el inquilino.'}`);
      } catch {
        toast.error(error.message || "No se pudo asignar el inquilino.");
      }
    },
  });
};