import { useState } from 'react';
import { IUnit } from '@/entities/unit/model/types';
import { Button } from '@/shared/ui/Button';
import { TenantDetails } from './TenantDetails';
import { TenancyManagement } from '@/features/tenancy-management/ui/TenancyManagement';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Building2, Users } from 'lucide-react';

interface UnitListItemProps {
  unit: IUnit;
  onAssignTenant: (unit: IUnit) => void;
}

export const UnitListItem = ({ unit, onAssignTenant }: UnitListItemProps) => {
  const [isManagingTenancies, setIsManagingTenancies] = useState(false);

  return (
    <>
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-neutral-800">{unit.name}</h3>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setIsManagingTenancies(true)}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Gestionar Arrendamientos
            </Button>
            {/* Mantener el botón original para compatibilidad */}
            {!unit.tenant && (
              <Button size="sm" onClick={() => onAssignTenant(unit)}>
                Asignar Inquilino (Legacy)
              </Button>
            )}
          </div>
        </div>
        {unit.tenant ? (
          <TenantDetails tenant={unit.tenant} />
        ) : (
          <p className="text-sm text-neutral-500 mt-1">Vacante</p>
        )}
      </div>

      {/* Dialog para gestión de arrendamientos */}
      <Dialog 
        open={isManagingTenancies} 
        onOpenChange={setIsManagingTenancies}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Gestión de Arrendamientos - {unit.name}
            </DialogTitle>
          </DialogHeader>
          <TenancyManagement 
            unitId={unit.id}
            unitName={unit.name}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};