import { IProperty } from '@/entities/property/model/types';
import { PropertyFormValues } from './schemas';

// Esta función es responsable de enviar los datos de la propiedad al backend.
// Necesitará el token de acceso para autenticar la petición.
export const createProperty = async (data: PropertyFormValues, accessToken: string): Promise<IProperty> => {
  if (!accessToken) {
    throw new Error("No hay token de acceso disponible para crear la propiedad.");
  }

  const response = await fetch('/api/properties/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`, // [CA-05.3] Requisito de autenticación
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    // Manejo de errores de validación del backend (ej. 400 Bad Request)
    // El formato esperado es { field: ["error message"] }
    throw new Error(JSON.stringify(errorData)); // Se envía el JSON completo del error
  }

  // [CA-05.3] Si es exitoso, devuelve los datos de la propiedad creada.
  return response.json();
};