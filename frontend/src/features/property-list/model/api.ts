import { IPropertyListItem } from '@/entities/property/model/types';
import { httpClient } from '@/shared/lib/http-client';

export const getPropertiesList = async (): Promise<IPropertyListItem[]> => {
  return httpClient.get<IPropertyListItem[]>('/api/properties/');
};