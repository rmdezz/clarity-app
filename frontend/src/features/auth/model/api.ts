import { LoginFormValues, RegistrationFormValues } from './schemas';

// Esta función es responsable únicamente de comunicarse con el endpoint de Django.
export const registerUser = async (data: RegistrationFormValues) => {
  const response = await fetch('/api/auth/register/', { // Nota: Usamos una ruta relativa para el proxy de Next.js
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

export const loginUser = async (data: LoginFormValues) => {
  const response = await fetch('/api/auth/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  // La lógica de manejo de errores es idéntica y reutilizable.
  if (!response.ok) {
    const errorData = await response.json();
    // Lanzamos el mensaje de error que viene de la API [CA-02.3]
    throw new Error(errorData.error || 'Ocurrió un error al iniciar sesión.');
  }

  return response.json();
};

export const logoutUser = async (tokens: { accessToken: string; refreshToken: string }) => {
  if (!tokens.accessToken || !tokens.refreshToken) {
    console.error("Logout no puede proceder: falta el access o refresh token.");
    return;
  }

  try {
    await fetch('/api/auth/logout/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 1. Autenticar la petición con el access token.
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
      // 2. Enviar el refresh token en el cuerpo para su invalidación.
      body: JSON.stringify({
        refresh: tokens.refreshToken,
      }),
    });
  } catch (error) {
    console.error("La llamada al endpoint de logout ha fallado:", error);
  }
};