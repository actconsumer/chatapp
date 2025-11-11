import { io, Socket } from 'socket.io-client';
import { CURRENT_API } from './config';
import { getToken } from './auth.service';

// Types
interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  createdAt: string;
}

interface TypingData {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

interface PresenceData {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

interface CallSignalData {
  callId: string;
  type: 'offer' | 'answer' | 'ice-candidate' | 'end';
  signal: any;
  from: string;
  to: string;
}

interface MessageReadData {
  conversationId: string;
  messageId: string;
  userId: string;
}

interface StoryData {
  id: string;
  userId: string;
  type: 'image' | 'video';
  mediaUrl: string;
  createdAt: string;
}

type EventCallback = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * Initialize socket connection
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    try {
      const token = await getToken();
      
      if (!token) {
        console.log('No auth token - skipping socket connection for now');
        // TODO: Connect to Firebase backend with proper authentication
        return;
      }

      // Use base URL without /api/v1 path for socket connection
      const socketUrl = CURRENT_API.BASE_URL;

      this.socket = io(socketUrl, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventHandlers();
      
      console.log('Socket connection initiated');
    } catch (error) {
      console.error('Socket connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.eventListeners.clear();
      console.log('Socket disconnected');
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Setup default event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.emit('socket:connected', { socketId: this.socket?.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.emit('socket:disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('socket:error', { error });
    });

    // Message events
    this.socket.on('message:new', (data: MessageData) => {
      this.emit('message:new', data);
    });

    this.socket.on('message:updated', (data: MessageData) => {
      this.emit('message:updated', data);
    });

    this.socket.on('message:deleted', (data: { messageId: string; conversationId: string }) => {
      this.emit('message:deleted', data);
    });

    this.socket.on('message:read', (data: MessageReadData) => {
      this.emit('message:read', data);
    });

    // Typing events
    this.socket.on('typing:start', (data: TypingData) => {
      this.emit('typing:start', data);
    });

    this.socket.on('typing:stop', (data: TypingData) => {
      this.emit('typing:stop', data);
    });

    // Presence events
    this.socket.on('user:online', (data: PresenceData) => {
      this.emit('user:online', data);
    });

    this.socket.on('user:offline', (data: PresenceData) => {
      this.emit('user:offline', data);
    });

    // Call events
    this.socket.on('call:incoming', (data: CallSignalData) => {
      this.emit('call:incoming', data);
    });

    this.socket.on('call:signal', (data: CallSignalData) => {
      this.emit('call:signal', data);
    });

    this.socket.on('call:ended', (data: { callId: string }) => {
      this.emit('call:ended', data);
    });

    this.socket.on('call:participant-joined', (data: any) => {
      this.emit('call:participant-joined', data);
    });

    this.socket.on('call:participant-left', (data: any) => {
      this.emit('call:participant-left', data);
    });

    this.socket.on('call:participant-muted', (data: any) => {
      this.emit('call:participant-muted', data);
    });

    this.socket.on('call:participant-speaking', (data: any) => {
      this.emit('call:participant-speaking', data);
    });

    // Story events
    this.socket.on('story:new', (data: StoryData) => {
      this.emit('story:new', data);
    });

    // Notification events
    this.socket.on('notification:new', (data: any) => {
      this.emit('notification:new', data);
    });

    // Chat & group events
    this.socket.on('chat:created', (data: any) => {
      this.emit('chat:created', data);
    });

    this.socket.on('chat:updated', (data: any) => {
      this.emit('chat:updated', data);
    });

    this.socket.on('chat:deleted', (data: { chatId: string }) => {
      this.emit('chat:deleted', data);
    });

    this.socket.on('group:created', (data: any) => {
      this.emit('group:created', data);
    });

    this.socket.on('group:updated', (data: any) => {
      this.emit('group:updated', data);
    });

    this.socket.on('group:deleted', (data: { groupId: string }) => {
      this.emit('group:deleted', data);
    });
  }

  /**
   * Emit event to server
   */
  send(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot send event:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Listen to socket events
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: EventCallback): void {
    if (!callback) {
      this.eventListeners.delete(event);
      return;
    }

    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  /**
   * Emit event to local listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: string): void {
    this.send('conversation:join', { conversationId });
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: string): void {
    this.send('conversation:leave', { conversationId });
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean): void {
    this.send('typing', { conversationId, isTyping });
  }

  /**
   * Send message read receipt
   */
  sendMessageRead(conversationId: string, messageId: string): void {
    this.send('message:read', { conversationId, messageId });
  }

  /**
   * Update user presence
   */
  updatePresence(status: 'online' | 'offline' | 'away'): void {
    this.send('presence:update', { status });
  }

  /**
   * Send call signal (WebRTC)
   */
  sendCallSignal(data: CallSignalData): void {
    this.send('call:signal', data);
  }

  /**
   * Join call room
   */
  joinCall(callId: string): void {
    this.send('call:join', { callId });
  }

  /**
   * Leave call room
   */
  leaveCall(callId: string): void {
    this.send('call:leave', { callId });
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Export class for testing or multiple instances if needed
export default SocketService;