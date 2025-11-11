/**
 * Chat Service (UI facing abstraction)
 * Aligns frontend chat flows with Firebase-backed REST endpoints.
 */
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from './config';
import { getAuthHeaders } from './apiHelper';
import { authService } from './auth.service';
import { messageService } from './message.service';

export interface ChatParticipantPermissions {
  canSendMessages: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canEditGroupInfo: boolean;
  canDeleteMessages: boolean;
}

export interface ChatParticipant {
  id: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  isOnline?: boolean;
  role?: 'admin' | 'member';
  joinedAt?: string;
  leftAt?: string;
  isActive?: boolean;
  permissions?: ChatParticipantPermissions;
  lastReadMessageId?: string;
  lastReadAt?: string;
  notificationsMuted?: boolean;
  mutedUntil?: string;
}

export interface ChatSummary {
  id: string;
  name: string;
  type: 'direct' | 'group';
  avatar?: string;
  description?: string;
  participants: ChatParticipant[];
  lastMessageText?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isMuted: boolean;
  isPinned?: boolean;
  updatedAt: string;
  createdAt?: string;
  createdBy?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string;
  reactions?: Array<{ emoji: string; userId: string; userName?: string }>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateChatRequest {
  type: 'direct' | 'group';
  participantIds: string[];
  name?: string;
  description?: string;
}

export interface UpdateChatRequest {
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
}

export interface GetChatMessagesOptions {
  limit?: number;
  before?: string;
  after?: string;
}

class ChatService {
  async list(): Promise<ChatSummary[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CHATS.LIST);
      const headers = await getAuthHeaders();
      const res = await axios.get(url, { headers });
      const rawChats: any[] = res.data?.data || [];
      const currentUser = await authService.getStoredUser();
      const currentUserId = currentUser?.id;

      const summaries = rawChats.map((chat) => this.mapChatToSummary(chat, currentUserId));

      if (currentUserId) {
        await Promise.all(
          summaries.map(async (summary) => {
            try {
              const count = await messageService.getUnreadCount(summary.id);
              summary.unreadCount = count;
            } catch (error) {
              console.warn('ChatService.list unreadCount error:', error);
            }
          })
        );
      }

      return summaries.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error: any) {
      console.error('ChatService.list error:', error);
      throw new Error(error.response?.data?.message || 'Failed to load chats');
    }
  }

  async get(id: string): Promise<ChatSummary> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CHATS.GET(id));
      const headers = await getAuthHeaders();
      const res = await axios.get(url, { headers });
      const currentUser = await authService.getStoredUser();
      const summary = this.mapChatToSummary(res.data?.data, currentUser?.id);

      try {
        summary.unreadCount = await messageService.getUnreadCount(id);
      } catch (error) {
        console.warn('ChatService.get unreadCount error:', error);
      }

      return summary;
    } catch (error: any) {
      console.error('ChatService.get error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get chat');
    }
  }

  async create(data: CreateChatRequest): Promise<ChatSummary> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CHATS.CREATE);
      const headers = await getAuthHeaders();
      const res = await axios.post(url, data, { headers });
      const currentUser = await authService.getStoredUser();
      return this.mapChatToSummary(res.data?.data, currentUser?.id);
    } catch (error: any) {
      console.error('ChatService.create error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create chat');
    }
  }

  async update(id: string, data: UpdateChatRequest): Promise<ChatSummary> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CHATS.UPDATE(id));
      const headers = await getAuthHeaders();
      const res = await axios.patch(url, data, { headers });
      const currentUser = await authService.getStoredUser();
      return this.mapChatToSummary(res.data?.data, currentUser?.id);
    } catch (error: any) {
      console.error('ChatService.update error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update chat');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CHATS.DELETE(id));
      const headers = await getAuthHeaders();
      await axios.delete(url, { headers });
    } catch (error: any) {
      console.error('ChatService.remove error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete chat');
    }
  }

  async messages(id: string, options?: GetChatMessagesOptions): Promise<ChatMessage[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.MESSAGES.LIST(id));
      const headers = await getAuthHeaders();
      const res = await axios.get(url, { headers, params: options });
      return res.data?.data || [];
    } catch (error: any) {
      console.error('ChatService.messages error:', error);
      throw new Error(error.response?.data?.message || 'Failed to load messages');
    }
  }

  async markRead(id: string, messageId?: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.MESSAGES.MARK_READ(id));
      const headers = await getAuthHeaders();
      await axios.post(
        url,
        { messageIds: messageId ? [messageId] : [] },
        { headers }
      );
    } catch (error: any) {
      console.error('ChatService.markRead error:', error);
      // Non-fatal
    }
  }

  async toggleMute(id: string): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CHATS.MUTE(id));
      const headers = await getAuthHeaders();
      await axios.post(url, {}, { headers });
    } catch (error: any) {
      console.error('ChatService.toggleMute error:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle mute');
    }
  }

  async togglePin(id: string): Promise<ChatSummary> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CHATS.PIN(id));
      const headers = await getAuthHeaders();
      await axios.post(url, {}, { headers });
      return this.get(id);
    } catch (error: any) {
      console.error('ChatService.togglePin error:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle pin');
    }
  }

  async addParticipants(id: string, participantIds: string[]): Promise<ChatSummary> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CHATS.PARTICIPANTS(id));
      const headers = await getAuthHeaders();
      await axios.post(url, { participantIds }, { headers });
      return this.get(id);
    } catch (error: any) {
      console.error('ChatService.addParticipants error:', error);
      throw new Error(error.response?.data?.message || 'Failed to add participants');
    }
  }

  async removeParticipant(id: string, participantId: string): Promise<ChatSummary> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CHATS.PARTICIPANT(id, participantId));
      const headers = await getAuthHeaders();
      await axios.delete(url, { headers });
      return this.get(id);
    } catch (error: any) {
      console.error('ChatService.removeParticipant error:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove participant');
    }
  }

  async updateParticipantRole(id: string, participantId: string, role: 'admin' | 'member'): Promise<ChatSummary> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CHATS.PARTICIPANT_ROLE(id, participantId));
      const headers = await getAuthHeaders();
      await axios.patch(url, { role }, { headers });
      return this.get(id);
    } catch (error: any) {
      console.error('ChatService.updateParticipantRole error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update participant role');
    }
  }

  async listParticipants(id: string): Promise<ChatParticipant[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.CHATS.PARTICIPANTS(id));
      const headers = await getAuthHeaders();
      const res = await axios.get(url, { headers });
      const rawParticipants: any[] = res.data?.data || [];
      return rawParticipants.map((participant) => this.mapParticipant(participant));
    } catch (error: any) {
      console.error('ChatService.listParticipants error:', error);
      throw new Error(error.response?.data?.message || 'Failed to load participants');
    }
  }

  private mapChatToSummary(raw: any, currentUserId?: string): ChatSummary {
    const participants = (raw?.participants || []).map((participant: any) => this.mapParticipant(participant));
    const lastMessageText = raw?.lastMessage?.text || raw?.lastMessage?.content;
    const lastMessageAt = raw?.lastMessage?.timestamp || raw?.updatedAt;

    const summary: ChatSummary = {
      id: raw?.id,
      name: this.resolveChatName(raw, participants, currentUserId),
      type: raw?.type || 'direct',
      avatar: this.resolveChatAvatar(raw, participants, currentUserId),
      description: raw?.description,
      participants,
      lastMessageText,
      lastMessageAt,
      unreadCount: raw?.unreadCount || 0,
      isMuted: !!raw?.isMuted,
      isPinned: raw?.isPinned,
      updatedAt: raw?.updatedAt,
      createdAt: raw?.createdAt,
      createdBy: raw?.createdBy,
    };

    if (currentUserId) {
      const currentParticipant = participants.find((p: ChatParticipant) => p.id === currentUserId);
      if (currentParticipant?.lastReadMessageId && raw?.lastMessage?.id) {
        if (currentParticipant.lastReadMessageId !== raw.lastMessage.id) {
          summary.unreadCount = Math.max(summary.unreadCount, 1);
        }
      }
    }

    return summary;
  }

  private mapParticipant(participant: any): ChatParticipant {
    return {
      id: participant?.userId || participant?.id,
      username: participant?.username,
      displayName: participant?.displayName,
      avatar: participant?.avatar,
      isOnline: participant?.isOnline,
      role: participant?.role,
      joinedAt: participant?.joinedAt,
      leftAt: participant?.leftAt,
      isActive: participant?.isActive,
      permissions: participant?.permissions,
      lastReadMessageId: participant?.lastReadMessageId,
      lastReadAt: participant?.lastReadAt,
      notificationsMuted: participant?.notificationsMuted,
      mutedUntil: participant?.mutedUntil,
    };
  }

  private resolveChatName(raw: any, participants: ChatParticipant[], currentUserId?: string): string {
    if (raw?.type === 'group') {
      return raw?.name || 'Group';
    }

    if (!currentUserId) {
      return raw?.name || participants[0]?.displayName || 'Chat';
    }

  const otherParticipant = participants.find((p: ChatParticipant) => p.id !== currentUserId);
    return (
      raw?.name ||
      otherParticipant?.displayName ||
      otherParticipant?.username ||
      'Chat'
    );
  }

  private resolveChatAvatar(raw: any, participants: ChatParticipant[], currentUserId?: string): string | undefined {
    if (raw?.type === 'group') {
      return raw?.avatar;
    }

    if (!currentUserId) {
      return raw?.avatar;
    }

  const otherParticipant = participants.find((p: ChatParticipant) => p.id !== currentUserId);
    return otherParticipant?.avatar || raw?.avatar;
  }
}

export const chatService = new ChatService();

// Preserve existing export name for backwards compatibility (if any code imported conversationService before)
export const conversationService = chatService;
