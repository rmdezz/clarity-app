// frontend/src/entities/tenancy/model/api.ts

import { httpClient } from '@/shared/lib/http-client';
import type { 
  Tenancy, 
  TenancyCreateData, 
  TenancyUpdateData, 
  TenancyEndData,
  TenantOption 
} from './types';

export const tenancyApi = {
  // Obtener arrendamientos de una unidad
  getByUnit: async (unitId: number): Promise<Tenancy[]> => {
    console.log('Fetching tenancies for unit:', unitId);
    try {
      const response = await httpClient.get(`/api/units/${unitId}/tenancies/`);
      console.log('Tenancies response:', response);
      // Asegurar que siempre retornamos un array
      return response.data || [];
    } catch (error) {
      console.error('Error fetching tenancies:', error);
      throw error;
    }
  },

  // Crear un nuevo arrendamiento
  create: async (unitId: number, data: TenancyCreateData): Promise<Tenancy> => {
    const response = await httpClient.post(`/api/units/${unitId}/tenancies/`, data);
    return response.data;
  },

  // Actualizar un arrendamiento
  update: async (tenancyId: number, data: TenancyUpdateData): Promise<Tenancy> => {
    const response = await httpClient.put(`/api/tenancies/${tenancyId}/`, data);
    return response.data;
  },

  // Actualización parcial de un arrendamiento
  partialUpdate: async (tenancyId: number, data: Partial<TenancyUpdateData>): Promise<Tenancy> => {
    const response = await httpClient.patch(`/api/tenancies/${tenancyId}/`, data);
    return response.data;
  },

  // Finalizar un arrendamiento
  end: async (tenancyId: number, data: TenancyEndData): Promise<Tenancy> => {
    const response = await httpClient.put(`/api/tenancies/${tenancyId}/end/`, data);
    return response.data;
  },

  // Obtener inquilinos disponibles para una unidad
  getAvailableTenants: async (unitId: number): Promise<TenantOption[]> => {
    console.log('Fetching available tenants for unit:', unitId);
    try {
      const response = await httpClient.get(`/api/units/${unitId}/tenants/`);
      console.log('Available tenants response:', response);
      // Asegurar que siempre retornamos un array
      return response.data || [];
    } catch (error) {
      console.error('Error fetching available tenants:', error);
      throw error;
    }
  },
};