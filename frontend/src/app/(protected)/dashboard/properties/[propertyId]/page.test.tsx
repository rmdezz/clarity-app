import { render, screen, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importamos la instancia del router mock para controlar la navegación y los parámetros
import mockRouter from 'next-router-mock';
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';

// Componentes que vamos a probar
import PropertyDetailPage from './page';
import ProtectedLayout from '@/app/(protected)/layout';

// Módulos de API que vamos a mockear
import * as propertyApi from '@/features/property-details/model/api';
import * as unitApi from '@/features/unit-create/model/api';
import { useSessionStore } from '@/entities/user/model/session.store';

// Mock completo y explícito de next/navigation para esta suite de pruebas
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => mockRouter.query, // useParams leerá los parámetros de la URL simulada
  usePathname: () => mockRouter.pathname,
}));

// Mocks de las funciones de API
vi.mock('@/features/property-details/model/api');
vi.mock('@/features/unit-create/model/api');

// --- Datos de Prueba Consistentes ---
const mockProperty = {
  id: 1,
  name: 'Edificio Central',
  address: 'Calle Falsa 123',
  user: 1,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  units: [{ id: 101, name: 'Apto 101', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }],
};

const fakeTokens = {
  accessToken: 'fake-access-token-123',
  refreshToken: 'fake-refresh-token-456',
};

// --- Setup y Teardown de Pruebas ---
beforeEach(() => {
  useSessionStore.setState({
    accessToken: fakeTokens.accessToken,
    refreshToken: fakeTokens.refreshToken,
  });

  // 1️⃣  Ruta visible en el navegador simulado
  mockRouter.setCurrentUrl('/dashboard/properties/1');

  // 2️⃣  Parámetro dinámico que leerá useParams()
  mockRouter.query = { propertyId: '1' };

  vi.clearAllMocks();
});

// --- Suite de Pruebas ---
describe('PropertyDetailPage & Unit Creation', () => {
  it('[CA-06.2] Debe obtener y mostrar los detalles de la propiedad y su lista de unidades', async () => {
    // Configuración del mock de la API para este test
    vi.mocked(propertyApi.getPropertyDetails).mockResolvedValue({ ...mockProperty });

    render(
      <MemoryRouterProvider>
        <ProtectedLayout>
          <PropertyDetailPage />
        </ProtectedLayout>
      </MemoryRouterProvider>
    );

    // Aserción: Esperamos a que el contenido principal aparezca.
    // `findByRole` espera a que el estado de carga se resuelva.
    expect(await screen.findByRole('heading', { name: /Edificio Central/i })).toBeInTheDocument();
    expect(screen.getByText(/Apto 101/i)).toBeInTheDocument();

    // Aserción: Verificamos que la API fue llamada con los parámetros correctos.
    expect(propertyApi.getPropertyDetails).toHaveBeenCalledWith('1', fakeTokens.accessToken);
  });

  it('[CA-06.4] Debe abrir un modal, crear una unidad y actualizar la lista instantáneamente', async () => {
    const user = userEvent.setup();
    const newUnit = { id: 102, name: 'Apto 102', created_at: '2025-01-02T00:00:00Z', updated_at: '2025-01-02T00:00:00Z' };

    // Configuración de mocks
    vi.mocked(propertyApi.getPropertyDetails).mockResolvedValue({ ...mockProperty });
    vi.mocked(unitApi.createUnit).mockResolvedValue(newUnit);

    render(
      <MemoryRouterProvider>
        <ProtectedLayout>
          <PropertyDetailPage />
        </ProtectedLayout>
      </MemoryRouterProvider>
    );

    // 1. Esperar a que la página cargue y encontrar el botón de "Añadir Unidad"
    const addButton = await screen.findByRole('button', { name: /Añadir Unidad/i });
    await user.click(addButton);

    // 2. Interactuar con el formulario dentro del modal
    const nameInput = await screen.findByLabelText(/Nombre \/ Número de Unidad/i);
    const saveButton = screen.getByRole('button', { name: /Guardar Unidad/i });

    await user.type(nameInput, newUnit.name);
    await user.click(saveButton);

    // 3. Verificar la actualización instantánea de la UI y la llamada a la API
    await waitFor(() => {
      // Aserción: La nueva unidad "Apto 102" aparece en la lista sin recargar.
      expect(screen.getByText(newUnit.name)).toBeInTheDocument();
      
      // Aserción: La API de creación fue llamada con los datos correctos.
      expect(unitApi.createUnit).toHaveBeenCalledWith({
        propertyId: '1',
        data: { name: newUnit.name },
        accessToken: fakeTokens.accessToken,
      });
    });

    // 4. Aserción: El modal se ha cerrado después del éxito.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});