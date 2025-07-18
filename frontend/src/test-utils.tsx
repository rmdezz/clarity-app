import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 1. Cree un cliente de consulta para el entorno de prueba.
// Lo creamos fuera para que no se recree en cada renderizado.
const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Desactivar reintentos en las pruebas para que fallen más rápido
      retry: false,
    },
  },
});

// 2. Cree el componente que envuelve a los hijos con todos los proveedores
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

// 3. Cree la función de renderizado personalizada
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// 4. Re-exporte todo desde React Testing Library
export * from '@testing-library/react';

// 5. Sobrescriba la función `render` por defecto con nuestra versión personalizada
export { customRender as render };