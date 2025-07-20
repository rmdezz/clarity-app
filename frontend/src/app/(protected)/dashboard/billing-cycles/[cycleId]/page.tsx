'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useBillingCycleDetails } from '@/entities/billing-cycle/model/hooks';
import { getMonthName } from '@/entities/billing-cycle/model/types';
import { useTokenExpiredHandler } from '@/shared/hooks/useTokenExpiredHandler';
import { isTokenExpiredError } from '@/shared/lib/http-client';
import { Calendar, ArrowLeft, Settings, DollarSign, FileText } from 'lucide-react';
import { ExpenseCreateForm } from '@/features/expense-create/ui/ExpenseCreateForm';
import { ExpenseList } from '@/features/expense-list/ui/ExpenseList';

export default function BillingCycleDetailPage() {
  const params = useParams();
  const cycleId = params.cycleId as string;

  const { data: cycle, isLoading, error } = useBillingCycleDetails(cycleId);

  // Handle TokenExpiredError automatically
  useTokenExpiredHandler(error);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Cargando ciclo de facturación...</p>
        </div>
      </div>
    );
  }

  if (error && !isTokenExpiredError(error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-medium text-gray-900">Error al cargar</h2>
          <p className="text-gray-600">No se pudo cargar el ciclo de facturación</p>
          <Link href="/dashboard/properties" className="text-blue-600 hover:text-blue-800 underline">
            Volver a Propiedades
          </Link>
        </div>
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto" />
          <h2 className="text-xl font-medium text-gray-900">Ciclo no encontrado</h2>
          <p className="text-gray-600">El ciclo de facturación solicitado no existe</p>
          <Link href="/dashboard/properties" className="text-blue-600 hover:text-blue-800 underline">
            Volver a Propiedades
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link href="/dashboard/properties" className="hover:text-gray-700 transition-colors">
            Propiedades
          </Link>
          <span>/</span>
          <Link 
            href={`/dashboard/properties/${cycle.property}`} 
            className="hover:text-gray-700 transition-colors"
          >
            {cycle.property_name}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">
            {getMonthName(cycle.month)} {cycle.year}
          </span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Ciclo de {getMonthName(cycle.month)} {cycle.year}
                </h1>
                <p className="text-gray-600 mt-1">{cycle.property_name}</p>
                <div className="flex items-center space-x-3 mt-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    cycle.status === 'open' 
                      ? 'bg-green-100 text-green-800'
                      : cycle.status === 'in_review'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {cycle.status_display}
                  </span>
                  <span className="text-sm text-gray-500">
                    Creado: {new Date(cycle.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>
            <Link 
              href={`/dashboard/properties/${cycle.property}`}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la propiedad</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gastos del Ciclo - Main Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Gastos del Ciclo</h3>
                      <p className="text-sm text-gray-600">Gestión de gastos mensuales</p>
                    </div>
                  </div>
                  <ExpenseCreateForm 
                    cycleId={cycleId} 
                    disabled={cycle?.status !== 'open'} 
                  />
                </div>
              </div>
              <div className="p-6">
                <ExpenseList cycleId={cycleId} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Distribución de Costos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Distribución</h3>
                  <p className="text-sm text-gray-600">Aplicar reglas de prorrateo</p>
                </div>
              </div>
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Funcionalidad próximamente</p>
              </div>
            </div>

            {/* Reportes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Reportes</h3>
                  <p className="text-sm text-gray-600">Resúmenes y estados de cuenta</p>
                </div>
              </div>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Funcionalidad próximamente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                Detalle del Ciclo de {getMonthName(cycle.month)} {cycle.year}
              </h4>
              <p className="text-blue-800 text-sm leading-relaxed">
                Este es un placeholder para el futuro motor de facturación. Aquí podrás gestionar todos los gastos 
                del mes, aplicar las reglas de distribución configuradas para cada servicio, y generar los estados 
                de cuenta individuales para cada unidad de la propiedad.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-900">ID del Ciclo:</span>
                  <span className="ml-2 text-blue-800">#{cycle.id}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-900">Estado:</span>
                  <span className="ml-2 text-blue-800">{cycle.status_display}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-900">Última actualización:</span>
                  <span className="ml-2 text-blue-800">
                    {new Date(cycle.updated_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}