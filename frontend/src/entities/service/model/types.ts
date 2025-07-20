// Tipos de servicios disponibles en el sistema
export const SERVICE_TYPES = {
  ELECTRICITY: 'electricity',
  WATER: 'water',
  ARBITRIOS: 'arbitrios', 
  MOTOR: 'motor',
} as const;

export type ServiceType = typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES];

// Labels para mostrar en la UI
export const SERVICE_LABELS: Record<ServiceType, string> = {
  [SERVICE_TYPES.ELECTRICITY]: 'Luz',
  [SERVICE_TYPES.WATER]: 'Agua',
  [SERVICE_TYPES.ARBITRIOS]: 'Arbitrios',
  [SERVICE_TYPES.MOTOR]: 'Motor',
};

// Descripciones de cada servicio
export const SERVICE_DESCRIPTIONS: Record<ServiceType, string> = {
  [SERVICE_TYPES.ELECTRICITY]: 'Servicio eléctrico con medidores individuales',
  [SERVICE_TYPES.WATER]: 'Servicio de agua potable',
  [SERVICE_TYPES.ARBITRIOS]: 'Impuestos municipales',
  [SERVICE_TYPES.MOTOR]: 'Costo fijo del motor de agua',
};

// Interface para la configuración de regla por servicio (nueva API)
export interface IServiceRule {
  service_type: ServiceType;
  rule_type: string; // Tipo de regla (equal_division, occupant_proration, etc.)
}

// Tipo para la configuración completa de servicios de una propiedad (ahora es un array simple)
export type IPropertyServiceConfiguration = IServiceRule[];

// Interface para el endpoint legacy (mantener para compatibilidad si es necesario)
export interface IServiceRuleLegacy {
  id: number;
  service_type: ServiceType;
  rule_type: string;
  property: number;
  created_at: string;
  updated_at: string;
}