// frontend/src/features/tenancy-management/ui/TenancyList.tsx

'use client';

import { useState } from 'react';
import { Tenancy } from '@/entities/tenancy/model/types';
import { useEndTenancy } from '@/entities/tenancy/model/hooks';
import { TenancyEditForm } from './TenancyEditForm';
import { Button } from '@/shared/ui/Button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit, Calendar } from 'lucide-react';

interface TenancyListProps {
  tenancies: Tenancy[];
  showActiveOnly?: boolean;
}

export function TenancyList({ tenancies, showActiveOnly = false }: TenancyListProps) {
  const [editingTenancy, setEditingTenancy] = useState<Tenancy | null>(null);
  const [endingTenancy, setEndingTenancy] = useState<Tenancy | null>(null);
  const [endDate, setEndDate] = useState<string>('');

  const endTenancyMutation = useEndTenancy();

  const filteredTenancies = showActiveOnly 
    ? tenancies.filter(t => t.is_active)
    : tenancies;

  const handleEndTenancy = async () => {
    if (!endingTenancy || !endDate) return;

    try {
      await endTenancyMutation.mutateAsync({
        tenancyId: endingTenancy.id,
        data: { end_date: endDate }
      });
      setEndingTenancy(null);
      setEndDate('');
    } catch (error) {
      console.error('Error ending tenancy:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (filteredTenancies.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {showActiveOnly 
          ? 'No hay arrendamientos activos en esta unidad'
          : 'No hay arrendamientos registrados en esta unidad'
        }
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {filteredTenancies.map((tenancy) => (
          <div key={tenancy.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-lg">{tenancy.tenant_name}</h4>
                <p className="text-gray-600">{tenancy.tenant_email}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setEditingTenancy(tenancy)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                {tenancy.is_active && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEndingTenancy(tenancy);
                      setEndDate(new Date().toISOString().split('T')[0]);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Finalizar
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Ocupantes:</span>
                <p>{tenancy.number_of_occupants}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Inicio:</span>
                <p>{formatDate(tenancy.start_date)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Fin:</span>
                <p>{tenancy.end_date ? formatDate(tenancy.end_date) : 'Activo'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Estado:</span>
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                  tenancy.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tenancy.is_active ? 'Activo' : 'Finalizado'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog para editar arrendamiento */}
      <Dialog 
        open={!!editingTenancy} 
        onOpenChange={(open) => !open && setEditingTenancy(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Arrendamiento</DialogTitle>
          </DialogHeader>
          {editingTenancy && (
            <TenancyEditForm
              tenancy={editingTenancy}
              onSuccess={() => setEditingTenancy(null)}
              onCancel={() => setEditingTenancy(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para finalizar arrendamiento */}
      <Dialog 
        open={!!endingTenancy} 
        onOpenChange={(open) => {
          if (!open) {
            setEndingTenancy(null);
            setEndDate('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Arrendamiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              ¿Está seguro de que desea finalizar el arrendamiento de{' '}
              <strong>{endingTenancy?.tenant_name}</strong>?
            </p>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium mb-2">
                Fecha de finalización:
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEndingTenancy(null);
                  setEndDate('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleEndTenancy}
                disabled={!endDate || endTenancyMutation.isPending}
              >
                {endTenancyMutation.isPending ? 'Finalizando...' : 'Finalizar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}