import apiClient from './api';
import type { CommitteeReport } from '../types/index';

export const reportService = {
  getCommitteeReport: async (committeeId: number): Promise<CommitteeReport> => {
    const response = await apiClient.get('/reports/committee_report/', {
      params: { committee: committeeId },
    });
    return response.data;
  },

  getEventSummary: async (committeeId: number): Promise<any> => {
    const response = await apiClient.get('/reports/event_summary/', {
      params: { committee: committeeId },
    });
    return response.data;
  },

  getUserActivity: async (userId?: number): Promise<any> => {
    const response = await apiClient.get('/reports/user_activity/', {
      params: userId ? { user_id: userId } : undefined,
    });
    return response.data;
  },

  getAllCommittees: async (): Promise<any> => {
    const response = await apiClient.get('/reports/all_committees/');
    return response.data;
  },
};
