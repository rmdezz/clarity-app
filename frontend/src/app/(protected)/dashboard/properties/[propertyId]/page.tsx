'use client';

import { useParams } from 'next/navigation';
import { usePropertyDetails } from '@/features/property-details/model/usePropertyDetails';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnitList } from '@/features/property-details/ui/UnitList';
import { usePropertyServiceConfiguration } from '@/features/service-configuration/model/usePropertyServiceConfiguration';
import { useBillingCycles } from '@/entities/billing-cycle/model/hooks';
import { getMonthName } from '@/entities/billing-cycle/model/types';
import { Button } from '@/shared/ui/Button';
import { useState } from 'react';
import { AssignTenantModal } from '@/features/tenant-assign/ui/AssignTenantModal';
import { CreateBillingCycleModal } from '@/features/billing-cycle/ui/CreateBillingCycleModal';
import { IUnit } from '@/entities/unit/model/types';
import { useTokenExpiredHandler } from '@/shared/hooks/useTokenExpiredHandler';
import { isTokenExpiredError } from '@/shared/lib/http-client';
import { useRouter } from 'next/navigation';
import { Calendar, Plus, ChevronRight } from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;

  const router = useRouter();
  const { data: property, isLoading: isLoadingProperty, error: propertyError } = usePropertyDetails(propertyId);
  const { data: serviceConfiguration, isLoading: isLoadingConfig, error: configError } = usePropertyServiceConfiguration(propertyId);
  const { data: billingCycles, isLoading: isLoadingCycles, error: cyclesError } = useBillingCycles(propertyId);
  
  const [unitToAssignTenant, setUnitToAssignTenant] = useState<IUnit | null>(null);
  const [isCreateCycleModalOpen, setIsCreateCycleModalOpen] = useState(false);

  // Handle TokenExpiredError automatically for all queries
  useTokenExpiredHandler(propertyError);
  useTokenExpiredHandler(configError);
  useTokenExpiredHandler(cyclesError);

  if (isLoadingProperty || isLoadingConfig || isLoadingCycles) {
    return <div>Cargando...</div>;
  }

  if (propertyError && !isTokenExpiredError(propertyError)) {
    return <div>Error al cargar la propiedad: {propertyError.message}</div>;
  }

  // Don't block the page if rules endpoint doesn't exist yet
  
  return (
    <div className="space-y-6">
      <Link href="/dashboard/properties" className="text-sm text-primary hover:underline">← Volver a Propiedades</Link>
      <h1 className="text-2xl font-bold text-center text-neutral-900">{property?.name}</h1>
      <Tabs defaultValue="units" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="units">Unidades</TabsTrigger>
          <TabsTrigger value="rules">Servicios</TabsTrigger>
          <TabsTrigger value="billing">Ciclos de Facturación</TabsTrigger>
        </TabsList>
        <TabsContent value="units" className="mt-6">
          <UnitList 
            units={property?.units || []} 
            onAssignTenant={(unit) => setUnitToAssignTenant(unit)} 
          />
        </TabsContent>
        <TabsContent value="rules" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Configuración de Servicios</h2>
            <Link href={`/dashboard/properties/${propertyId}/services`}>
              <Button>Configurar Servicios</Button>
            </Link>
          </div>
          {configError ? (
            <div className="text-center text-gray-500 py-8">
              Error al cargar la configuración de servicios.
            </div>
          ) : serviceConfiguration && serviceConfiguration.length > 0 ? (
            <div className="space-y-3">
              {serviceConfiguration.map((config) => (
                <div key={config.service_type} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{config.service_type}</span>
                    <span className="text-sm text-gray-600 capitalize">{config.rule_type.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No hay configuración de servicios. Usa el botón "Configurar Servicios" para establecer las reglas.
            </div>
          )}
        </TabsContent>
        <TabsContent value="billing" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Ciclos de Facturación</h2>
            <Button
              onClick={() => setIsCreateCycleModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Iniciar Nuevo Ciclo</span>
            </Button>
          </div>

          {cyclesError ? (
            <div className="text-center text-gray-500 py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>Error al cargar los ciclos de facturación.</p>
            </div>
          ) : billingCycles && billingCycles.length > 0 ? (
            <div className="grid gap-4">
              {billingCycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/dashboard/billing-cycles/${cycle.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getMonthName(cycle.month)} {cycle.year}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Estado: <span className="capitalize">{cycle.status_display}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Creado: {new Date(cycle.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cycle.status === 'open' 
                          ? 'bg-green-100 text-green-800'
                          : cycle.status === 'in_review'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {cycle.status_display}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay ciclos de facturación
              </h3>
              <p className="text-gray-600 mb-6">
                Inicia tu primer ciclo de facturación para comenzar a gestionar los gastos mensuales.
              </p>
              <Button
                onClick={() => setIsCreateCycleModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Iniciar Primer Ciclo</span>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AssignTenantModal
        propertyId={propertyId}
        unit={unitToAssignTenant}
        isOpen={!!unitToAssignTenant}
        onOpenChange={(isOpen) => !isOpen && setUnitToAssignTenant(null)}
      />

      <CreateBillingCycleModal
        propertyId={propertyId}
        propertyName={property?.name || ''}
        isOpen={isCreateCycleModalOpen}
        onClose={() => setIsCreateCycleModalOpen(false)}
        onSuccess={(cycleId) => {
          // Redirigir al detalle del ciclo recién creado
          router.push(`/dashboard/billing-cycles/${cycleId}`);
        }}
      />
    </div>
  );
}