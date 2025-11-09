import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from './config';
import { getAuthHeaders } from './apiHelper';

export interface ReportPayload {
  reason: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

class ModerationService {
  async reportUser(userId: string, payload: ReportPayload & { chatId?: string }): Promise<void> {
    const url = buildApiUrl(API_ENDPOINTS.REPORTS.USER);
    const headers = await getAuthHeaders();

    try {
      await axios.post(
        url,
        {
          targetUserId: userId,
          reason: payload.reason,
          description: payload.description,
          chatId: payload.chatId,
          metadata: payload.metadata,
        },
        { headers }
      );
    } catch (error: any) {
      console.error('ModerationService.reportUser error:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit user report');
    }
  }

  async reportChat(chatId: string, payload: ReportPayload): Promise<void> {
    const url = buildApiUrl(API_ENDPOINTS.REPORTS.CHAT(chatId));
    const headers = await getAuthHeaders();

    try {
      await axios.post(
        url,
        {
          reason: payload.reason,
          description: payload.description,
          metadata: payload.metadata,
        },
        { headers }
      );
    } catch (error: any) {
      console.error('ModerationService.reportChat error:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit chat report');
    }
  }
}

export const moderationService = new ModerationService();

export default moderationService;
