import apiClient from './api';
import type { Collection, Expense, FinanceSummary } from '../types/index';

export const financeService = {
  // Collections
  getCollections: async (params?: { committee?: number }): Promise<Collection[]> => {
    const response = await apiClient.get('/finance/collections/', { params });
    return response.data.results || response.data;
  },

  createCollection: async (data: any): Promise<Collection> => {
    const response = await apiClient.post('/finance/collections/', data);
    return response.data;
  },

  // Expenses
  getExpenses: async (params?: { committee?: number; status?: string }): Promise<Expense[]> => {
    const response = await apiClient.get('/finance/expenses/', { params });
    return response.data.results || response.data;
  },

  createExpense: async (data: any): Promise<Expense> => {
    const response = await apiClient.post('/finance/expenses/', data);
    return response.data;
  },

  approveExpense: async (id: number): Promise<Expense> => {
    const response = await apiClient.post(`/finance/expenses/${id}/approve/`);
    return response.data;
  },

  rejectExpense: async (id: number, reason?: string): Promise<Expense> => {
    const response = await apiClient.post(`/finance/expenses/${id}/reject/`, { reason });
    return response.data;
  },

  markExpensePaid: async (id: number): Promise<Expense> => {
    const response = await apiClient.post(`/finance/expenses/${id}/mark_paid/`);
    return response.data;
  },

  // Summary
  getSummary: async (committeeId: number): Promise<FinanceSummary> => {
    const response = await apiClient.get('/finance/summary/', {
      params: { committee: committeeId },
    });
    return response.data;
  },
};
