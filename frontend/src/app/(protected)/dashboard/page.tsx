import Link from 'next/link';
import { Button } from '@/shared/ui/Button';

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8"> {/* Esto es el `main` del layout protegido */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          Panel de Control
        </h1>
        {/* [CA-05.2] Botón para navegar a la creación de propiedad */}
        <Link href="/dashboard/properties/new" passHref>
          <Button>Añadir Propiedad</Button>
        </Link>
      </div>
      <p className="text-neutral-600">
        Aquí se mostrará un resumen de sus propiedades y otras funcionalidades clave.
      </p>
      {/* El listado de propiedades se renderizará en /dashboard/properties */}
    </div>
  );
}