import { httpClient } from '@/shared/lib/http-client';
import { IRule } from '@/entities/rule/model/types';
import { RuleCreateFormValues } from './schemas';

interface CreateRuleParams {
  propertyId: string;
  data: RuleCreateFormValues;
}

export const createRuleForProperty = ({ propertyId, data }: CreateRuleParams): Promise<IRule> => {
  // El httpClient se encarga del POST, la serialización y el manejo de errores.
  return httpClient.post<IRule>(`/api/properties/${propertyId}/rules/`, data);
};