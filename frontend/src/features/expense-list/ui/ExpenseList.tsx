'use client';

import React from 'react';
import { ExternalLink, FileText, DollarSign, Calendar } from 'lucide-react';
import { useExpenses } from '@/entities/expense/model/hooks';
import { useTokenExpiredHandler } from '@/shared/hooks/useTokenExpiredHandler';
import { isTokenExpiredError } from '@/shared/lib/http-client';

interface ExpenseListProps {
  cycleId: string;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ cycleId }) => {
  const { data: expenses, isLoading, error } = useExpenses(cycleId);

  // Handle TokenExpiredError automatically
  useTokenExpiredHandler(error);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3 p-4 bg-gray-100 rounded-lg">
              <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-6 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && !isTokenExpiredError(error)) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <DollarSign className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-red-600 font-medium">Error al cargar gastos</p>
        <p className="text-sm text-gray-600 mt-1">
          {error instanceof Error ? error.message : 'Error desconocido'}
        </p>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No hay gastos registrados</p>
        <p className="text-sm text-gray-400 mt-1">
          Añade el primer gasto para este ciclo de facturación
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(num);
  };

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">
                {expense.service_type_display}
              </h4>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-lg font-semibold text-green-600">
                  {formatAmount(expense.total_amount)}
                </span>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(expense.created_at)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {expense.invoice_pdf_url && (
              <a
                href={expense.invoice_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 rounded-lg transition-colors"
                title="Ver factura PDF"
              >
                <FileText className="w-4 h-4" />
                <span>Ver PDF</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      ))}
      
      {/* Total */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">Total de Gastos:</span>
          <span className="text-xl font-bold text-gray-900">
            {formatAmount(
              expenses.reduce((total, expense) => total + parseFloat(expense.total_amount), 0).toString()
            )}
          </span>
        </div>
      </div>
    </div>
  );
};