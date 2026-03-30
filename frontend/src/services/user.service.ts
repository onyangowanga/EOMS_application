import apiClient from './api';
import type { User } from '../types';

export interface CreateUserRequest {
  full_name: string;
  phone: string;
  email?: string;
  role?: 'ADMIN' | 'LEADER' | 'MEMBER' | 'FINANCE' | 'STAKEHOLDER';
}

export const userService = {
  /**
   * Get all users
   */
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get('/users/');
    return response.data.results || response.data;
  },

  /**
   * Get a single user by ID
   */
  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get(`/users/${id}/`);
    return response.data;
  },

  /**
   * Create a new user
   */
  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post('/users/', data);
    return response.data;
  },

  /**
   * Update a user
   */
  update: async (id: number, data: Partial<CreateUserRequest>): Promise<User> => {
    const response = await apiClient.patch(`/users/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a user
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}/`);
  },

  /**
   * Search users by phone or name
   */
  search: async (query: string): Promise<User[]> => {
    const response = await apiClient.get('/users/', {
      params: { search: query },
    });
    return response.data.results || response.data;
  },
};
