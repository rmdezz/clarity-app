export interface IRule {
  id: number;
  type: 'equal_division' | 'occupant_proration' | 'proportional_area' | 'consumption_adjustment' | 'fixed_fee'; // Tipos conocidos
  property: number; // ID de la propiedad a la que pertenece
  // Otros campos que pueda devolver el backend en el futuro
  created_at?: string;
  updated_at?: string;
}

export const RULE_TYPES = {
  EQUAL_DIVISION: 'equal_division',
  OCCUPANT_PRORATION: 'occupant_proration',
  PROPORTIONAL_AREA: 'proportional_area',
  CONSUMPTION_ADJUSTMENT: 'consumption_adjustment', // Para servicios con medidores
  FIXED_FEE: 'fixed_fee', // Para costos fijos
} as const; // Hace que el objeto sea inmutable y los valores de solo lectura

export const RULE_TYPE_LABELS = {
  [RULE_TYPES.EQUAL_DIVISION]: 'División Equitativa',
  [RULE_TYPES.OCCUPANT_PRORATION]: 'Prorrateo por Ocupante',
  [RULE_TYPES.PROPORTIONAL_AREA]: 'Ajuste Proporcional por Área',
  [RULE_TYPES.CONSUMPTION_ADJUSTMENT]: 'Ajuste por Consumo (Medidores)',
  [RULE_TYPES.FIXED_FEE]: 'Cuota Fija',
} as const;

// Estructura para las explicaciones blindadas
export interface IRuleExplanation {
  type: IRule['type'];
  title: string;
  description: string;
  usageExample: string;
  example: {
    situation: string;
    calculation: string;
    result: string;
  };
  adminNote: string;
}

// Datos de la explicación blindada para "División Equitativa"
export const EQUAL_DIVISION_EXPLANATION: IRuleExplanation = {
  type: RULE_TYPES.EQUAL_DIVISION,
  title: RULE_TYPE_LABELS[RULE_TYPES.EQUAL_DIVISION],
  description: 'Reparte el gasto en partes exactamente iguales entre todas las unidades.',
  usageExample: 'Perfecto para costos fijos y generales como "Gastos administrativos" o "Mantenimiento del jardín".',
  example: {
    situation: 'El gasto total de Arbitrios es S/ 176,76 para el mes. Hay 6 unidades activas en la propiedad.',
    calculation: '(S/ 176,76) / (6 unidades) = S/ 29,46 por unidad.',
    result: 'Cada unidad activa pagará S/ 29,46 por Arbitrios.',
  },
  adminNote: 'Asegúrese de que el número de unidades activas es correcto para el prorrateo.',
};

// Datos de la explicación para "Prorrateo por Ocupantes"
export const OCCUPANT_PRORATION_EXPLANATION: IRuleExplanation = {
  type: RULE_TYPES.OCCUPANT_PRORATION,
  title: RULE_TYPE_LABELS[RULE_TYPES.OCCUPANT_PRORATION],
  description: 'Reparte el gasto según la cantidad de personas que viven en cada unidad. Más personas, mayor parte del gasto.',
  usageExample: 'La forma más justa de dividir la factura general del agua, donde el consumo está directamente ligado al número de ocupantes.',
  example: {
    situation: 'El gasto total de Agua es S/ 150,00 para el mes. Unidades: A (1 ocupante), B (2 ocupantes), C (2 ocupantes). Total: 5 ocupantes.',
    calculation: 'A: (1/5) × S/ 150,00 = S/ 30,00. B: (2/5) × S/ 150,00 = S/ 60,00. C: (2/5) × S/ 150,00 = S/ 60,00.',
    result: 'Unidad A paga S/ 30,00, Unidades B y C pagan S/ 60,00 cada una.',
  },
  adminNote: 'Todas las unidades deben tener inquilinos asignados con número de ocupantes para usar esta regla.',
};

// Datos de la explicación para "Ajuste por Consumo Individual"
export const CONSUMPTION_ADJUSTMENT_EXPLANATION: IRuleExplanation = {
  type: RULE_TYPES.CONSUMPTION_ADJUSTMENT,
  title: RULE_TYPE_LABELS[RULE_TYPES.CONSUMPTION_ADJUSTMENT],
  description: 'Permite ingresar la lectura de un medidor individual para cada unidad. El sistema calculará la diferencia con el mes anterior y la asignará.',
  usageExample: 'Indispensable para la luz, cuando cada unidad tiene su propio medidor, pero hay un recibo general que gestionar.',
  example: {
    situation: 'Factura de luz: S/ 200. Suma de medidores: S/ 180. Medidores: A=S/ 60, B=S/ 60, C=S/ 60. Discrepancia: S/ 20.',
    calculation: 'Factor: 200/180 = 1.11. A: S/ 60 × 1.11 = S/ 66.67. B: S/ 60 × 1.11 = S/ 66.67. C: S/ 60 × 1.11 = S/ 66.66.',
    result: 'Cada unidad paga su consumo ajustado proporcionalmente.',
  },
  adminNote: 'Requiere que todas las unidades tengan medidores registrados en el sistema.',
};

// Datos de la explicación para "Ajuste Proporcional por Área"
export const PROPORTIONAL_AREA_EXPLANATION: IRuleExplanation = {
  type: RULE_TYPES.PROPORTIONAL_AREA,
  title: RULE_TYPE_LABELS[RULE_TYPES.PROPORTIONAL_AREA],
  description: 'Reparte el gasto según el tamaño (m²) de cada unidad. Unidades más grandes pagan una parte mayor.',
  usageExample: 'Ideal para impuestos municipales (arbitrios) o el mantenimiento de áreas comunes, donde el valor o impacto está ligado al área.',
  example: {
    situation: 'Arbitrios de S/ 300. Unidades: A (50m²), B (100m²), C (50m²). Total: 200m².',
    calculation: 'A: (50/200) × S/ 300 = S/ 75. B: (100/200) × S/ 300 = S/ 150. C: (50/200) × S/ 300 = S/ 75.',
    result: 'Unidad B paga S/ 150, Unidades A y C pagan S/ 75 cada una.',
  },
  adminNote: 'Requiere que todas las unidades tengan el área registrada en el sistema.',
};

// Datos de la explicación para "Cuota Fija"
export const FIXED_FEE_EXPLANATION: IRuleExplanation = {
  type: RULE_TYPES.FIXED_FEE,
  title: RULE_TYPE_LABELS[RULE_TYPES.FIXED_FEE],
  description: 'Asigna un monto fijo e idéntico a cada unidad, sin importar el gasto total.',
  usageExample: 'Excelente para cuotas de mantenimiento mensuales fijas o para servicios con una tarifa plana por unidad, como el "Mantenimiento del motor de la cisterna".',
  example: {
    situation: 'Costo mensual del motor de agua: S/ 120. Hay 4 unidades en la propiedad.',
    calculation: 'S/ 120 ÷ 4 unidades = S/ 30 por unidad.',
    result: 'Cada unidad paga exactamente S/ 30, sin variaciones.',
  },
  adminNote: 'El monto fijo debe ser configurado previamente en el sistema.',
};

// Array de todas las reglas disponibles y sus explicaciones
export const AVAILABLE_RULES_EXPLANATIONS: IRuleExplanation[] = [
  EQUAL_DIVISION_EXPLANATION,
  OCCUPANT_PRORATION_EXPLANATION,
  PROPORTIONAL_AREA_EXPLANATION,
  CONSUMPTION_ADJUSTMENT_EXPLANATION,
  FIXED_FEE_EXPLANATION,
];

// Función de validación para verificar si se puede usar prorrateo por ocupantes
export const canUseOccupantProration = (units: { tenant: { number_of_occupants: number } | null }[]): boolean => {
  return units.every(unit => 
    unit.tenant !== null && 
    unit.tenant.number_of_occupants > 0
  );
};