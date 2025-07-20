'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/shared/ui/Button';
import { usePropertyDetails } from '@/features/property-details/model/usePropertyDetails';
import { useTokenExpiredHandler } from '@/shared/hooks/useTokenExpiredHandler';
import { isTokenExpiredError } from '@/shared/lib/http-client';
import { SERVICE_TYPES, SERVICE_LABELS, SERVICE_DESCRIPTIONS, ServiceType } from '@/entities/service/model/types';
import { getRulesForService, getRecommendedRuleForService } from '@/entities/service/model/service-rules';
import { RULE_TYPE_LABELS, canUseOccupantProration, RULE_TYPES } from '@/entities/rule/model/types';
import { usePropertyServiceConfiguration, useUpdateServiceConfiguration } from '@/features/service-configuration/model/usePropertyServiceConfiguration';
import { ChevronRight, Check, AlertTriangle, Settings, Lightbulb } from 'lucide-react';

interface ServiceRuleConfiguration {
  serviceType: ServiceType;
  selectedRule: string | null;
}

export default function PropertyServicesPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;
  
  const { data: property, isLoading, error } = usePropertyDetails(propertyId);
  const { data: currentConfiguration, isLoading: isLoadingConfig } = usePropertyServiceConfiguration(propertyId);
  const { mutate: updateConfiguration, isPending: isSaving } = useUpdateServiceConfiguration(propertyId);
  
  // Estado para la configuración de servicios
  const [serviceConfigurations, setServiceConfigurations] = useState<ServiceRuleConfiguration[]>(() => 
    Object.values(SERVICE_TYPES).map(serviceType => ({
      serviceType,
      selectedRule: getRecommendedRuleForService(serviceType), // Inicializar con regla recomendada
    }))
  );

  // Efecto para actualizar el estado local cuando se carga la configuración del servidor
  useEffect(() => {
    if (currentConfiguration) {
      // Crear un mapa de la configuración actual
      const configMap = new Map(
        currentConfiguration.map(config => [config.service_type, config.rule_type])
      );
      
      // Actualizar el estado local con la configuración del servidor
      setServiceConfigurations(prev => 
        prev.map(config => ({
          ...config,
          selectedRule: configMap.get(config.serviceType) || config.selectedRule
        }))
      );
    }
  }, [currentConfiguration]);

  // Handle TokenExpiredError automatically
  useTokenExpiredHandler(error);

  const handleRuleChange = (serviceType: ServiceType, ruleType: string) => {
    setServiceConfigurations(prev => 
      prev.map(config => 
        config.serviceType === serviceType 
          ? { ...config, selectedRule: ruleType }
          : config
      )
    );
  };

  const handleSave = () => {
    const serviceRules = serviceConfigurations
      .filter(config => config.selectedRule !== null)
      .map(config => ({
        service_type: config.serviceType,
        rule_type: config.selectedRule!,
      }));

    updateConfiguration(serviceRules, {
      onSuccess: () => {
        router.push(`/dashboard/properties/${propertyId}`);
      },
    });
  };

  const isValidConfiguration = () => {
    return serviceConfigurations.every(config => config.selectedRule !== null);
  };

  if (isLoading || isLoadingConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Cargando información de la propiedad...</p>
        </div>
      </div>
    );
  }

  if (error && !isTokenExpiredError(error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-medium text-slate-900">Error al cargar</h2>
          <p className="text-slate-600">No se pudo cargar la información de la propiedad</p>
          <Link href={`/dashboard/properties/${propertyId}`}>
            <Button variant="secondary">Volver a la propiedad</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Breadcrumb minimalista */}
        <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-8">
          <Link href="/dashboard/properties" className="hover:text-slate-700 transition-colors">
            Propiedades
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href={`/dashboard/properties/${propertyId}`} className="hover:text-slate-700 transition-colors">
            {property?.name}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium">Configuración de Servicios</span>
        </nav>

        {/* Header elegante */}
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Configuración de Servicios</h1>
              <p className="text-slate-600">
                {property?.name}
              </p>
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed max-w-2xl">
            Define las reglas de cálculo para cada servicio. Cada servicio puede usar una regla diferente según su naturaleza y características.
          </p>
        </div>

        {/* Configuraciones de servicios */}
        <div className="space-y-6 mb-10">
          {serviceConfigurations.map((config) => {
            const availableRules = getRulesForService(config.serviceType);
            const canUseOccupantRule = property ? canUseOccupantProration(property.units) : false;
            
            return (
              <div key={config.serviceType} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {/* Header del servicio */}
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-medium text-slate-900 mb-1">
                    {SERVICE_LABELS[config.serviceType]}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {SERVICE_DESCRIPTIONS[config.serviceType]}
                  </p>
                </div>

                {/* Selección de reglas */}
                <div className="p-6">
                  <label className="block text-sm font-medium text-slate-900 mb-4">
                    Regla de Cálculo
                  </label>
                  
                  <div className="space-y-3">
                    {availableRules.map((rule) => {
                      const isDisabled = rule.type === RULE_TYPES.OCCUPANT_PRORATION && !canUseOccupantRule;
                      const isRecommended = rule.type === getRecommendedRuleForService(config.serviceType);
                      const isSelected = config.selectedRule === rule.type;
                      
                      return (
                        <label
                          key={rule.type}
                          className={`
                            relative flex items-start p-4 rounded-lg border cursor-pointer transition-all duration-300
                            ${isSelected
                              ? 'border-slate-800 bg-slate-50 shadow-sm' 
                              : 'border-gray-200 hover:border-slate-300 hover:bg-gray-50'
                            }
                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          <input
                            type="radio"
                            name={`service-${config.serviceType}`}
                            value={rule.type}
                            checked={isSelected}
                            onChange={(e) => !isDisabled && handleRuleChange(config.serviceType, e.target.value)}
                            disabled={isDisabled}
                            className="sr-only"
                          />
                          
                          {/* Custom radio button */}
                          <div className={`
                            flex items-center justify-center w-5 h-5 rounded-full border-2 mr-3 mt-0.5 transition-all duration-300
                            ${isSelected 
                              ? 'border-slate-800 bg-slate-800' 
                              : 'border-gray-300'
                            }
                          `}>
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-slate-900">
                                {RULE_TYPE_LABELS[rule.type as keyof typeof RULE_TYPE_LABELS]}
                              </span>
                              {isRecommended && (
                                <span className="px-2 py-1 text-xs font-medium bg-slate-800 text-white rounded-full">
                                  Recomendado
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed mb-3">
                              {rule.description}
                            </p>
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                              <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-amber-800 leading-relaxed">
                                <span className="font-medium">Ejemplo de uso:</span> {rule.usageExample}
                              </p>
                            </div>
                            {isDisabled && (
                              <div className="mt-2 p-2 bg-red-50 rounded-md border border-red-200">
                                <p className="text-sm text-red-700">
                                  Para usar esta regla, todas las unidades deben tener el número de ocupantes asignado.
                                </p>
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botones de acción */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <Link href={`/dashboard/properties/${propertyId}`}>
              <Button variant="secondary" disabled={isSaving}>
                Cancelar
              </Button>
            </Link>
            
            <Button 
              onClick={handleSave} 
              isLoading={isSaving} 
              disabled={!isValidConfiguration()}
              className="bg-slate-800 hover:bg-slate-900 text-white"
            >
              Guardar Configuración
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}