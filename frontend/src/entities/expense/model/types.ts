// frontend/src/entities/expense/model/types.ts

export interface Expense {
  id: number;
  billing_cycle: number;
  service_type: string;
  service_type_display: string;
  total_amount: string;
  invoice_pdf: string;
  invoice_pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreateData {
  service_type: string;
  total_amount: number;
  invoice_pdf: File;
}

export const SERVICE_TYPES = {
  electricity: 'Luz',
  water: 'Agua',
  arbitrios: 'Arbitrios',
  motor: 'Motor',
  maintenance: 'Mantenimiento',
  gas: 'Gas',
} as const;

export type ServiceType = keyof typeof SERVICE_TYPES;