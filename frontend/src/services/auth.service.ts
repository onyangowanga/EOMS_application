import apiClient from './api';
import type {
  LoginRequest,
  LoginResponse,
  PasswordLoginRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  VerifyOTPRequest,
  TokenResponse,
  User,
} from '../types/index';

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login/', data);
    return response.data;
  },

  loginWithPassword: async (data: PasswordLoginRequest): Promise<TokenResponse> => {
    try {
      const response = await apiClient.post('/auth/login/password/', data);
      const { access, refresh, user } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404 || status === 405) {
        throw {
          ...error,
          response: {
            ...error?.response,
            data: {
              error: 'Password login is not enabled on this server yet. Please use OTP login.',
            },
          },
        };
      }
      throw error;
    }
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

  requestPasswordReset: async (data: PasswordResetRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/password-reset/request/', data);
    return response.data;
  },

  confirmPasswordReset: async (data: PasswordResetConfirmRequest): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/password-reset/confirm/', data);
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

  setInitialPassword: async (data: { new_password: string; confirm_password: string }): Promise<TokenResponse> => {
    const response = await apiClient.post('/auth/set-initial-password/', data);
    const user = response.data.user;
    localStorage.setItem('user', JSON.stringify(user));
    return { ...response.data, user };
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
