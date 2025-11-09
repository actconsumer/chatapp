/**
 * Authentication Service
 * Handles user authentication and token management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { buildApiUrl, getApiHeaders, API_ENDPOINTS, STORAGE_KEYS } from './config';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isEmailVerified: boolean;
   twoFactorEnabled?: boolean;
   securityPinConfigured?: boolean;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  requiresTwoFactor?: boolean;
  userId?: string;
  requiresTwoFactorSetup?: boolean;
  requiresSecurityPinSetup?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Session {
  id: string;
  userId: string;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  city?: string;
  country?: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.AUTH.REGISTER);
      const response = await axios.post(url, data, {
        headers: getApiHeaders(),
      });
      
      const { user, tokens } = response.data.data;
      
      // Store tokens
      await this.storeTokens(tokens);
      await this.storeUser(user);
      
      return response.data.data;
    } catch (error: any) {
      console.error('Register error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.AUTH.LOGIN);
      const response = await axios.post(url, data, {
        headers: getApiHeaders(),
      });
      
      const responseData = response.data.data;
      
      // If 2FA is required, don't store tokens yet
      if (responseData.requiresTwoFactor) {
        return responseData;
      }
      
      // Store tokens
      await this.storeTokens(responseData.tokens);
      await this.storeUser(responseData.user);
      
      return responseData;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const token = await this.getToken();
      const url = buildApiUrl(API_ENDPOINTS.AUTH.LOGOUT);
      
      await axios.post(url, {}, {
        headers: getApiHeaders(token || undefined),
      });
    } catch (error: any) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      await this.clearAuth();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthTokens> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const url = buildApiUrl(API_ENDPOINTS.AUTH.REFRESH_TOKEN);
      const response = await axios.post(url, { refreshToken }, {
        headers: getApiHeaders(),
      });
      
      const tokens = response.data.data;
      await this.storeTokens(tokens);
      
      return tokens;
    } catch (error: any) {
      console.error('Refresh token error:', error);
      await this.clearAuth();
      throw new Error('Session expired. Please login again.');
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(email: string, otpCode: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.AUTH.VERIFY_EMAIL);
      await axios.post(url, { email, otpCode }, {
        headers: getApiHeaders(),
      });
    } catch (error: any) {
      console.error('Verify email error:', error);
      throw new Error(error.response?.data?.message || 'Email verification failed');
    }
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.AUTH.RESEND_VERIFICATION);
      await axios.post(url, { email }, {
        headers: getApiHeaders(),
      });
    } catch (error: any) {
      console.error('Resend verification error:', error);
      throw new Error(error.response?.data?.message || 'Failed to resend verification');
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.AUTH.FORGOT_PASSWORD);
      await axios.post(url, { email }, {
        headers: getApiHeaders(),
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw new Error(error.response?.data?.message || 'Failed to send reset code');
    }
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(email: string, otpCode: string, newPassword: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.AUTH.RESET_PASSWORD);
      await axios.post(url, { email, otpCode, newPassword }, {
        headers: getApiHeaders(),
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    try {
      const token = await this.getToken();
      const url = buildApiUrl(API_ENDPOINTS.AUTH.ME);
      
      const response = await axios.get(url, {
        headers: getApiHeaders(token || undefined),
      });
      
      const user = response.data.data.user;
      await this.storeUser(user);
      
      return user;
    } catch (error: any) {
      console.error('Get current user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get user');
    }
  }

  /**
   * Store tokens in AsyncStorage
   */
  async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    } catch (error) {
      console.error('Store tokens error:', error);
    }
  }

  /**
   * Store user data in AsyncStorage
   */
  async storeUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error('Store user error:', error);
    }
  }

  /**
   * Get access token
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  /**
   * Get stored user
   */
  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get stored user error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  /**
   * Clear authentication data
   */
  async clearAuth(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('Clear auth error:', error);
    }
  }

  /**
   * Get all active sessions
   */
  async getSessions(): Promise<Session[]> {
    try {
      const token = await this.getToken();
      const url = buildApiUrl('/auth/sessions');
      
      const response = await axios.get(url, {
        headers: getApiHeaders(token || undefined),
      });
      
      return response.data.data || [];
    } catch (error: any) {
      console.error('Get sessions error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get sessions');
    }
  }

  /**
   * Logout a specific session
   */
  async logoutSession(sessionId: string): Promise<void> {
    try {
      const token = await this.getToken();
      const url = buildApiUrl(`/auth/sessions/${sessionId}`);
      
      await axios.delete(url, {
        headers: getApiHeaders(token || undefined),
      });
    } catch (error: any) {
      console.error('Logout session error:', error);
      throw new Error(error.response?.data?.message || 'Failed to logout session');
    }
  }

  /**
   * Logout all other sessions (except current)
   */
  async logoutAllOtherSessions(): Promise<void> {
    try {
      const token = await this.getToken();
      const url = buildApiUrl('/auth/sessions/logout-all');
      
      await axios.post(url, {}, {
        headers: getApiHeaders(token || undefined),
      });
    } catch (error: any) {
      console.error('Logout all sessions error:', error);
      throw new Error(error.response?.data?.message || 'Failed to logout all sessions');
    }
  }
}

export const authService = new AuthService();

// Export getToken for use in other services
export const getToken = () => authService.getToken();
