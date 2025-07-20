// frontend/src/entities/tenancy/model/hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tenancyApi } from './api';
import type { 
  Tenancy, 
  TenancyCreateData, 
  TenancyUpdateData, 
  TenancyEndData,
  TenantOption 
} from './types';

// Keys para query invalidation
export const tenancyKeys = {
  all: ['tenancies'] as const,
  byUnit: (unitId: number) => [...tenancyKeys.all, 'unit', unitId] as const,
  availableTenants: (unitId: number) => ['tenants', 'available', unitId] as const,
};

// Hook para obtener arrendamientos de una unidad
export const useTenancies = (unitId: number) => {
  return useQuery({
    queryKey: tenancyKeys.byUnit(unitId),
    queryFn: async () => {
      console.log('useTenancies called with unitId:', unitId);
      if (!unitId) {
        console.error('Unit ID is missing or invalid:', unitId);
        throw new Error('Unit ID is required');
      }
      try {
        const result = await tenancyApi.getByUnit(unitId);
        console.log('useTenancies result:', result);
        return result;
      } catch (error: any) {
        console.error('useTenancies error:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Error al cargar arrendamientos';
        throw new Error(errorMessage);
      }
    },
    enabled: !!unitId,
    retry: false, // Cambiado para evitar reintentos durante debug
  });
};

// Hook para obtener inquilinos disponibles
export const useAvailableTenants = (unitId: number) => {
  return useQuery({
    queryKey: tenancyKeys.availableTenants(unitId),
    queryFn: async () => {
      console.log('useAvailableTenants called with unitId:', unitId);
      if (!unitId) {
        console.error('Unit ID is missing for available tenants:', unitId);
        throw new Error('Unit ID is required');
      }
      try {
        const result = await tenancyApi.getAvailableTenants(unitId);
        console.log('useAvailableTenants result:', result);
        // Asegurar que siempre retornamos un array
        return Array.isArray(result) ? result : [];
      } catch (error: any) {
        console.error('useAvailableTenants error:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Error al cargar inquilinos';
        throw new Error(errorMessage);
      }
    },
    enabled: !!unitId,
    retry: false, // Cambiado para evitar reintentos durante debug
  });
};

// Hook para crear un arrendamiento
export const useCreateTenancy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ unitId, data }: { unitId: number; data: TenancyCreateData }) => 
      tenancyApi.create(unitId, data),
    onSuccess: (_, { unitId }) => {
      // Invalidar caché de arrendamientos de la unidad
      queryClient.invalidateQueries({ queryKey: tenancyKeys.byUnit(unitId) });
    },
  });
};

// Hook para actualizar un arrendamiento
export const useUpdateTenancy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenancyId, data }: { tenancyId: number; data: TenancyUpdateData }) => 
      tenancyApi.update(tenancyId, data),
    onSuccess: (updatedTenancy) => {
      // Invalidar caché de arrendamientos de la unidad
      queryClient.invalidateQueries({ 
        queryKey: tenancyKeys.byUnit(updatedTenancy.unit) 
      });
    },
  });
};

// Hook para actualización parcial de un arrendamiento
export const usePartialUpdateTenancy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenancyId, data }: { tenancyId: number; data: Partial<TenancyUpdateData> }) => 
      tenancyApi.partialUpdate(tenancyId, data),
    onSuccess: (updatedTenancy) => {
      queryClient.invalidateQueries({ 
        queryKey: tenancyKeys.byUnit(updatedTenancy.unit) 
      });
    },
  });
};

// Hook para finalizar un arrendamiento
export const useEndTenancy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenancyId, data }: { tenancyId: number; data: TenancyEndData }) => 
      tenancyApi.end(tenancyId, data),
    onSuccess: (updatedTenancy) => {
      // Invalidar caché de arrendamientos de la unidad
      queryClient.invalidateQueries({ 
        queryKey: tenancyKeys.byUnit(updatedTenancy.unit) 
      });
    },
  });
};