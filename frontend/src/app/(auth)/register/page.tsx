import { RegistrationForm } from '@/features/auth/ui/RegistrationForm';

export default function RegisterPage() {
  return (
    // Este div actúa como el 'Organismo: Contenedor del Formulario' de la maqueta SVG.
    // Usamos las clases de Tailwind para replicar el diseño.
    <div className="flex justify-center items-center min-h-screen bg-neutral-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-background rounded-2xl shadow-lg">
        <h1 className="text-center text-heading-1 text-neutral-900">
          Crear Cuenta
        </h1>
        <RegistrationForm />
      </div>
    </div>
  );
}