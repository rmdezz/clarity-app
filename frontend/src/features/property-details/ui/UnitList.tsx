import { IUnit } from '@/entities/unit/model/types';
import { UnitListItem } from './UnitListItem';

interface UnitListProps {
  units: IUnit[];
  onAssignTenant: (unit: IUnit) => void;
}

export const UnitList = ({ units, onAssignTenant  }: UnitListProps) => {
  if (units.length === 0) {
    return (
      <div className="text-center text-neutral-500 py-10 px-6 bg-white rounded-lg border border-dashed">
        <p>Aún no hay unidades en esta propiedad.</p>
        <p className="text-sm mt-1">¡Añade la primera para empezar!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {units.map((unit) => (
        <UnitListItem key={unit.id} unit={unit} onAssignTenant={onAssignTenant} />
      ))}
    </div>
  );
};