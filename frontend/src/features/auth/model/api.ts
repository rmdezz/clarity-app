import { RegistrationFormValues } from './schemas';

// Esta función es responsable únicamente de comunicarse con el endpoint de Django.
export const registerUser = async (data: RegistrationFormValues) => {
  const response = await fetch('/api/auth/register', { // Nota: Usamos una ruta relativa para el proxy de Next.js
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  // Si la respuesta no es "ok" (ej. status 409, 500), leemos el error y lo lanzamos.
  // TanStack Query capturará este error en la propiedad `onError`.
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Ocurrió un error en el registro.');
  }

  // Si la respuesta es exitosa (201 Created), devolvemos el cuerpo del JSON.
  // TanStack Query proporcionará esto en la propiedad `onSuccess`.
  return response.json();
};