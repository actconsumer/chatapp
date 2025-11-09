/**
 * User Service
 * Handles user profile and related operations
 */

import axios from 'axios';
import { buildApiUrl, getApiHeaders, API_ENDPOINTS } from './config';
import { getToken } from './auth.service';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  privacySettings: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    showProfilePicture: 'everyone' | 'contacts' | 'nobody';
    showAbout: 'everyone' | 'contacts' | 'nobody';
  };
  createdAt: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  phoneNumber?: string;
  privacySettings?: UserProfile['privacySettings'];
}

export interface SearchUsersOptions {
  query: string;
  limit?: number;
  offset?: number;
}

class UserService {
  /**
   * Get user profile
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const token = await getToken();
      const url = buildApiUrl(API_ENDPOINTS.USERS.PROFILE);
      
      const response = await axios.get(url, {
        headers: getApiHeaders(token || undefined),
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get profile error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const token = await getToken();
      const url = buildApiUrl(API_ENDPOINTS.USERS.UPDATE_PROFILE);
      
      const response = await axios.patch(url, data, {
        headers: getApiHeaders(token || undefined),
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(file: FormData): Promise<string> {
    try {
      const token = await getToken();
      const url = buildApiUrl(API_ENDPOINTS.USERS.UPLOAD_AVATAR);
      
      const response = await axios.post(url, file, {
        headers: {
          ...getApiHeaders(token || undefined),
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data.avatarUrl;
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload avatar');
    }
  }

  /**
   * Search users
   */
  async searchUsers(options: SearchUsersOptions): Promise<UserProfile[]> {
    try {
      const token = await getToken();
      const url = buildApiUrl(API_ENDPOINTS.USERS.SEARCH);
      
      const response = await axios.get(url, {
        headers: getApiHeaders(token || undefined),
        params: options,
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Search users error:', error);
      throw new Error(error.response?.data?.message || 'Failed to search users');
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<UserProfile> {
    try {
      const token = await getToken();
      const url = buildApiUrl(API_ENDPOINTS.USERS.GET(userId));
      
      const response = await axios.get(url, {
        headers: getApiHeaders(token || undefined),
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get user');
    }
  }

  /**
   * Block user
   */
  async blockUser(userId: string): Promise<void> {
    try {
      const token = await getToken();
      const url = buildApiUrl(API_ENDPOINTS.USERS.BLOCK(userId));
      
      await axios.post(url, {}, {
        headers: getApiHeaders(token || undefined),
      });
    } catch (error: any) {
      console.error('Block user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to block user');
    }
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string): Promise<void> {
    try {
      const token = await getToken();
      const url = buildApiUrl(API_ENDPOINTS.USERS.UNBLOCK(userId));
      
      await axios.post(url, {}, {
        headers: getApiHeaders(token || undefined),
      });
    } catch (error: any) {
      console.error('Unblock user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to unblock user');
    }
  }
}

export const userService = new UserService();
