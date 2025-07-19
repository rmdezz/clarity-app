'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useSessionStore } from '@/entities/user/model/session.store';
import { UnitFormValues } from './schemas';
import { createUnit } from './api';
import { IProperty } from '@/entities/property/model/types';
import { IUnit } from '@/entities/unit/model/types';

export const useCreateUnit = (propertyId: string) => {
  const queryClient = useQueryClient();
  const accessToken = useSessionStore((state) => state.accessToken);

  return useMutation({
    mutationFn: (data: UnitFormValues) => createUnit({ propertyId, data, accessToken: accessToken! }),
    onSuccess: (newUnit: IUnit) => {
      toast.success(`Unidad '${newUnit.name}' creada con éxito.`);
      
      // --- [CA-06.4] ACTUALIZACIÓN OPTIMISTA E INSTANTÁNEA ---
      // Actualizamos los datos en la caché de TanStack Query sin necesidad de un refetch.
      const queryKey = ['property', propertyId];

      queryClient.setQueryData(queryKey, (oldData: IProperty | undefined) => {
        // Si por alguna razón la caché está vacía, no hacemos nada.
        if (!oldData) return undefined;
        
        // Devolvemos el estado antiguo, pero con la nueva unidad añadida al array.
        return {
          ...oldData,
          units: [...oldData.units, newUnit],
        };
      });
    },
    onError: (error: Error) => {
      // Intentar parsear los errores de validación del backend
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.name) {
          toast.error(`Error: ${parsedError.name[0]}`);
        } else {
          toast.error("Hubo un problema al crear la unidad.");
        }
      } catch {
        toast.error("Hubo un problema al crear la unidad.");
      }
    },
  });
};