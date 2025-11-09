import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from './config';
import { getAuthHeaders } from './apiHelper';

// Types
interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'call' | 'friend_request' | 'story' | 'group' | 'mention' | 'reaction';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

interface NotificationPreferences {
  messages: boolean;
  calls: boolean;
  friendRequests: boolean;
  stories: boolean;
  groups: boolean;
  mentions: boolean;
  reactions: boolean;
  sound: boolean;
  vibration: boolean;
}

interface UpdatePreferencesRequest {
  messages?: boolean;
  calls?: boolean;
  friendRequests?: boolean;
  stories?: boolean;
  groups?: boolean;
  mentions?: boolean;
  reactions?: boolean;
  sound?: boolean;
  vibration?: boolean;
}

interface RegisterPushTokenRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
}

class NotificationService {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(params?: { limit?: number; offset?: number }): Promise<Notification[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.NOTIFICATIONS.LIST);
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, {
        headers,
        params,
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get notifications error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get notifications');
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
      const headers = await getAuthHeaders();
      
      await axios.post(url, {}, { headers });
    } catch (error: any) {
      console.error('Mark notification as read error:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      const headers = await getAuthHeaders();
      
      await axios.post(url, {}, { headers });
    } catch (error: any) {
      console.error('Mark all notifications as read error:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.NOTIFICATIONS.DELETE(notificationId));
      const headers = await getAuthHeaders();
      
      await axios.delete(url, { headers });
    } catch (error: any) {
      console.error('Delete notification error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete notification');
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES);
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get notification preferences error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get notification preferences');
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(data: UpdatePreferencesRequest): Promise<NotificationPreferences> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES);
      const headers = await getAuthHeaders();
      
      const response = await axios.patch(url, data, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Update notification preferences error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update notification preferences');
    }
  }

  /**
   * Register push notification token
   */
  async registerPushToken(data: RegisterPushTokenRequest): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.NOTIFICATIONS.REGISTER_TOKEN);
      const headers = await getAuthHeaders();
      
      await axios.post(url, data, { headers });
    } catch (error: any) {
      console.error('Register push token error:', error);
      throw new Error(error.response?.data?.message || 'Failed to register push token');
    }
  }

  /**
   * Unregister push notification token
   */
  async unregisterPushToken(deviceId: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.NOTIFICATIONS.UNREGISTER_TOKEN);
      const headers = await getAuthHeaders();
      
      await axios.post(url, { deviceId }, { headers });
    } catch (error: any) {
      console.error('Unregister push token error:', error);
      throw new Error(error.response?.data?.message || 'Failed to unregister push token');
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get unread count error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get unread count');
    }
  }
}

export const notificationService = new NotificationService();
