import { IRule, RULE_TYPE_LABELS } from '@/entities/rule/model/types';

interface RuleListProps {
  rules: IRule[];
}

export const RuleList = ({ rules }: RuleListProps) => {
  if (rules.length === 0) {
    return (
      <div className="text-center text-neutral-500 py-10 px-6 bg-white rounded-lg border border-dashed">
        <p>Aún no hay reglas de gasto para esta propiedad.</p>
        <p className="text-sm mt-1">Añada una para empezar a automatizar sus gastos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <div key={rule.id} className="bg-white p-4 rounded-lg border flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg text-neutral-900">{RULE_TYPE_LABELS[rule.type]}</h3>
            <p className="text-sm text-neutral-500">Regla aplicada</p>
          </div>
          {/* Futuro: Botón para editar o eliminar la regla */}
        </div>
      ))}
    </div>
  );
};