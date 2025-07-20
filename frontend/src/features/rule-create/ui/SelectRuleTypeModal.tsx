'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/shared/ui/Button';
import { AVAILABLE_RULES_EXPLANATIONS, IRule, canUseOccupantProration, RULE_TYPES } from '@/entities/rule/model/types';
import { RuleOptionItem } from './RuleOptionItem';
import { useCreateRule } from '../model/useCreateRule';
import { IUnit } from '@/entities/unit/model/types';

interface SelectRuleTypeModalProps {
  propertyId: string;
  units: IUnit[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const SelectRuleTypeModal = ({ propertyId, units, isOpen, onOpenChange }: SelectRuleTypeModalProps) => {
  const [selectedRuleType, setSelectedRuleType] = useState<IRule['type'] | null>('equal_division');
  const { mutate: createRule, isPending: isLoading } = useCreateRule(propertyId);

  // Verificar si se puede usar prorrateo por ocupantes
  const canUseOccupantProrationRule = canUseOccupantProration(units);

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
        onOpenChange(false);
      }
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Añadir Regla de Gasto</DialogTitle></DialogHeader>
        <div className="py-4 space-y-4">
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
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
          <Button onClick={handleConfirm} isLoading={isLoading} disabled={!selectedRuleType}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};