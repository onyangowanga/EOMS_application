import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/index';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, otpCode: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('access_token');
    if (token) {
      const storedUser = authService.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        // Optionally verify the token is still valid
        authService.getCurrentUser()
          .then(setUser)
          .catch((error) => {
            console.error('Failed to fetch current user:', error);
            authService.logout();
            setUser(null);
          });
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (phone: string) => {
    await authService.login({ phone });
  };

  const verifyOTP = async (phone: string, otpCode: string) => {
    const response = await authService.verifyOTP({ phone, otp_code: otpCode });
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    verifyOTP,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
