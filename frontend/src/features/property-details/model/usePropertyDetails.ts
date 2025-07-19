'use client';

import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '@/entities/user/model/session.store';
import { getPropertyDetails } from './api';

export const usePropertyDetails = (propertyId: string) => {
  const accessToken = useSessionStore((state) => state.accessToken);

  return useQuery({
    // La clave de caché incluye el ID de la propiedad para ser única.
    queryKey: ['property', propertyId],
    queryFn: () => getPropertyDetails(propertyId),
    // La consulta solo se activará si el propertyId y el accessToken existen.
    enabled: !!propertyId && !!accessToken,
  });
};