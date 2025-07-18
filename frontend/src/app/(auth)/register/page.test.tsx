import { render, screen, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import RegisterPage from './page';
import * as api from '@/features/auth/model/api';
import { useSessionStore } from '@/entities/user/model/session.store';

// --- Mocks ---
// 1. Mock de Next.js Navigation
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));
vi.mock('@/features/auth/model/api');
const originalState = useSessionStore.getState();
beforeEach(() => {
  useSessionStore.setState(originalState);
  vi.clearAllMocks();
});

// Suite de Pruebas Actualizada
describe('RegisterPage', () => {

  it('[CA-01.1] Debe renderizar el formulario con todos sus campos', () => {
    render(<RegisterPage />);
    
    expect(screen.getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    // CORRECCIÓN: Ser explícitos sobre qué campo estamos buscando.
    expect(screen.getByLabelText(/^Contraseña$/i)).toBeInTheDocument(); // Busca la etiqueta exacta "Contraseña"
    expect(screen.getByLabelText(/Confirmar Contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar cuenta/i })).toBeInTheDocument();
  });

  // Este test pasó, pero lo revisamos por coherencia. No necesita cambios.
  it('[CA-01.2] Debe mostrar errores de validación del cliente sin llamar a la API', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    const submitButton = screen.getByRole('button', { name: /registrar cuenta/i });
    
    await user.click(submitButton);

    expect(await screen.findByText(/Por favor, ingrese un correo electrónico válido/i)).toBeInTheDocument();
    expect(screen.getByText(/La contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
    expect(api.registerUser).not.toHaveBeenCalled();
  });

  it('[CA-01.4] Debe llamar a la API, guardar el token y redirigir en un registro exitoso', async () => {
    const user = userEvent.setup();
    const mockToken = 'fake-jwt-token-123';
    vi.mocked(api.registerUser).mockResolvedValueOnce({ token: mockToken });
    const setTokenSpy = vi.spyOn(useSessionStore.getState(), 'setToken');
    
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'david.test@clarity.com');
    // CORRECCIÓN: Escribir en cada campo de forma explícita
    await user.type(screen.getByLabelText(/^Contraseña$/i), 'passwordValido123');
    await user.type(screen.getByLabelText(/Confirmar Contraseña/i), 'passwordValido123');
    await user.click(screen.getByRole('button', { name: /registrar cuenta/i }));
    
    await waitFor(() => {
      expect(api.registerUser).toHaveBeenCalledWith({
        email: 'david.test@clarity.com',
        password: 'passwordValido123',
        password2: 'passwordValido123', // El payload ahora es correcto
      });
      expect(setTokenSpy).toHaveBeenCalledWith(mockToken);
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('[CA-01.4] Debe mostrar un error del servidor si el correo ya existe', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Un usuario con este correo electrónico ya existe.';
    vi.mocked(api.registerUser).mockRejectedValueOnce(new Error(errorMessage));

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'david.existente@clarity.com');
    // CORRECCIÓN: Escribir en cada campo de forma explícita
    await user.type(screen.getByLabelText(/^Contraseña$/i), 'passwordValido123');
    await user.type(screen.getByLabelText(/Confirmar Contraseña/i), 'passwordValido123');
    await user.click(screen.getByRole('button', { name: /registrar cuenta/i }));

    expect(await screen.findByText(new RegExp(errorMessage, "i"))).toBeInTheDocument();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});