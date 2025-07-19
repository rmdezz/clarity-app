import { IUnit } from '@/entities/unit/model/types';

export interface IProperty {
  id: number;
  name: string;
  address: string;
  user: number;
  created_at: string;
  updated_at: string;
  units: IUnit[]; // Añadir el array de unidades
}