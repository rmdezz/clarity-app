import { IUnit } from '@/entities/unit/model/types';

interface UnitListProps {
  units: IUnit[];
}

export const UnitList = ({ units }: UnitListProps) => {
  if (units.length === 0) {
    return (
      <div className="text-center text-neutral-500 py-10 px-6 bg-white rounded-lg border border-dashed">
        <p>Aún no hay unidades en esta propiedad.</p>
        <p className="text-sm mt-1">¡Añade la primera para empezar!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {units.map((unit) => (
        <div key={unit.id} className="bg-white p-4 rounded-lg border flex justify-between items-center transition-shadow hover:shadow-sm">
          <span className="font-medium text-neutral-800">{unit.name}</span>
        </div>
      ))}
    </div>
  );
};