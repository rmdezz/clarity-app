import { ITenant } from '@/entities/tenant/model/types';
import { TenantFormValues } from './schemas';

interface AssignTenantParams {
  unitId: number;
  data: TenantFormValues;
  accessToken: string;
}

export const assignTenantToUnit = async ({ unitId, data, accessToken }: AssignTenantParams): Promise<ITenant> => {
  if (!accessToken) {
    throw new Error("No hay token de acceso disponible.");
  }

  const response = await fetch(`/api/units/${unitId}/assign-tenant/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    // Lanzamos el error del backend para que el hook `onError` lo capture
    throw new Error(errorData.error || JSON.stringify(errorData));
  }

  return response.json();
};