'use client'; // Necesario para usar hooks como useProperties

import Link from 'next/link';
import { Button } from '@/shared/ui/Button';
import { useProperties } from '@/features/property-list/model/useProperties'; // Nuestro nuevo hook
import { PropertyList } from '@/features/property-list/ui/PropertyList'; // Nuestro nuevo componente
import { FormServerError } from '@/shared/ui/FormServerError'; // Para mostrar errores
import { isTokenExpiredError } from '@/shared/lib/http-client';
import { useTokenExpiredHandler } from '@/shared/hooks/useTokenExpiredHandler';

export default function PropertiesListPage() {
  const { data: properties, isLoading, isError, error } = useProperties();
  
  // Handle TokenExpiredError automatically
  useTokenExpiredHandler(error);

  if (isLoading) {
    return <div>Cargando propiedades...</div>; // Considerar un Spinner aquí
  }

  if (isError) {
    // Don't show TokenExpiredError in UI - it's handled globally
    if (isTokenExpiredError(error)) {
      return <div>Verificando sesión...</div>;
    }
    return <FormServerError message={`Error al cargar las propiedades: ${error.message}`} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900">Mis Propiedades</h1>
        <Link href="/dashboard/properties/new" passHref>
          <Button>Añadir Propiedad</Button>
        </Link>
      </div>
      
      <PropertyList properties={properties || []} />
    </div>
  );
}