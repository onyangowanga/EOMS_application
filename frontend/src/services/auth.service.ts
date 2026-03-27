import apiClient from './api';
import type { LoginRequest, LoginResponse, VerifyOTPRequest, TokenResponse, User } from '../types/index';

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login/', data);
    return response.data;
  },

  verifyOTP: async (data: VerifyOTPRequest): Promise<TokenResponse> => {
    const response = await apiClient.post('/auth/verify_otp/', data);
    const { access, refresh, user } = response.data;
    
    // Store tokens and user in localStorage
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me/');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put('/auth/update_profile/', data);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  changePassword: async (data: { old_password: string; new_password: string }): Promise<void> => {
    await apiClient.post('/auth/change_password/', data);
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },
};
