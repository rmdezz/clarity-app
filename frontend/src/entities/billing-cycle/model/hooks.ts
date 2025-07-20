'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/entities/user/model/session.store';
import { useTokenExpiredHandler } from '@/shared/hooks/useTokenExpiredHandler';
import { isTokenExpiredError } from '@/shared/lib/http-client';
import { getBillingCycles, createBillingCycle, getBillingCycleDetails } from './api';
import { ICreateBillingCycle } from './types';
import toast from 'react-hot-toast';

// Hook para obtener lista de ciclos de facturación de una propiedad
export const useBillingCycles = (propertyId: string) => {
  const accessToken = useSessionStore((state) => state.accessToken);
  const hasHydrated = useSessionStore((state) => state._hasHydrated);

  const query = useQuery({
    queryKey: ['billingCycles', propertyId],
    queryFn: () => getBillingCycles(propertyId),
    enabled: !!propertyId && !!accessToken && hasHydrated,
  });

  // Handle TokenExpiredError automatically
  useTokenExpiredHandler(query.error);

  return query;
};

// Hook para crear un nuevo ciclo de facturación
export const useCreateBillingCycle = (propertyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateBillingCycle) =>
      createBillingCycle({ propertyId, data }),
    onSuccess: (newCycle) => {
      // Invalidar cache de ciclos de facturación
      queryClient.invalidateQueries({ 
        queryKey: ['billingCycles', propertyId] 
      });
      
      toast.success(`Ciclo de ${newCycle.month}/${newCycle.year} creado exitosamente`);
      
      return newCycle;
    },
    onError: (error) => {
      if (!isTokenExpiredError(error)) {
        // Manejar errores específicos
        if (error instanceof Error) {
          if (error.message.includes('409') || error.message.includes('Ya existe')) {
            toast.error('Ya existe un ciclo de facturación para este mes y año.');
          } else if (error.message.includes('400') || error.message.includes('futuras')) {
            toast.error('No se pueden crear ciclos para fechas futuras.');
          } else {
            toast.error(error.message || 'Error al crear el ciclo de facturación.');
          }
        } else {
          toast.error('Error al crear el ciclo de facturación.');
        }
      }
    },
  });
};

// Hook para obtener detalles de un ciclo específico
export const useBillingCycleDetails = (cycleId: string) => {
  const accessToken = useSessionStore((state) => state.accessToken);
  const hasHydrated = useSessionStore((state) => state._hasHydrated);

  const query = useQuery({
    queryKey: ['billingCycle', cycleId],
    queryFn: () => getBillingCycleDetails(cycleId),
    enabled: !!cycleId && !!accessToken && hasHydrated,
  });

  // Handle TokenExpiredError automatically
  useTokenExpiredHandler(query.error);

  return query;
};