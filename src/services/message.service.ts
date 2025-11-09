/**
 * Message Service
 * Handles all message-related API calls
 */

import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from './config';
import { getAuthHeaders } from './apiHelper';

export interface SendMessageRequest {
  chatId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'voice' | 'file';
  replyTo?: string;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string;
  reactions?: MessageReaction[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface UpdateMessageRequest {
  text?: string;
  status?: Message['status'];
  metadata?: Record<string, any>;
}

export interface ReactToMessageRequest {
  emoji: string;
}

export interface GetMessagesOptions {
  limit?: number;
  before?: string;
  after?: string;
}

export interface UploadMediaRequest {
  chatId: string;
  file: {
    uri: string;
    name: string;
    type: string;
  };
}

export interface UploadMediaResponse {
  mediaUrl: string;
  mediaType: Message['mediaType'];
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
}

class MessageService {
  /**
   * Send a message
   */
  async sendMessage(data: SendMessageRequest): Promise<Message> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.MESSAGES.SEND);
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, data, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Send message error:', error);
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
  }

  async getMessages(chatId: string, options?: GetMessagesOptions): Promise<Message[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.MESSAGES.LIST(chatId));
      const headers = await getAuthHeaders();

      const response = await axios.get(url, {
        headers,
        params: options,
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Get messages error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get messages');
    }
  }

  async uploadMedia(params: UploadMediaRequest): Promise<UploadMediaResponse> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.MESSAGES.UPLOAD);
      const headers = await getAuthHeaders();
      const formData = new FormData();
      formData.append('chatId', params.chatId);
      formData.append('file', {
        uri: params.file.uri,
        name: params.file.name,
        type: params.file.type,
      } as any);

      const response = await axios.post(url, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Upload media error:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload media');
    }
  }

  async getUnreadCount(chatId: string): Promise<number> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.MESSAGES.UNREAD_COUNT(chatId));
      const headers = await getAuthHeaders();

      const response = await axios.get(url, { headers });
      return response.data?.data?.count ?? 0;
    } catch (error: any) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  /**
   * Get a specific message
   */
  async getMessage(chatId: string, messageId: string): Promise<Message> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.MESSAGES.GET(chatId, messageId));
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get message error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get message');
    }
  }

  /**
   * Update a message
   */
  async updateMessage(messageId: string, data: UpdateMessageRequest): Promise<Message> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.MESSAGES.UPDATE(messageId));
      const headers = await getAuthHeaders();
      
      const response = await axios.patch(url, data, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Update message error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update message');
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, forEveryone: boolean = false): Promise<void> {
    try {
      const endpoint = forEveryone
        ? API_ENDPOINTS.MESSAGES.DELETE(messageId)
        : API_ENDPOINTS.MESSAGES.DELETE_FOR_ME(messageId);
      const url = buildApiUrl(endpoint);
      const headers = await getAuthHeaders();

      await axios.delete(url, { headers });
    } catch (error: any) {
      console.error('Delete message error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete message');
    }
  }

  /**
   * Delete a message for me only
   */
  async deleteForMe(messageId: string): Promise<void> {
    return this.deleteMessage(messageId, false);
  }

  /**
   * Delete a message for everyone
   */
  async deleteForEveryone(messageId: string): Promise<void> {
    return this.deleteMessage(messageId, true);
  }

  /**
   * React to a message
   */
  async reactToMessage(messageId: string, data: ReactToMessageRequest): Promise<Message> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.MESSAGES.REACTIONS(messageId));
      const headers = await getAuthHeaders();

      const response = await axios.post(url, data, { headers });

      return response.data.data;
    } catch (error: any) {
      console.error('React to message error:', error);
      throw new Error(error.response?.data?.message || 'Failed to react to message');
    }
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(messageId: string, emoji: string): Promise<Message> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.MESSAGES.REACTION(messageId, emoji));
      const headers = await getAuthHeaders();

      const response = await axios.delete(url, { headers });

      return response.data.data;
    } catch (error: any) {
      console.error('Remove reaction error:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove reaction');
    }
  }
}

export const messageService = new MessageService();
