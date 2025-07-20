'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/Button';
import { useCreateBillingCycle } from '@/entities/billing-cycle/model/hooks';
import { getValidMonthOptions, getValidYearOptions, getMonthName, isFutureDate } from '@/entities/billing-cycle/model/types';
import { X, Calendar, AlertTriangle } from 'lucide-react';

interface CreateBillingCycleModalProps {
  propertyId: string;
  propertyName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (cycleId: number) => void;
}

export const CreateBillingCycleModal = ({
  propertyId,
  propertyName,
  isOpen,
  onClose,
  onSuccess
}: CreateBillingCycleModalProps) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [validationError, setValidationError] = useState<string>('');

  const { mutate: createCycle, isPending } = useCreateBillingCycle(propertyId);

  // Opciones para selectores
  const monthOptions = getValidMonthOptions();
  const yearOptions = getValidYearOptions();

  // Limpiar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedMonth(0);
      setSelectedYear(0);
      setValidationError('');
    }
  }, [isOpen]);

  // Validar selección en tiempo real
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      if (isFutureDate(selectedMonth, selectedYear)) {
        setValidationError('No se pueden crear ciclos para fechas futuras.');
      } else {
        setValidationError('');
      }
    }
  }, [selectedMonth, selectedYear]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!selectedMonth || !selectedYear) {
      setValidationError('Por favor seleccione mes y año.');
      return;
    }

    if (isFutureDate(selectedMonth, selectedYear)) {
      setValidationError('No se pueden crear ciclos para fechas futuras.');
      return;
    }

    // Crear ciclo
    createCycle(
      { month: selectedMonth, year: selectedYear },
      {
        onSuccess: (newCycle) => {
          onClose();
          if (onSuccess) {
            onSuccess(newCycle.id);
          }
        }
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Iniciar Nuevo Ciclo</h2>
              <p className="text-sm text-gray-600">{propertyName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Descripción */}
            <div className="text-sm text-gray-600">
              Selecciona el mes y año para crear un nuevo ciclo de facturación. 
              No se pueden crear ciclos para fechas futuras.
            </div>

            {/* Selector de Año */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                disabled={isPending}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:opacity-50"
              >
                <option value={0}>Seleccionar año...</option>
                {yearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Mes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mes
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                disabled={isPending || !selectedYear}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:opacity-50"
              >
                <option value={0}>Seleccionar mes...</option>
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {!selectedYear && (
                <p className="mt-1 text-xs text-gray-500">
                  Primero seleccione un año
                </p>
              )}
            </div>

            {/* Vista previa */}
            {selectedMonth && selectedYear && !validationError && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Se creará el ciclo: {getMonthName(selectedMonth)} {selectedYear}
                  </span>
                </div>
              </div>
            )}

            {/* Error de validación */}
            {validationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">{validationError}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedMonth || !selectedYear || !!validationError}
              isLoading={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Crear Ciclo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};