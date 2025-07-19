import Link from 'next/link';
import { IPropertyListItem } from '@/entities/property/model/types';

interface PropertyListProps {
  properties: IPropertyListItem[];
}

export const PropertyList = ({ properties }: PropertyListProps) => {
  if (properties.length === 0) {
    return (
      <div className="text-center text-neutral-500 py-10 px-6 bg-white rounded-lg border border-dashed">
        <p>Aún no tienes propiedades registradas.</p>
        <p className="text-sm mt-1">Utiliza el botón "Añadir Propiedad" para empezar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {properties.map((prop) => (
        <Link 
          href={`/dashboard/properties/${prop.id}`} 
          key={prop.id} 
          className="block bg-white p-4 rounded-lg border transition-shadow hover:shadow-md"
        >
          <h2 className="font-semibold text-lg text-neutral-800">{prop.name}</h2>
          <p className="text-sm text-neutral-500">{prop.address}</p>
        </Link>
      ))}
    </div>
  );
};