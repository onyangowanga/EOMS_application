import apiClient from './api';
import type { Committee, AddMemberRequest, CommitteeMember } from '../types/index';

export const committeeService = {
  getAll: async (): Promise<Committee[]> => {
    const response = await apiClient.get('/committees/');
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<Committee> => {
    const response = await apiClient.get(`/committees/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Committee>): Promise<Committee> => {
    const response = await apiClient.post('/committees/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Committee>): Promise<Committee> => {
    const response = await apiClient.put(`/committees/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/committees/${id}/`);
  },

  addMember: async (id: number, data: AddMemberRequest): Promise<CommitteeMember> => {
    const response = await apiClient.post(`/committees/${id}/add_member/`, data);
    return response.data;
  },

  removeMember: async (id: number, userId: number): Promise<void> => {
    await apiClient.delete(`/committees/${id}/remove_member/`, { data: { user_id: userId } });
  },

  getMembers: async (id: number): Promise<CommitteeMember[]> => {
    const response = await apiClient.get(`/committees/${id}/members/`);
    return response.data;
  },

  getMyCommittees: async (): Promise<Committee[]> => {
    const response = await apiClient.get('/committees/my_committees/');
    return response.data;
  },
};
