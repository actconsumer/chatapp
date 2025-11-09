/**
 * Notification Domain Entity
 * Represents in-app notifications for users
 */

export type NotificationType = 
  | 'message' 
  | 'friend_request' 
  | 'friend_accepted' 
  | 'group_invite'
  | 'group_message'
  | 'call_missed'
  | 'story_view'
  | 'story_reply'
  | 'mention';

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    chatId?: string;
    messageId?: string;
    senderId?: string;
    senderName?: string;
    senderAvatar?: string;
    storyId?: string;
    callId?: string;
    [key: string]: any;
  };
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export class Notification implements INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: INotification['data'];
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;

  constructor(data: Partial<INotification>) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.type = data.type || 'message';
    this.title = data.title || '';
    this.body = data.body || '';
    this.data = data.data;
    this.isRead = data.isRead || false;
    this.readAt = data.readAt;
    this.createdAt = data.createdAt || new Date();
  }

  markAsRead(): void {
    this.isRead = true;
    this.readAt = new Date();
  }
}

export interface INotificationPreferences {
  userId: string;
  messages: boolean;
  friendRequests: boolean;
  groupInvites: boolean;
  calls: boolean;
  stories: boolean;
  mentions: boolean;
  sound: boolean;
  vibration: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}
