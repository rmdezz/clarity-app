// Importamos nuestro renderizador personalizado que ya incluye los proveedores necesarios.
import { render, screen, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import LoginPage from './page';
import * as api from '@/features/auth/model/api';
import { useSessionStore } from '@/entities/user/model/session.store';

// --- Mocks ---
// Reutilizamos el mismo patrón de mocks que en la prueba de registro.

// 1. Mock de Next.js Navigation para `useRouter`.
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// 2. Mock del módulo de la API para controlar `loginUser`.
vi.mock('@/features/auth/model/api');

// 3. Reseteo del store de Zustand y mocks antes de cada prueba.
const originalState = useSessionStore.getState();
beforeEach(() => {
  useSessionStore.setState(originalState);
  vi.clearAllMocks();
});

// --- Suite de Pruebas ---
describe('LoginPage', () => {

  it('[CA-02.1] Debe renderizar el formulario con todos sus campos', () => {
    render(<LoginPage />);
    
    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Contraseña$/i)).toBeInTheDocument(); // Consulta precisa
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('[CA-02.3] Debe llamar a la API, guardar el token y redirigir en un inicio de sesión exitoso', async () => {
    const user = userEvent.setup();
    const mockToken = 'new-jwt-token-456';
    // Simulamos una respuesta exitosa de la API
    vi.mocked(api.loginUser).mockResolvedValueOnce({ token: mockToken });
    const setTokenSpy = vi.spyOn(useSessionStore.getState(), 'setToken');
    
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'david.existing@clarity.com');
    await user.type(screen.getByLabelText(/^Contraseña$/i), 'correct-password');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    
    // Esperamos a que todas las operaciones asíncronas se completen
    await waitFor(() => {
      // Verificamos que la API fue llamada con los datos correctos
      expect(api.loginUser).toHaveBeenCalledWith({
        email: 'david.existing@clarity.com',
        password: 'correct-password',
      });
      // Verificamos que el token se guardó en el store
      expect(setTokenSpy).toHaveBeenCalledWith(mockToken);
      // Verificamos la redirección
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('[CA-02.3] Debe mostrar un error del servidor si las credenciales son inválidas', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Credenciales inválidas. Por favor, verifique su correo y contraseña.';
    // Simulamos una respuesta de error 401 de la API
    vi.mocked(api.loginUser).mockRejectedValueOnce(new Error(errorMessage));

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'david.existing@clarity.com');
    await user.type(screen.getByLabelText(/^Contraseña$/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Verificamos que el mensaje de error de la API se muestra en la pantalla
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    // Verificamos que NO se intentó redirigir
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

});