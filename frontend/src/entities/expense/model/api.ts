// frontend/src/entities/expense/model/api.ts

import { httpClient } from '@/shared/lib/http-client';
import { Expense, ExpenseCreateData } from './types';

export const expenseApi = {
  getExpenses: async (cycleId: string): Promise<Expense[]> => {
    return httpClient.get(`/api/billing-cycles/${cycleId}/expenses/`);
  },

  createExpense: async (cycleId: string, data: ExpenseCreateData): Promise<Expense> => {
    const formData = new FormData();
    formData.append('service_type', data.service_type);
    formData.append('total_amount', data.total_amount.toString());
    formData.append('invoice_pdf', data.invoice_pdf);

    return httpClient.post(`/api/billing-cycles/${cycleId}/expenses/`, formData);
  },
};