import apiClient from './api';
import type { Task, TaskCreate, TaskComment } from '../types/index';

export const taskService = {
  getAll: async (params?: {
    committee?: number;
    assigned_to?: number;
    status?: string;
  }): Promise<Task[]> => {
    const response = await apiClient.get('/tasks/', { params });
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<Task> => {
    const response = await apiClient.get(`/tasks/${id}/`);
    return response.data;
  },

  create: async (data: TaskCreate): Promise<Task> => {
    const response = await apiClient.post('/tasks/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Task>): Promise<Task> => {
    const response = await apiClient.put(`/tasks/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}/`);
  },

  updateStatus: async (id: number, status: string): Promise<Task> => {
    const response = await apiClient.patch(`/tasks/${id}/update_status/`, { status });
    return response.data;
  },

  addComment: async (id: number, comment: string): Promise<TaskComment> => {
    const response = await apiClient.post(`/tasks/${id}/add_comment/`, { comment });
    return response.data;
  },

  getComments: async (id: number): Promise<TaskComment[]> => {
    const response = await apiClient.get(`/tasks/${id}/comments/`);
    return response.data;
  },

  getMyTasks: async (): Promise<Task[]> => {
    const response = await apiClient.get('/tasks/my_tasks/');
    return response.data;
  },
};
