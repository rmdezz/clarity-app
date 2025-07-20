'use client';

import { IRuleExplanation } from '@/entities/rule/model/types';
import { Check, AlertTriangle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface RuleOptionItemProps {
  rule: IRuleExplanation;
  isSelected: boolean;
  onSelect: (ruleType: IRuleExplanation['type']) => void;
  isDisabled?: boolean;
  disabledReason?: string;
}

export const RuleOptionItem = ({ rule, isSelected, onSelect, isDisabled = false, disabledReason }: RuleOptionItemProps) => {
  const handleClick = () => {
    if (!isDisabled) {
      onSelect(rule.type);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={twMerge(
        "bg-white rounded-lg transition-all duration-300 h-full",
        isDisabled 
          ? "cursor-not-allowed opacity-50" 
          : "cursor-pointer hover:border-slate-300 hover:shadow-lg",
        "border border-gray-200",
        isSelected && !isDisabled && "border-slate-800 shadow-md ring-2 ring-slate-200"
      )}
      role="radio"
      aria-checked={isSelected}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={(e) => !isDisabled && (e.key === ' ' || e.key === 'Enter') && onSelect(rule.type)}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className={twMerge(
            "text-lg font-medium",
            isSelected ? "text-slate-900" : "text-gray-900"
          )}>
            {rule.title}
          </h3>
          
          {isSelected && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="px-6 pb-6 space-y-5 border-t border-gray-100">
        {/* Descripción */}
        <div className="pt-5">
          <h4 className="font-medium text-slate-900 mb-2">Descripción</h4>
          <p className="text-gray-700 leading-relaxed">
            {rule.description}
          </p>
        </div>

        {/* Ejemplo */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Ejemplo</h4>
          <div className="p-4 bg-gray-50 rounded-md border border-gray-100">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-slate-800">Situación:</span>
                <span className="ml-2 text-gray-700">{rule.example.situation}</span>
              </div>
              <div>
                <span className="font-medium text-slate-800">Cálculo:</span>
                <span className="ml-2 text-gray-700 font-mono">{rule.example.calculation}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">Resultado:</span>
                <span className="ml-2 font-medium text-slate-800">{rule.example.result}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nota de administrador */}
        <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-600" />
            <div>
              <h4 className="font-medium text-slate-900 mb-1">
                Nota para el administrador
              </h4>
              <p className="text-slate-700 text-sm leading-relaxed">
                {rule.adminNote}
              </p>
            </div>
          </div>
        </div>

        {/* Mensaje de error si está deshabilitado */}
        {isDisabled && disabledReason && (
          <div className="p-4 bg-red-50 rounded-md border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">
                  No disponible
                </h4>
                <p className="text-red-700 text-sm leading-relaxed">
                  {disabledReason}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};