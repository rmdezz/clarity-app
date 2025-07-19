import { ITenant } from '@/entities/tenant/model/types'; // Importar la nueva entidad

export interface IUnit {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  tenant: ITenant | null; // Añadir el campo de inquilino (puede ser nulo si está vacante)
}