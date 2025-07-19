'use client'; // Necesario porque Toaster usa hooks internamente.

import { Toaster } from 'react-hot-toast';

/**
 * ToastProvider es un componente de configuración sin renderizado visual directo.
 * Encapsula la librería `react-hot-toast` y su configuración de estilo para
 * mantener la coherencia en toda la aplicación y el `RootLayout` limpio.
 */
export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right" // Posición especificada en el brief de diseño.
      toastOptions={{
        // Duración por defecto para los toasts
        duration: 4000,

        // Estilos para el toast de ÉXITO
        success: {
          style: {
            background: '#28A745', // Verde de Confirmación
            color: '#FFFFFF',
            border: '1px solid #1c7430', // Borde ligeramente más oscuro
          },
          iconTheme: {
            primary: '#FFFFFF',
            secondary: '#28A745',
          },
        },

        // Estilos para el toast de ERROR (preparado para el futuro)
        error: {
          style: {
            background: '#DC3545', // Rojo de Alerta
            color: '#FFFFFF',
            border: '1px solid #a71d2a',
          },
          iconTheme: {
            primary: '#FFFFFF',
            secondary: '#DC3545',
          },
        },

        // Estilos para los componentes por defecto
        style: {
          minWidth: '250px',
          padding: '16px',
        },
      }}
    />
  );
};