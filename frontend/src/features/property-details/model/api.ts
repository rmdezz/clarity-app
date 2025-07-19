import { IProperty } from '@/entities/property/model/types';
import { httpClient } from '@/shared/lib/http-client';

export const getPropertyDetails = async (propertyId: string): Promise<IProperty> => {
  return httpClient.get<IProperty>(`/api/properties/${propertyId}/`);
};