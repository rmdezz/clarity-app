import { httpClient } from '@/shared/lib/http-client';
import { IServiceRule, IPropertyServiceConfiguration } from '@/entities/service/model/types';

// Obtener configuración de servicios para una propiedad
export const getPropertyServiceConfiguration = (propertyId: string): Promise<IPropertyServiceConfiguration> => {
  return httpClient.get<IPropertyServiceConfiguration>(`/api/properties/${propertyId}/service-configuration/`);
};

// Crear o actualizar configuración de servicio específico
export const createOrUpdateServiceRule = (params: {
  propertyId: string;
  serviceType: string;
  ruleType: string;
}): Promise<IServiceRule> => {
  return httpClient.post<IServiceRule>(
    `/api/properties/${params.propertyId}/service-rules/`,
    {
      service_type: params.serviceType,
      rule_type: params.ruleType,
    }
  );
};

// Actualizar configuración completa de servicios
export const updatePropertyServiceConfiguration = (params: {
  propertyId: string;
  serviceRules: Array<{ service_type: string; rule_type: string }>;
}): Promise<IPropertyServiceConfiguration> => {
  return httpClient.put<IPropertyServiceConfiguration>(
    `/api/properties/${params.propertyId}/service-configuration/`,
    params.serviceRules
  );
};