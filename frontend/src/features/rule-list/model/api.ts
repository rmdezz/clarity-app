import { httpClient } from '@/shared/lib/http-client';
import { IRule } from '@/entities/rule/model/types';

export const getRulesForProperty = (propertyId: string): Promise<IRule[]> => {
  // El httpClient se encarga de añadir el token y manejar los errores.
  return httpClient.get<IRule[]>(`/api/properties/${propertyId}/rules/`);
};