import apiClient from './api';
import type { ServiceProvider } from '../types/index';

export const providerService = {
  getAll: async (params?: {
    committee?: number;
    provider_type?: string;
    status?: string;
  }): Promise<ServiceProvider[]> => {
    const response = await apiClient.get('/providers/', { params });
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<ServiceProvider> => {
    const response = await apiClient.get(`/providers/${id}/`);
    return response.data;
  },

  create: async (data: any): Promise<ServiceProvider> => {
    const response = await apiClient.post('/providers/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<ServiceProvider>): Promise<ServiceProvider> => {
    const response = await apiClient.put(`/providers/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/providers/${id}/`);
  },

  updateStatus: async (id: number, status: string): Promise<ServiceProvider> => {
    const response = await apiClient.patch(`/providers/${id}/update_status/`, { status });
    return response.data;
  },
};
