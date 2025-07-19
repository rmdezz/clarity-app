import { IProperty } from '@/entities/property/model/types';
import { PropertyFormValues } from './schemas';
import { httpClient } from '@/shared/lib/http-client';

// Esta función es responsable de enviar los datos de la propiedad al backend.
export const createProperty = async (data: PropertyFormValues): Promise<IProperty> => {
  return httpClient.post<IProperty>('/api/properties/', data);
};