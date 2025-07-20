'use client';

import React, { useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCreateExpense } from '@/entities/expense/model/hooks';
import { SERVICE_TYPES, ServiceType } from '@/entities/expense/model/types';

interface ExpenseCreateFormProps {
  cycleId: string;
  disabled?: boolean;
}

export const ExpenseCreateForm: React.FC<ExpenseCreateFormProps> = ({
  cycleId,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>('electricity');
  const [totalAmount, setTotalAmount] = useState('');
  const [invoicePdf, setInvoicePdf] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const createExpenseMutation = useCreateExpense(cycleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoicePdf || !totalAmount) {
      return;
    }

    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    try {
      await createExpenseMutation.mutateAsync({
        service_type: serviceType,
        total_amount: amount,
        invoice_pdf: invoicePdf,
      });

      // Reset form
      setServiceType('electricity');
      setTotalAmount('');
      setInvoicePdf(null);
      setIsOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type === 'application/pdf') {
      setInvoicePdf(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setInvoicePdf(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Gasto</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Gasto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Servicio */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tipo de Servicio *
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {Object.entries(SERVICE_TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Monto Total */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Monto Total *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Archivo PDF */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Factura Original (PDF) *
            </label>
            
            {!invoicePdf ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Arrastra tu archivo PDF aquí o
                </p>
                <label className="inline-block bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                  Seleccionar archivo
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    required
                  />
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                    <span className="text-red-600 text-xs font-medium">PDF</span>
                  </div>
                  <span className="text-sm text-gray-700 truncate">
                    {invoicePdf.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createExpenseMutation.isPending || !invoicePdf || !totalAmount}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createExpenseMutation.isPending ? 'Creando...' : 'Crear Gasto'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};