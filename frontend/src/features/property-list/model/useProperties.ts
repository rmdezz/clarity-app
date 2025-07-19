'use client';

import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '@/entities/user/model/session.store';
import { getPropertiesList } from './api';
import { IPropertyListItem } from '@/entities/property/model/types';

export const useProperties = () => {
  const accessToken = useSessionStore((state) => state.accessToken);

  // useQuery gestionará el estado de carga, error y caché.
  // Error handling is now done globally in QueryClient
  return useQuery<IPropertyListItem[], Error>({
    queryKey: ['propertiesList'], // Clave de caché para este listado
    queryFn: getPropertiesList,
    enabled: !!accessToken, // La consulta solo se ejecuta si hay un token de acceso
  });
};