'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { RuleCreateFormValues } from './schemas';
import { createRuleForProperty } from './api';
import { IRule, RULE_TYPE_LABELS } from '@/entities/rule/model/types';
import { isTokenExpiredError, ApiError } from '@/shared/lib/http-client';

export const useCreateRule = (propertyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RuleCreateFormValues) => createRuleForProperty({ propertyId, data }),
    onSuccess: (newRule) => {
      toast.success(`Regla '${RULE_TYPE_LABELS[newRule.type]}' asignada con éxito.`);
      
      const queryKey = ['propertyRules', propertyId];
      queryClient.setQueryData(queryKey, (oldData: IRule[] | undefined) => {
        return oldData ? [...oldData, newRule] : [newRule];
      });
    },
    onError: (error) => {
      // TokenExpiredError se maneja globalmente, aquí solo errores de negocio
      if (!isTokenExpiredError(error)) {
        // Check if it's a validation error (400 status returns JSON string)
        if (error instanceof Error && error.message.startsWith('{')) {
          try {
            const errorData = JSON.parse(error.message);
            const firstError = Object.values(errorData)[0] as string[];
            toast.error(`Error de validación: ${firstError[0]}`);
          } catch {
            toast.error("Error de validación en el formulario.");
          }
        } else {
          toast.error(error instanceof Error ? error.message : "No se pudo crear la regla.");
        }
      }
    },
  });
};