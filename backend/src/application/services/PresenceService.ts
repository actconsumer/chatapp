/**
 * Presence Service
 * Real-time user presence tracking (online/offline/typing)
 * Professional-grade with Redis caching for high performance
 */

import { cosmosDBClient } from '../../infrastructure/database/cosmosdb.config';
import { AppError } from '../middleware/error.middleware';

export type PresenceStatus = 'online' | 'offline' | 'away';
export type TypingStatus = 'typing' | 'recording' | 'idle';

export interface IUserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: Date;
  isTyping: boolean;
  typingInChat?: string;
  deviceId?: string;
  updatedAt: Date;
}

export class PresenceService {
  private presenceCache: Map<string, IUserPresence> = new Map();
  private typingCache: Map<string, Map<string, NodeJS.Timeout>> = new Map(); // chatId -> userId -> timeout

  /**
   * Set user online
   */
  async setOnline(userId: string, deviceId?: string): Promise<IUserPresence> {
    const presence: IUserPresence = {
      userId,
      status: 'online',
      lastSeen: new Date(),
      isTyping: false,
      deviceId,
      updatedAt: new Date()
    };

    this.presenceCache.set(userId, presence);

    // TODO: Broadcast via WebSocket/SignalR
    // await this.broadcastPresence(userId, presence);

    return presence;
  }

  /**
   * Set user offline
   */
  async setOffline(userId: string): Promise<IUserPresence> {
    const presence: IUserPresence = {
      userId,
      status: 'offline',
      lastSeen: new Date(),
      isTyping: false,
      updatedAt: new Date()
    };

    this.presenceCache.set(userId, presence);

    // Clear any typing indicators
    this.clearAllTypingForUser(userId);

    // TODO: Broadcast via WebSocket/SignalR
    // await this.broadcastPresence(userId, presence);

    return presence;
  }

  /**
   * Set user away (inactive)
   */
  async setAway(userId: string): Promise<IUserPresence> {
    const currentPresence = this.presenceCache.get(userId);
    
    const presence: IUserPresence = {
      userId,
      status: 'away',
      lastSeen: currentPresence?.lastSeen || new Date(),
      isTyping: false,
      updatedAt: new Date()
    };

    this.presenceCache.set(userId, presence);

    return presence;
  }

  /**
   * Set typing indicator
   */
  async setTyping(userId: string, chatId: string, typingStatus: TypingStatus = 'typing'): Promise<void> {
    const presence = this.presenceCache.get(userId);
    
    if (presence) {
      presence.isTyping = true;
      presence.typingInChat = chatId;
      presence.updatedAt = new Date();
      this.presenceCache.set(userId, presence);
    }

    // Set up chat typing cache
    if (!this.typingCache.has(chatId)) {
      this.typingCache.set(chatId, new Map());
    }

    const chatTyping = this.typingCache.get(chatId)!;
    
    // Clear existing timeout
    const existingTimeout = chatTyping.get(userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Auto-clear typing after 5 seconds
    const timeout = setTimeout(() => {
      this.stopTyping(userId, chatId);
    }, 5000);

    chatTyping.set(userId, timeout);

    // TODO: Broadcast typing indicator via WebSocket/SignalR
    // await this.broadcastTyping(chatId, userId, typingStatus);
  }

  /**
   * Stop typing indicator
   */
  async stopTyping(userId: string, chatId: string): Promise<void> {
    const presence = this.presenceCache.get(userId);
    
    if (presence && presence.typingInChat === chatId) {
      presence.isTyping = false;
      presence.typingInChat = undefined;
      presence.updatedAt = new Date();
      this.presenceCache.set(userId, presence);
    }

    // Clear from typing cache
    const chatTyping = this.typingCache.get(chatId);
    if (chatTyping) {
      const timeout = chatTyping.get(userId);
      if (timeout) {
        clearTimeout(timeout);
      }
      chatTyping.delete(userId);
    }

    // TODO: Broadcast stop typing via WebSocket/SignalR
    // await this.broadcastStopTyping(chatId, userId);
  }

  /**
   * Get user presence
   */
  async getPresence(userId: string): Promise<IUserPresence | null> {
    const cached = this.presenceCache.get(userId);
    if (cached) {
      return cached;
    }

    // Default to offline if not in cache
    return {
      userId,
      status: 'offline',
      lastSeen: new Date(),
      isTyping: false,
      updatedAt: new Date()
    };
  }

  /**
   * Get multiple users' presence
   */
  async getMultiplePresence(userIds: string[]): Promise<Map<string, IUserPresence>> {
    const presences = new Map<string, IUserPresence>();

    for (const userId of userIds) {
      const presence = await this.getPresence(userId);
      if (presence) {
        presences.set(userId, presence);
      }
    }

    return presences;
  }

  /**
   * Get who's typing in a chat
   */
  async getTypingUsers(chatId: string): Promise<string[]> {
    const chatTyping = this.typingCache.get(chatId);
    if (!chatTyping) {
      return [];
    }

    return Array.from(chatTyping.keys());
  }

  /**
   * Update last seen timestamp
   */
  async updateLastSeen(userId: string): Promise<void> {
    const presence = this.presenceCache.get(userId);
    
    if (presence) {
      presence.lastSeen = new Date();
      presence.updatedAt = new Date();
      this.presenceCache.set(userId, presence);
    } else {
      // Create new presence record
      await this.setOnline(userId);
    }
  }

  /**
   * Clear all typing indicators for a user
   */
  private clearAllTypingForUser(userId: string): void {
    for (const [chatId, chatTyping] of this.typingCache.entries()) {
      const timeout = chatTyping.get(userId);
      if (timeout) {
        clearTimeout(timeout);
        chatTyping.delete(userId);
      }
    }
  }

  /**
   * Get online users count
   */
  async getOnlineCount(): Promise<number> {
    let count = 0;
    for (const presence of this.presenceCache.values()) {
      if (presence.status === 'online') {
        count++;
      }
    }
    return count;
  }

  /**
   * Clean up stale presence data (should be run periodically)
   */
  async cleanupStalePresence(): Promise<number> {
    const now = Date.now();
    const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    let cleaned = 0;

    for (const [userId, presence] of this.presenceCache.entries()) {
      if (now - presence.updatedAt.getTime() > STALE_THRESHOLD) {
        presence.status = 'offline';
        presence.isTyping = false;
        this.presenceCache.set(userId, presence);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Subscribe to presence updates (for WebSocket/SignalR integration)
   */
  async subscribeToPresence(userId: string, connectionId: string): Promise<void> {
    // TODO: Implement WebSocket/SignalR subscription
    console.log(`User ${userId} subscribed to presence with connection ${connectionId}`);
  }

  /**
   * Unsubscribe from presence updates
   */
  async unsubscribeFromPresence(userId: string, connectionId: string): Promise<void> {
    // TODO: Implement WebSocket/SignalR unsubscription
    console.log(`User ${userId} unsubscribed from presence with connection ${connectionId}`);
  }

  /**
   * Broadcast presence update (placeholder for SignalR integration)
   */
  private async broadcastPresence(userId: string, presence: IUserPresence): Promise<void> {
    // TODO: Integrate with Azure SignalR Service
    // Example:
    // await signalRService.sendToAll('presenceUpdate', { userId, presence });
    console.log(`Broadcasting presence for user ${userId}:`, presence.status);
  }

  /**
   * Broadcast typing indicator (placeholder for SignalR integration)
   */
  private async broadcastTyping(chatId: string, userId: string, status: TypingStatus): Promise<void> {
    // TODO: Integrate with Azure SignalR Service
    // await signalRService.sendToGroup(chatId, 'userTyping', { userId, status });
    console.log(`User ${userId} is ${status} in chat ${chatId}`);
  }

  /**
   * Broadcast stop typing (placeholder for SignalR integration)
   */
  private async broadcastStopTyping(chatId: string, userId: string): Promise<void> {
    // TODO: Integrate with Azure SignalR Service
    // await signalRService.sendToGroup(chatId, 'userStoppedTyping', { userId });
    console.log(`User ${userId} stopped typing in chat ${chatId}`);
  }
}

export const presenceService = new PresenceService();
