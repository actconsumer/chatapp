import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from './config';
import { getAuthHeaders } from './apiHelper';

// Types
interface SetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface VerifyResponse {
  success: boolean;
  backupCodes: string[];
}

interface DisableRequest {
  password: string;
  token?: string;
}

interface TwoFactorStatus {
  enabled: boolean;
  backupCodesRemaining: number;
}

class TwoFactorAuthService {
  /**
   * Setup 2FA for the current user
   */
  async setup(): Promise<SetupResponse> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.TWO_FACTOR.SETUP);
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, {}, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('2FA setup error:', error);
      throw new Error(error.response?.data?.message || 'Failed to setup 2FA');
    }
  }

  /**
   * Verify 2FA setup with TOTP token
   */
  async verify(token: string): Promise<VerifyResponse> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.TWO_FACTOR.VERIFY);
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, { token }, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('2FA verify error:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify 2FA');
    }
  }

  /**
   * Validate 2FA token during login
   */
  async validate(token: string): Promise<{ success: boolean }> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.TWO_FACTOR.VALIDATE);
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, { token }, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('2FA validate error:', error);
      throw new Error(error.response?.data?.message || 'Failed to validate 2FA token');
    }
  }

  /**
   * Disable 2FA
   */
  async disable(data: DisableRequest): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.TWO_FACTOR.DISABLE);
      const headers = await getAuthHeaders();
      
      await axios.post(url, data, { headers });
    } catch (error: any) {
      console.error('2FA disable error:', error);
      throw new Error(error.response?.data?.message || 'Failed to disable 2FA');
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(): Promise<{ backupCodes: string[] }> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.TWO_FACTOR.REGENERATE_BACKUP_CODES);
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, {}, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Regenerate backup codes error:', error);
      throw new Error(error.response?.data?.message || 'Failed to regenerate backup codes');
    }
  }

  /**
   * Get 2FA status
   */
  async getStatus(): Promise<TwoFactorStatus> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.TWO_FACTOR.STATUS);
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get 2FA status error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get 2FA status');
    }
  }
}

export const twoFactorAuthService = new TwoFactorAuthService();
