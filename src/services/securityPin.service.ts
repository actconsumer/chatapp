/**
 * Security PIN Service
 * Professional service for managing security PINs and device trust
 */

import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from './config';
import { getAuthHeaders } from './apiHelper';

export interface SecurityPinStatus {
  hasPin: boolean;
  pinLength: number;
  createdAt?: string;
  lastChangedAt?: string;
}

export interface TrustedDevice {
  id: string;
  deviceName: string;
  deviceType: string;
  lastUsed: string;
  trusted: boolean;
}

class SecurityPinService {
  /**
   * Setup security PIN
   */
  async setup(pin: string): Promise<{ success: boolean }> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        buildApiUrl(API_ENDPOINTS.SECURITY.PIN.SETUP),
        { pin },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Security PIN setup error:', error);
      throw new Error(error.response?.data?.message || 'Failed to setup security PIN');
    }
  }

  /**
   * Verify security PIN
   */
  async verify(pin: string, deviceInfo?: any): Promise<{ success: boolean; trustToken?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        buildApiUrl(API_ENDPOINTS.SECURITY.PIN.VERIFY),
        { pin, deviceInfo },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Security PIN verification error:', error);
      throw new Error(error.response?.data?.message || 'Invalid security PIN');
    }
  }

  /**
   * Check if PIN is required
   */
  async isPinRequired(deviceId: string): Promise<{ required: boolean; reason?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        buildApiUrl(API_ENDPOINTS.SECURITY.PIN.REQUIRED),
        {
          params: { deviceId },
          headers
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Check PIN requirement error:', error);
      throw new Error(error.response?.data?.message || 'Failed to check PIN requirement');
    }
  }

  /**
   * Change security PIN
   */
  async change(currentPassword: string, newPin: string): Promise<{ success: boolean }> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.put(
        buildApiUrl(API_ENDPOINTS.SECURITY.PIN.CHANGE),
        { currentPassword, newPin },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Change PIN error:', error);
      throw new Error(error.response?.data?.message || 'Failed to change security PIN');
    }
  }

  /**
   * Disable security PIN
   */
  async disable(password: string): Promise<{ success: boolean }> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.delete(
        buildApiUrl(API_ENDPOINTS.SECURITY.PIN.DISABLE),
        {
          data: { password },
          headers
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Disable PIN error:', error);
      throw new Error(error.response?.data?.message || 'Failed to disable security PIN');
    }
  }

  /**
   * Enable security PIN
   */
  async enable(pin: string): Promise<{ success: boolean }> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        buildApiUrl(API_ENDPOINTS.SECURITY.PIN.ENABLE),
        { pin },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Enable PIN error:', error);
      throw new Error(error.response?.data?.message || 'Failed to enable security PIN');
    }
  }

  /**
   * Get PIN status
   */
  async getStatus(): Promise<SecurityPinStatus> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        buildApiUrl(API_ENDPOINTS.SECURITY.PIN.STATUS),
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Get PIN status error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get PIN status');
    }
  }

  /**
   * Trust current device
   */
  async trustDevice(deviceInfo: any): Promise<{ success: boolean; deviceId: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        buildApiUrl(API_ENDPOINTS.SECURITY.PIN.TRUST_DEVICE),
        { deviceInfo },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Trust device error:', error);
      throw new Error(error.response?.data?.message || 'Failed to trust device');
    }
  }

  /**
   * Get trusted devices
   */
  async getTrustedDevices(): Promise<TrustedDevice[]> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        buildApiUrl(API_ENDPOINTS.SECURITY.PIN.GET_DEVICES),
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Get trusted devices error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get trusted devices');
    }
  }

  /**
   * Revoke device trust
   */
  async revokeDevice(deviceId: string): Promise<{ success: boolean }> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.delete(
        buildApiUrl(API_ENDPOINTS.SECURITY.PIN.REVOKE_DEVICE(deviceId)),
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Revoke device error:', error);
      throw new Error(error.response?.data?.message || 'Failed to revoke device');
    }
  }

  /**
   * Revoke all devices
   */
  async revokeAllDevices(): Promise<{ success: boolean; count: number }> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        buildApiUrl(API_ENDPOINTS.SECURITY.PIN.REVOKE_ALL),
        {},
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Revoke all devices error:', error);
      throw new Error(error.response?.data?.message || 'Failed to revoke all devices');
    }
  }
}

export const securityPinService = new SecurityPinService();
