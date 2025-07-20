'use client';

import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '@/entities/user/model/session.store';
import { getRulesForProperty } from './api';

export const usePropertyRules = (propertyId: string) => {
  const accessToken = useSessionStore((state) => state.accessToken);

  // El hook simplemente define la consulta. El manejo de errores
  // se delega al componente que lo consume usando `useTokenExpiredHandler`.
  return useQuery({
    queryKey: ['propertyRules', propertyId],
    queryFn: () => getRulesForProperty(propertyId),
    enabled: !!accessToken && !!propertyId,
  });
};