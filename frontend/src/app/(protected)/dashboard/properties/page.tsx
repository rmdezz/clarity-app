import Link from 'next/link';

// Datos de ejemplo
const mockProperties = [
  { id: 1, name: 'Edificio Central', address: 'Calle Falsa 123' },
  { id: 2, name: 'Casa de Playa', address: 'Avenida Siempreviva 742' },
];

export default function PropertiesListPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900">Mis Propiedades</h1>
        <Link href="/dashboard/properties/new" className="bg-primary text-white px-4 py-2 rounded-md">
          Añadir Propiedad
        </Link>
      </div>
      
      <div className="space-y-4">
        {mockProperties.map((prop) => (
          <Link href={`/dashboard/properties/${prop.id}`} key={prop.id} className="block bg-white p-4 rounded-lg border transition-shadow hover:shadow-md">
            <h2 className="font-semibold text-lg text-neutral-800">{prop.name}</h2>
            <p className="text-sm text-neutral-500">{prop.address}</p>
          </Link>
        ))}
      </div>  
    </div>
  );
}