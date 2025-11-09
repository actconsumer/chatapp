import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from './config';
import { getAuthHeaders } from './apiHelper';

// Types
export interface CallParticipant {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: 'host' | 'participant' | 'observer';
  joinedAt?: string;
  leftAt?: string;
  muted?: boolean;
  isSpeaking?: boolean;
}

export interface Call {
  id: string;
  callerId?: string;
  receiverId?: string;
  initiatorId?: string;
  chatId?: string;
  targetUserIds?: string[];
  signalGroupName?: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'ongoing' | 'ended' | 'rejected' | 'missed';
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  durationSeconds?: number;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
  acsToken?: string;
  acsCallId?: string;
  participants?: CallParticipant[];
}

export interface InitiateCallRequest {
  receiverId: string;
  type: 'voice' | 'video';
  offer: any; // WebRTC offer
}

export interface AnswerCallRequest {
  answer: any; // WebRTC answer
}

export interface CallHistoryParams {
  limit?: number;
  offset?: number;
  type?: 'voice' | 'video';
}

export interface ACSTokenResponse {
  token: string;
  userId: string;
  expiresOn: string;
}

export interface CallSettings {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  videoBitrate: number;
  audioDeviceId?: string;
  videoDeviceId?: string;
  preferredResolution: '360p' | '720p' | '1080p';
}

export interface CallQuality {
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
  bandwidth: number;
  latency: number;
  packetLoss: number;
  jitter: number;
}

export interface CallTelemetry {
  callId: string;
  duration: number;
  quality: CallQuality;
  issues: string[];
  timestamp: string;
}

class CallService {
  /**
   * Initiate a call
   */
  async initiateCall(data: InitiateCallRequest): Promise<Call> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CALLS.INITIATE);
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, data, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Initiate call error:', error);
      throw new Error(error.response?.data?.message || 'Failed to initiate call');
    }
  }

  /**
   * Answer a call
   */
  async answerCall(callId: string, data: AnswerCallRequest): Promise<Call> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CALLS.ANSWER(callId));
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, data, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Answer call error:', error);
      throw new Error(error.response?.data?.message || 'Failed to answer call');
    }
  }

  /**
   * Reject a call
   */
  async rejectCall(callId: string, reason?: string): Promise<Call> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CALLS.REJECT(callId));
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, { reason }, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Reject call error:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject call');
    }
  }

  /**
   * End a call
   */
  async endCall(callId: string): Promise<Call> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CALLS.END(callId));
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, {}, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('End call error:', error);
      throw new Error(error.response?.data?.message || 'Failed to end call');
    }
  }

  /**
   * Get call history
   */
  async getCallHistory(params?: CallHistoryParams): Promise<Call[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CALLS.HISTORY);
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, {
        headers,
        params,
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get call history error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get call history');
    }
  }

  /**
   * Get active call information
   */
  async getCall(callId: string): Promise<Call> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CALLS.GET(callId));
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get call error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get call');
    }
  }

  /**
   * Get Azure Communication Services token
   */
  async getACSToken(): Promise<ACSTokenResponse> {
    try {
      const url = buildApiUrl('/calls/acs-token');
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get ACS token error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get ACS token');
    }
  }

  /**
   * Update call settings
   */
  async updateCallSettings(settings: Partial<CallSettings>): Promise<CallSettings> {
    try {
      const url = buildApiUrl('/calls/settings');
      const headers = await getAuthHeaders();
      
      const response = await axios.patch(url, settings, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Update call settings error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update call settings');
    }
  }

  /**
   * Get call settings
   */
  async getCallSettings(): Promise<CallSettings> {
    try {
      const url = buildApiUrl('/calls/settings');
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get call settings error:', error);
      // Return defaults if error
      return {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        videoBitrate: 1500,
        preferredResolution: '720p',
      };
    }
  }

  /**
   * Send call telemetry
   */
  async sendTelemetry(telemetry: CallTelemetry): Promise<void> {
    try {
      const url = buildApiUrl('/calls/telemetry');
      const headers = await getAuthHeaders();
      
      await axios.post(url, telemetry, { headers });
    } catch (error: any) {
      console.error('Send telemetry error:', error);
      // Non-critical, don't throw
    }
  }

  /**
   * Get call quality metrics
   */
  async getCallQuality(callId: string): Promise<CallQuality> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CALLS.QUALITY(callId));
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get call quality error:', error);
      // Return default metrics
      return {
        networkQuality: 'good',
        bandwidth: 0,
        latency: 0,
        packetLoss: 0,
        jitter: 0,
      };
    }
  }

  /**
   * Add participants to a call
   */
  async addParticipants(callId: string, participantIds: string[]): Promise<Call> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CALLS.PARTICIPANTS(callId));
      const headers = await getAuthHeaders();

      const response = await axios.post(url, { participantIds }, { headers });

      return response.data.data;
    } catch (error: any) {
      console.error('Add participants error:', error);
      throw new Error(error.response?.data?.message || 'Failed to add participants');
    }
  }

  /**
   * Remove a participant from a call
   */
  async removeParticipant(callId: string, participantId: string): Promise<Call> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CALLS.PARTICIPANT(callId, participantId));
      const headers = await getAuthHeaders();

      const response = await axios.delete(url, { headers });

      return response.data.data;
    } catch (error: any) {
      console.error('Remove participant error:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove participant');
    }
  }
}

export const callService = new CallService();
