'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/entities/user/model/session.store';
import { 
  getPropertyServiceConfiguration, 
  updatePropertyServiceConfiguration 
} from './api';
import { useTokenExpiredHandler } from '@/shared/hooks/useTokenExpiredHandler';
import { isTokenExpiredError } from '@/shared/lib/http-client';
import toast from 'react-hot-toast';

// Hook para obtener configuración de servicios
export const usePropertyServiceConfiguration = (propertyId: string) => {
  const accessToken = useSessionStore((state) => state.accessToken);
  const hasHydrated = useSessionStore((state) => state._hasHydrated);

  const query = useQuery({
    queryKey: ['propertyServiceConfiguration', propertyId],
    queryFn: () => getPropertyServiceConfiguration(propertyId),
    enabled: !!propertyId && !!accessToken && hasHydrated,
  });

  // Handle TokenExpiredError automatically
  useTokenExpiredHandler(query.error);

  return query;
};

// Hook para actualizar configuración de servicios
export const useUpdateServiceConfiguration = (propertyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceRules: Array<{ service_type: string; rule_type: string }>) =>
      updatePropertyServiceConfiguration({ propertyId, serviceRules }),
    onSuccess: () => {
      // Invalidar cache de configuración
      queryClient.invalidateQueries({ 
        queryKey: ['propertyServiceConfiguration', propertyId] 
      });
      
      // También invalidar reglas de la propiedad si existe
      queryClient.invalidateQueries({ 
        queryKey: ['propertyRules', propertyId] 
      });
      
      toast.success('Configuración de servicios actualizada exitosamente');
    },
    onError: (error) => {
      if (!isTokenExpiredError(error)) {
        // Manejar errores de validación específicos
        if (error instanceof Error && error.message.startsWith('{')) {
          try {
            const errorData = JSON.parse(error.message);
            const firstError = Object.values(errorData)[0] as string[];
            toast.error(`Error de validación: ${firstError[0]}`);
          } catch {
            toast.error("Error de validación en la configuración.");
          }
        } else {
          toast.error(error instanceof Error ? error.message : "No se pudo guardar la configuración.");
        }
      }
    },
  });
};