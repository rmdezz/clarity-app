'use client';

import { usePropertyDetails } from '@/features/property-details/model/usePropertyDetails';
import { UnitList } from '@/features/property-details/ui/UnitList';
import { useParams } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import { useState } from 'react';
import { CreateUnitModal } from '@/features/unit-create/ui/CreateUnitModal';
import Link from 'next/link';

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.propertyId as string; 

  // El hook ya maneja un ID que puede ser undefined (con la opción 'enabled').
  const { data: property, isLoading, isError, error } = usePropertyDetails(propertyId!);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      <UnitList units={property?.units || []} />

      {/* Ahora estamos seguros de que `propertyId` es una string. */}
      <CreateUnitModal
        propertyId={propertyId}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}