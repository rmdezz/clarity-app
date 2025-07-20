import { ServiceType, SERVICE_TYPES } from './types';
import { RULE_TYPES, IRuleExplanation, AVAILABLE_RULES_EXPLANATIONS } from '@/entities/rule/model/types';

// Mapeo de servicios a reglas recomendadas
export const SERVICE_RECOMMENDED_RULES: Record<ServiceType, string[]> = {
  [SERVICE_TYPES.ELECTRICITY]: [
    RULE_TYPES.CONSUMPTION_ADJUSTMENT, // Recomendado
    RULE_TYPES.EQUAL_DIVISION,
    RULE_TYPES.OCCUPANT_PRORATION,
  ],
  [SERVICE_TYPES.WATER]: [
    RULE_TYPES.OCCUPANT_PRORATION, // Recomendado
    RULE_TYPES.CONSUMPTION_ADJUSTMENT,
    RULE_TYPES.EQUAL_DIVISION,
  ],
  [SERVICE_TYPES.ARBITRIOS]: [
    RULE_TYPES.EQUAL_DIVISION, // Recomendado
    RULE_TYPES.PROPORTIONAL_AREA,
  ],
  [SERVICE_TYPES.MOTOR]: [
    RULE_TYPES.FIXED_FEE, // Recomendado
    RULE_TYPES.EQUAL_DIVISION,
  ],
};

// Función para obtener reglas disponibles para un servicio específico
export const getRulesForService = (serviceType: ServiceType): IRuleExplanation[] => {
  const availableRuleTypes = SERVICE_RECOMMENDED_RULES[serviceType];
  return AVAILABLE_RULES_EXPLANATIONS.filter(rule => 
    availableRuleTypes.includes(rule.type)
  );
};

// Función para obtener la regla recomendada para un servicio
export const getRecommendedRuleForService = (serviceType: ServiceType): string => {
  return SERVICE_RECOMMENDED_RULES[serviceType][0]; // La primera es la recomendada
};

// Función para verificar si una regla es válida para un servicio
export const isRuleValidForService = (serviceType: ServiceType, ruleType: string): boolean => {
  return SERVICE_RECOMMENDED_RULES[serviceType].includes(ruleType);
};