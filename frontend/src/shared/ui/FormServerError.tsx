import React from 'react';

interface FormServerErrorProps {
  message?: string;
}

// Este componente solo se renderiza si hay un mensaje.
// Cumple con la especificación de diseño para la alerta de error.
export const FormServerError = ({ message }: FormServerErrorProps) => {
  if (!message) return null;

  return (
    <div
      className="p-3 mb-4 text-sm rounded-lg bg-error-light text-error-dark"
      role="alert"
      data-testid="form-server-error" 
    >
      <span className="font-medium">Error:</span> {message}
    </div>
  );
};