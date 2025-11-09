import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from './config';
import { getAuthHeaders } from './apiHelper';

// Types
interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  lastMessage?: any;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string;
  reactions?: any[];
  createdAt: string;
  updatedAt: string;
}

interface GetMessagesOptions {
  limit?: number;
  offset?: number;
  before?: string;
  after?: string;
}

interface CreateConversationRequest {
  type: 'direct' | 'group';
  participants: string[];
  name?: string;
  avatar?: string;
}

interface UpdateConversationRequest {
  name?: string;
  avatar?: string;
  isPinned?: boolean;
  isMuted?: boolean;
}

class ConversationService {
  /**
   * Get all conversations
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CONVERSATIONS.LIST);
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get conversations error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get conversations');
    }
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CONVERSATIONS.GET(conversationId));
      const headers = await getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get conversation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get conversation');
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationRequest): Promise<Conversation> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CONVERSATIONS.CREATE);
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, data, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Create conversation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create conversation');
    }
  }

  /**
   * Update a conversation
   */
  async updateConversation(
    conversationId: string,
    data: UpdateConversationRequest
  ): Promise<Conversation> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CONVERSATIONS.UPDATE(conversationId));
      const headers = await getAuthHeaders();
      
      const response = await axios.patch(url, data, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Update conversation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update conversation');
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CONVERSATIONS.DELETE(conversationId));
      const headers = await getAuthHeaders();
      
      await axios.delete(url, { headers });
    } catch (error: any) {
      console.error('Delete conversation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete conversation');
    }
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(
    conversationId: string,
    options?: GetMessagesOptions
  ): Promise<Message[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CONVERSATIONS.MESSAGES(conversationId));
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

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string, messageId?: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CONVERSATIONS.MARK_READ(conversationId));
      const headers = await getAuthHeaders();
      
      await axios.post(url, { messageId }, { headers });
    } catch (error: any) {
      console.error('Mark as read error:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark as read');
    }
  }

  /**
   * Pin/unpin conversation
   */
  async togglePin(conversationId: string): Promise<Conversation> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CONVERSATIONS.PIN(conversationId));
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, {}, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Toggle pin error:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle pin');
    }
  }

  /**
   * Mute/unmute conversation
   */
  async toggleMute(conversationId: string): Promise<Conversation> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CONVERSATIONS.MUTE(conversationId));
      const headers = await getAuthHeaders();
      
      const response = await axios.post(url, {}, { headers });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Toggle mute error:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle mute');
    }
  }
}

export const conversationService = new ConversationService();
