/**
 * Privacy Service
 * Handles privacy settings, blocked users, and security preferences
 */

import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from './config';
import { getAuthHeaders } from './apiHelper';

// Types
export interface PrivacySettings {
  profilePhotoVisibility: 'everyone' | 'contacts' | 'nobody';
  lastSeenVisibility: 'everyone' | 'contacts' | 'nobody';
  statusVisibility: 'everyone' | 'contacts' | 'nobody';
  readReceipts: boolean;
  onlineStatus: boolean;
  typingIndicator: boolean;
  allowCalls: boolean;
  allowGroupInvites: boolean;
}

export interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  blockedAt: string;
}

export interface SecurityPreferences {
  requireTwoFactor: boolean;
  allowSecurityNotifications: boolean;
  allowLoginAlerts: boolean;
  sessionTimeout: number; // in minutes
}

class PrivacyService {
  /**
   * Get current privacy settings
   */
  async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      const url = buildApiUrl('/users/privacy/settings');
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get privacy settings error:', error);
      
      // Return default settings if API fails
      return {
        profilePhotoVisibility: 'everyone',
        lastSeenVisibility: 'contacts',
        statusVisibility: 'everyone',
        readReceipts: true,
        onlineStatus: true,
        typingIndicator: true,
        allowCalls: true,
        allowGroupInvites: true,
      };
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    try {
      const url = buildApiUrl('/users/privacy/settings');
      const headers = await getAuthHeaders();
      
      const response = await axios.patch(url, settings, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Update privacy settings error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update privacy settings');
    }
  }

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(): Promise<BlockedUser[]> {
    try {
      const url = buildApiUrl('/users/blocked');
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data || [];
    } catch (error: any) {
      console.error('Get blocked users error:', error);
      return [];
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.USERS.BLOCK(userId));
      const headers = await getAuthHeaders();
      
      await axios.post(url, {}, { headers });
    } catch (error: any) {
      console.error('Block user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to block user');
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.USERS.UNBLOCK(userId));
      const headers = await getAuthHeaders();
      
      await axios.post(url, {}, { headers });
    } catch (error: any) {
      console.error('Unblock user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to unblock user');
    }
  }

  /**
   * Get security preferences
   */
  async getSecurityPreferences(): Promise<SecurityPreferences> {
    try {
      const url = buildApiUrl('/users/security/preferences');
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get security preferences error:', error);
      
      // Return default preferences if API fails
      return {
        requireTwoFactor: false,
        allowSecurityNotifications: true,
        allowLoginAlerts: true,
        sessionTimeout: 30,
      };
    }
  }

  /**
   * Update security preferences
   */
  async updateSecurityPreferences(preferences: Partial<SecurityPreferences>): Promise<SecurityPreferences> {
    try {
      const url = buildApiUrl('/users/security/preferences');
      const headers = await getAuthHeaders();
      
      const response = await axios.patch(url, preferences, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Update security preferences error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update security preferences');
    }
  }

  /**
   * Get user's security code (for QR code verification)
   */
  async getSecurityCode(): Promise<{ code: string; qrCode: string }> {
    try {
      const url = buildApiUrl('/users/security/code');
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get security code error:', error);
      
      // Return mock code if API fails (for development)
      return {
        code: '12345 67890 12345 67890 12345 67890',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };
    }
  }

  /**
   * Regenerate security code
   */
  async regenerateSecurityCode(): Promise<{ code: string; qrCode: string }> {
    try {
      const url = buildApiUrl('/users/security/code/regenerate');
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, {}, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Regenerate security code error:', error);
      throw new Error(error.response?.data?.message || 'Failed to regenerate security code');
    }
  }

  /**
   * Verify another user's security code
   */
  async verifySecurityCode(userId: string, code: string): Promise<{ verified: boolean; user: any }> {
    try {
      const url = buildApiUrl('/users/security/code/verify');
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, { userId, code }, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Verify security code error:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify security code');
    }
  }
}

export const privacyService = new PrivacyService();
