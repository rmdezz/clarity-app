import { IUnit } from '@/entities/unit/model/types';
import { UnitFormValues } from './schemas';
import { httpClient } from '@/shared/lib/http-client';

interface CreateUnitParams {
  propertyId: string;
  data: UnitFormValues;
}

export const createUnit = async ({ propertyId, data }: CreateUnitParams): Promise<IUnit> => {
  return httpClient.post<IUnit>(`/api/properties/${propertyId}/units/`, data);
};