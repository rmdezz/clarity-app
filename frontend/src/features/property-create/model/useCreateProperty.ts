'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { PropertyFormValues, propertySchema } from './schemas';
import { createProperty } from './api';
import toast from 'react-hot-toast';

export const useCreateProperty = () => {
  const router = useRouter();

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: { name: '', address: '' },
    mode: 'onBlur',
  });

  const mutation = useMutation({
    mutationFn: (data: PropertyFormValues) => createProperty(data), // Token handled by httpClient
    onSuccess: () => {
      // 1. DISPARAR LA NOTIFICACIÓN DE ÉXITO.
      // Este es el nuevo Criterio de Aceptación.
      toast.success('Propiedad creada con éxito.');
      
      // [CA-05.4] Redirigir a la página de listado de propiedades
      router.push('/dashboard/properties'); 
      form.reset(); // Opcional: limpiar el formulario después del éxito
    },
    onError: (error: Error) => {
      // Intentar parsear el error del backend si viene como JSON
      try {
        const parsedError = JSON.parse(error.message);
        // Iterar sobre los errores de los campos y asignarlos a react-hook-form
        for (const key in parsedError) {
          if (Object.prototype.hasOwnProperty.call(parsedError, key)) {
            // Asegurarse de que el campo existe en el formulario y que el error es un array
            if (form.getFieldState(key as keyof PropertyFormValues) && Array.isArray(parsedError[key])) {
              form.setError(key as keyof PropertyFormValues, { 
                type: 'server', 
                message: parsedError[key][0] // Tomar el primer mensaje de error
              });
            }
          }
        }
      } catch {
        // Si no es un JSON válido, mostrar un error genérico del servidor.
        form.setError('root.serverError', { 
          type: 'manual', 
          message: error.message || 'Ocurrió un error inesperado al crear la propiedad.' 
        });
      }
    },
  });

  const onSubmit = (values: PropertyFormValues) => {
    // Auth check now handled by httpClient and global error handler
    mutation.mutate(values);
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading: mutation.isPending,
    serverError: form.formState.errors.root?.serverError?.message,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
};