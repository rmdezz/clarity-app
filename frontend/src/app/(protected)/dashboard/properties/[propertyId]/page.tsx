'use client';

import { usePropertyDetails } from '@/features/property-details/model/usePropertyDetails';
import { UnitList } from '@/features/property-details/ui/UnitList';
import { useParams } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import { useState } from 'react';
import { CreateUnitModal } from '@/features/unit-create/ui/CreateUnitModal';
import { AssignTenantModal } from '@/features/tenant-assign/ui/AssignTenantModal';
import Link from 'next/link';
import { isTokenExpiredError } from '@/shared/lib/http-client';
import { useTokenExpiredHandler } from '@/shared/hooks/useTokenExpiredHandler';
import { IUnit } from '@/entities/unit/model/types';

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.propertyId as string; 

  // El hook ya maneja un ID que puede ser undefined (con la opción 'enabled').
  const { data: property, isLoading, isError, error } = usePropertyDetails(propertyId!);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<IUnit | null>(null);

  // Handle TokenExpiredError automatically
  useTokenExpiredHandler(error);

  const handleAssignTenant = (unit: IUnit) => {
    setSelectedUnit(unit);
    setIsAssignModalOpen(true);
    console.log('Assign tenant to unit:', unit);
  };

  // --- CORRECCIÓN CLAVE ---
  // Si no tenemos un propertyId, no podemos renderizar la página.
  // Mostramos un estado de carga o error genérico.
  if (!propertyId) {
    return <div>Cargando...</div>;
  }
  
  if (isLoading) {
    return <div>Cargando detalles de la propiedad...</div>;
  }

  if (isError) {
    // Don't show TokenExpiredError in UI - it's handled globally
    if (isTokenExpiredError(error)) {
      return <div>Verificando sesión...</div>;
    }
    return <div>Error al cargar la propiedad: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/properties" className="text-sm text-primary hover:underline">
        ← Volver a Propiedades
      </Link>
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{property?.name}</h1>
          <p className="text-neutral-500">{property?.address}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Añadir Unidad</Button>
      </div>

      <UnitList units={property?.units || []} onAssignTenant={handleAssignTenant} />

      {/* Ahora estamos seguros de que `propertyId` es una string. */}
      <CreateUnitModal
        propertyId={propertyId}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
      
      <AssignTenantModal
        propertyId={propertyId}
        unit={selectedUnit}
        isOpen={isAssignModalOpen}
        onOpenChange={setIsAssignModalOpen}
      />
    </div>
  );
}