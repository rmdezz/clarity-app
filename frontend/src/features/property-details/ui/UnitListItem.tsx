import { IUnit } from '@/entities/unit/model/types';
import { Button } from '@/shared/ui/Button';
import { TenantDetails } from './TenantDetails';

interface UnitListItemProps {
  unit: IUnit;
  onAssignTenant: (unit: IUnit) => void;
}

export const UnitListItem = ({ unit, onAssignTenant }: UnitListItemProps) => {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg text-neutral-800">{unit.name}</h3>
        {/* Renderizado condicional basado en si la unidad tiene un inquilino */}
        {!unit.tenant && (
          <Button size="sm" onClick={() => onAssignTenant(unit)}>
            Asignar Inquilino
          </Button>
        )}
      </div>
      {unit.tenant ? (
        <TenantDetails tenant={unit.tenant} />
      ) : (
        <p className="text-sm text-neutral-500 mt-1">Vacante</p>
      )}
    </div>
  );
};