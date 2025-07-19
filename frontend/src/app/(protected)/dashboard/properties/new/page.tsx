'use client';

import { PropertyForm } from '@/features/property-create/ui/PropertyForm';
import { useCreateProperty } from '@/features/property-create/model/useCreateProperty';
import { FormServerError } from '@/shared/ui/FormServerError';
import { useRouter } from 'next/navigation';

export default function NewPropertyPage() {
  const { form, onSubmit, isLoading, serverError } = useCreateProperty();
  const router = useRouter();

  const handleCancel = () => {
    router.back(); // Vuelve a la página anterior, que sería el dashboard
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-heading-1 text-neutral-900 mb-6 text-center">Añadir Nueva Propiedad</h1>
        
        {serverError && <FormServerError message={serverError} />}

        <PropertyForm 
          form={form} 
          onSubmit={onSubmit} 
          isLoading={isLoading} 
          onCancel={handleCancel} 
        />
      </div>
    </div>
  );
}