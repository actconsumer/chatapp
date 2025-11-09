import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from './config';
import { getAuthHeaders } from './apiHelper';

// Types
interface KeyPair {
  publicKey: string;
  privateKey: string;
}

interface Device {
  id: string;
  name: string;
  publicKey: string;
  isActive: boolean;
  lastUsed: string;
  createdAt: string;
}

interface RegisterDeviceRequest {
  deviceName: string;
  publicKey: string;
}

interface EncryptMessageKeyRequest {
  messageKey: string;
  recipientDeviceIds: string[];
}

interface EncryptedMessageKey {
  deviceId: string;
  encryptedKey: string;
}

interface GetMessageKeyRequest {
  messageId: string;
  deviceId: string;
}

class SecurityKeyService {
  /**
   * Generate RSA key pair for the device
   */
  async generateKeyPair(): Promise<KeyPair> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.SECURITY.GENERATE_KEYS);
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, {}, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Generate key pair error:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate key pair');
    }
  }

  /**
   * Register a device with its public key
   */
  async registerDevice(data: RegisterDeviceRequest): Promise<Device> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.SECURITY.REGISTER_DEVICE);
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, data, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Register device error:', error);
      throw new Error(error.response?.data?.message || 'Failed to register device');
    }
  }

  /**
   * Get all devices for the current user
   */
  async getDevices(): Promise<Device[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.SECURITY.GET_DEVICES);
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get devices error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get devices');
    }
  }

  /**
   * Revoke a device
   */
  async revokeDevice(deviceId: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.SECURITY.REVOKE_DEVICE(deviceId));
      const headers = await getAuthHeaders();
      
      await axios.delete(url, { headers });
    } catch (error: any) {
      console.error('Revoke device error:', error);
      throw new Error(error.response?.data?.message || 'Failed to revoke device');
    }
  }

  /**
   * Encrypt message key for recipient devices
   */
  async encryptMessageKey(data: EncryptMessageKeyRequest): Promise<EncryptedMessageKey[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.SECURITY.ENCRYPT_MESSAGE_KEY);
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, data, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Encrypt message key error:', error);
      throw new Error(error.response?.data?.message || 'Failed to encrypt message key');
    }
  }

  /**
   * Get encrypted message key for a specific device
   */
  async getMessageKey(params: GetMessageKeyRequest): Promise<{ encryptedKey: string }> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.SECURITY.GET_MESSAGE_KEY);
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, {
        headers,
        params,
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get message key error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get message key');
    }
  }

  /**
   * Verify device by comparing signatures
   */
  async verifyDevice(deviceId: string, signature: string): Promise<{ verified: boolean }> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.SECURITY.VERIFY_DEVICE);
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, { deviceId, signature }, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Verify device error:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify device');
    }
  }
}

export const securityKeyService = new SecurityKeyService();
