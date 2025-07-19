import { IUnit } from '@/entities/unit/model/types';
import { UnitFormValues } from './schemas';

interface CreateUnitParams {
  propertyId: string;
  data: UnitFormValues;
  accessToken: string;
}

export const createUnit = async ({ propertyId, data, accessToken }: CreateUnitParams): Promise<IUnit> => {
  if (!accessToken) {
    throw new Error("No hay token de acceso disponible.");
  }

  const response = await fetch(`/api/properties/${propertyId}/units/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
};