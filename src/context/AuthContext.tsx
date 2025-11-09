import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  isEmailVerified: boolean;
  twoFactorEnabled?: boolean;
  securityPinConfigured?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDev: () => Promise<void>; // Dev mode login bypass
  register: (email: string, username: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otpCode: string, newPassword: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (token) {
        // Check if it's a dev token
        if (token === 'dev-mock-token-12345') {
          // Use mock user for dev mode
          const mockUser: User = {
            id: 'dev-user-123',
            email: 'dev@test.com',
            username: 'devuser',
            displayName: 'Dev User',
            avatar: 'https://i.pravatar.cc/150?img=68',
            isEmailVerified: true,
            twoFactorEnabled: true,
            securityPinConfigured: true,
          };
          setUser(mockUser);
        } else {
          // Fetch current user from API for real tokens
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Don't clear token if it's a dev token
      const token = await AsyncStorage.getItem('authToken');
      if (token !== 'dev-mock-token-12345') {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Call actual login API
      const response = await authService.login({ email, password });
      
      // Store tokens
      await authService.storeTokens(response.tokens);
      
      // Set user data
      setUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Development mode login - bypasses backend
  const loginDev = async () => {
    try {
      setLoading(true);
      
      // Create mock user for development
      const mockUser: User = {
        id: 'dev-user-123',
        email: 'dev@test.com',
        username: 'devuser',
        displayName: 'Dev User',
        avatar: 'https://i.pravatar.cc/150?img=68',
        isEmailVerified: true,
        twoFactorEnabled: true,
        securityPinConfigured: true,
      };
      
      // Store mock token
      await AsyncStorage.setItem('authToken', 'dev-mock-token-12345');
      await AsyncStorage.setItem('refreshToken', 'dev-mock-refresh-token-12345');
      
      // Set user
      setUser(mockUser);
    } catch (error) {
      console.error('Dev login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      
      // Call actual registration API
      const response = await authService.register({
        email,
        username,
        password,
        displayName,
      });
      
      // Store tokens
      await authService.storeTokens(response.tokens);
      
      // Set user data
      setUser(response.user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API
      await authService.logout();
      
      // Clear local data
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const verifyEmail = async (code: string) => {
    try {
      // Call verify email API
      if (user) {
        await authService.verifyEmail(user.email, code);
        
        // Update user verification status
        const updatedUser = { ...user, isEmailVerified: true };
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      // Call forgot password API
      await authService.forgotPassword(email);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string, otpCode: string, newPassword: string) => {
    try {
      // Call reset password API
      await authService.resetPassword(email, otpCode, newPassword);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const resendVerification = async (email: string) => {
    try {
      // Call resend verification API
      await authService.resendVerification(email);
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginDev,
        register,
        logout,
        verifyEmail,
        forgotPassword,
        resetPassword,
        resendVerification,
        isAuthenticated: !!user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
