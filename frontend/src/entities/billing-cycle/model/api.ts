import { httpClient } from '@/shared/lib/http-client';
import { IBillingCycle, ICreateBillingCycle } from './types';

// Obtener lista de ciclos de facturación para una propiedad
export const getBillingCycles = (propertyId: string): Promise<IBillingCycle[]> => {
  return httpClient.get<IBillingCycle[]>(`/api/properties/${propertyId}/billing-cycles/`);
};

// Crear un nuevo ciclo de facturación
export const createBillingCycle = (params: {
  propertyId: string;
  data: ICreateBillingCycle;
}): Promise<IBillingCycle> => {
  return httpClient.post<IBillingCycle>(
    `/api/properties/${params.propertyId}/billing-cycles/`,
    params.data
  );
};

// Obtener detalles de un ciclo específico
export const getBillingCycleDetails = (cycleId: string): Promise<IBillingCycle> => {
  return httpClient.get<IBillingCycle>(`/api/billing-cycles/${cycleId}/`);
};