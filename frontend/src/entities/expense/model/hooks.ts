'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/entities/user/model/session.store';
import { useTokenExpiredHandler } from '@/shared/hooks/useTokenExpiredHandler';
import { isTokenExpiredError } from '@/shared/lib/http-client';
import { expenseApi } from './api';
import { ExpenseCreateData } from './types';
import toast from 'react-hot-toast';

// Hook para obtener lista de gastos de un ciclo de facturación
export const useExpenses = (cycleId: string) => {
  const accessToken = useSessionStore((state) => state.accessToken);
  const hasHydrated = useSessionStore((state) => state._hasHydrated);

  const query = useQuery({
    queryKey: ['expenses', cycleId],
    queryFn: () => expenseApi.getExpenses(cycleId),
    enabled: !!cycleId && !!accessToken && hasHydrated,
  });

  // Handle TokenExpiredError automatically
  useTokenExpiredHandler(query.error);

  return query;
};

// Hook para crear un nuevo gasto
export const useCreateExpense = (cycleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExpenseCreateData) => expenseApi.createExpense(cycleId, data),
    onSuccess: (newExpense) => {
      // Invalidar cache de gastos del ciclo
      queryClient.invalidateQueries({ 
        queryKey: ['expenses', cycleId] 
      });
      
      toast.success(`Gasto de ${newExpense.service_type_display} creado exitosamente`);
      
      return newExpense;
    },
    onError: (error) => {
      if (!isTokenExpiredError(error)) {
        // Manejar errores específicos
        if (error instanceof Error) {
          if (error.message.includes('409') || error.message.includes('regla')) {
            toast.error('Debe configurar una regla para este servicio antes de añadir gastos.');
          } else if (error.message.includes('409') || error.message.includes('abierto')) {
            toast.error('No se pueden añadir gastos a un ciclo que no está abierto.');
          } else if (error.message.includes('400')) {
            toast.error('Por favor, verifica los datos ingresados.');
          } else {
            toast.error(error.message || 'Error al crear el gasto.');
          }
        } else {
          toast.error('Error al crear el gasto.');
        }
      }
    },
  });
};