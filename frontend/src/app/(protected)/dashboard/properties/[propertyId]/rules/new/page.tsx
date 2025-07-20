'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/shared/ui/Button';
import { AVAILABLE_RULES_EXPLANATIONS, IRule, canUseOccupantProration, RULE_TYPES } from '@/entities/rule/model/types';
import { RuleOptionItem } from '@/features/rule-create/ui/RuleOptionItem';
import { useCreateRule } from '@/features/rule-create/model/useCreateRule';
import { usePropertyDetails } from '@/features/property-details/model/usePropertyDetails';
import { useTokenExpiredHandler } from '@/shared/hooks/useTokenExpiredHandler';
import { isTokenExpiredError } from '@/shared/lib/http-client';

export default function NewRulePage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;
  
  const [selectedRuleType, setSelectedRuleType] = useState<IRule['type'] | null>(null);
  
  const { data: property, isLoading, error } = usePropertyDetails(propertyId);
  const { mutate: createRule, isPending: isCreating } = useCreateRule(propertyId);

  // Handle TokenExpiredError automatically
  useTokenExpiredHandler(error);

  const canUseOccupantProrationRule = property ? canUseOccupantProration(property.units) : false;

  const handleRuleSelect = (ruleType: IRule['type']) => {
    // Si es prorrateo por ocupantes y no se puede usar, no permitir selección
    if (ruleType === RULE_TYPES.OCCUPANT_PRORATION && !canUseOccupantProrationRule) {
      return;
    }
    setSelectedRuleType(ruleType);
  };

  const handleConfirm = () => {
    if (!selectedRuleType) return;
    
    createRule({ type: selectedRuleType }, {
      onSuccess: () => {
        router.push(`/dashboard/properties/${propertyId}`);
      }
    });
  };

  const handleCancel = () => {
    router.push(`/dashboard/properties/${propertyId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Cargando información de la propiedad...</p>
      </div>
    );
  }

  if (error && !isTokenExpiredError(error)) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error al cargar la propiedad: {error.message}</p>
        <Link href={`/dashboard/properties/${propertyId}`} className="text-primary hover:underline">
          ← Volver a la propiedad
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Link href="/dashboard/properties" className="hover:text-primary">
          Propiedades
        </Link>
        <span>/</span>
        <Link href={`/dashboard/properties/${propertyId}`} className="hover:text-primary">
          {property?.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Nueva Regla</span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Añadir Regla de Gasto</h1>
        <p className="text-gray-600">
          Selecciona el tipo de regla que mejor se adapte al gasto que quieres gestionar para <strong>{property?.name}</strong>.
        </p>
      </div>

      {/* Rule Options */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2">
        {AVAILABLE_RULES_EXPLANATIONS.map((rule) => {
          const isDisabled = rule.type === RULE_TYPES.OCCUPANT_PRORATION && !canUseOccupantProrationRule;
          
          return (
            <RuleOptionItem
              key={rule.type}
              rule={rule}
              isSelected={selectedRuleType === rule.type}
              onSelect={handleRuleSelect}
              isDisabled={isDisabled}
              disabledReason={isDisabled ? "Para usar esta regla, todas las unidades deben tener el número de ocupantes asignado." : undefined}
            />
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button 
          variant="secondary" 
          onClick={handleCancel}
          disabled={isCreating}
        >
          Cancelar
        </Button>
        
        <Button 
          onClick={handleConfirm} 
          isLoading={isCreating} 
          disabled={!selectedRuleType}
        >
          Crear Regla
        </Button>
      </div>
    </div>
  );
}