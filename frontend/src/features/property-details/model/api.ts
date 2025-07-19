import { IProperty } from '@/entities/property/model/types';

export const getPropertyDetails = async (propertyId: string, accessToken: string): Promise<IProperty> => {
  if (!accessToken) {
    throw new Error("No hay token de acceso disponible.");
  }

  const response = await fetch(`/api/properties/${propertyId}/`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    // Lanzará un error 404 si la propiedad no se encuentra o no pertenece al usuario.
    throw new Error("No se pudo obtener los detalles de la propiedad.");
  }

  return response.json();
};