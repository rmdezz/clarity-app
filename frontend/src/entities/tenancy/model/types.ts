// frontend/src/entities/tenancy/model/types.ts

export interface Tenancy {
  id: number;
  unit: number;
  unit_name: string;
  tenant: number;
  tenant_name: string;
  tenant_email: string;
  number_of_occupants: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenancyCreateData {
  tenant: number;
  number_of_occupants: number;
  start_date: string;
  end_date?: string;
}

export interface TenancyUpdateData {
  number_of_occupants?: number;
  start_date?: string;
  end_date?: string;
}

export interface TenancyEndData {
  end_date: string;
}

export interface TenantOption {
  id: number;
  name: string;
  email: string;
}

export const TENANCY_STATUS = {
  ACTIVE: 'active',
  FINISHED: 'finished',
  FUTURE: 'future',
} as const;

export type TenancyStatus = typeof TENANCY_STATUS[keyof typeof TENANCY_STATUS];