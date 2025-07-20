// Tipos para ciclos de facturación
export interface IBillingCycle {
  id: number;
  property: number;
  property_name: string;
  month: number;
  year: number;
  status: BillingCycleStatus;
  status_display: string;
  created_at: string;
  updated_at: string;
}

// Estados posibles de un ciclo de facturación
export type BillingCycleStatus = 'open' | 'in_review' | 'closed';

// Interface para crear un nuevo ciclo
export interface ICreateBillingCycle {
  month: number;
  year: number;
}

// Interface para el payload completo con property_id
export interface ICreateBillingCyclePayload extends ICreateBillingCycle {
  propertyId: string;
}

// Constantes para meses
export const MONTHS = {
  1: 'Enero',
  2: 'Febrero', 
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre'
} as const;

// Helper para obtener nombre del mes
export const getMonthName = (month: number): string => {
  return MONTHS[month as keyof typeof MONTHS] || `Mes ${month}`;
};

// Helper para validar si una fecha es futura
export const isFutureDate = (month: number, year: number): boolean => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
  const currentYear = now.getFullYear();
  
  return year > currentYear || (year === currentYear && month > currentMonth);
};

// Helper para generar opciones de meses válidos
export const getValidMonthOptions = (): Array<{ value: number; label: string }> => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  const options: Array<{ value: number; label: string }> = [];
  
  // Agregar meses del año actual hasta el mes actual
  for (let month = 1; month <= currentMonth; month++) {
    options.push({
      value: month,
      label: getMonthName(month)
    });
  }
  
  return options;
};

// Helper para generar opciones de años válidos
export const getValidYearOptions = (): Array<{ value: number; label: string }> => {
  const currentYear = new Date().getFullYear();
  const options: Array<{ value: number; label: string }> = [];
  
  // Últimos 5 años incluyendo el actual
  for (let year = currentYear; year >= currentYear - 4; year--) {
    options.push({
      value: year,
      label: year.toString()
    });
  }
  
  return options;
};