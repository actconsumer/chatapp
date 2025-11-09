/**
 * Chat Domain Entity
 * Represents a conversation (1-on-1 or group chat)
 */

export type ChatType = 'direct' | 'group';

export interface IChatParticipant {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  
  // Permissions
  permissions: {
    canSendMessages: boolean;
    canAddMembers: boolean;
    canRemoveMembers: boolean;
    canEditGroupInfo: boolean;
    canDeleteMessages: boolean;
  };
  
  // Tracking
  lastReadMessageId?: string;
  lastReadAt?: Date;
  notificationsMuted: boolean;
  mutedUntil?: Date;
}

export interface IChat {
  id: string;
  type: ChatType;
  
  // Group-specific fields
  name?: string;
  description?: string;
  avatar?: string;
  
  // Participants
  participants: IChatParticipant[];
  createdBy: string;
  
  // Last message info
  lastMessage?: {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    type: string;
  };
  
  // Settings
  settings: {
    isEncrypted: boolean;
    onlyAdminsCanMessage: boolean;
    onlyAdminsCanAddMembers: boolean;
    disappearingMessages: boolean;
    disappearingMessagesDuration?: number; // in seconds
  };
  
  // Metadata
  messageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Chat implements IChat {
  id: string;
  type: ChatType;
  name?: string;
  description?: string;
  avatar?: string;
  participants: IChatParticipant[];
  createdBy: string;
  lastMessage?: IChat['lastMessage'];
  settings: IChat['settings'];
  messageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(data: Partial<IChat>) {
    this.id = data.id || '';
    this.type = data.type || 'direct';
    this.name = data.name;
    this.description = data.description;
    this.avatar = data.avatar;
    this.participants = data.participants || [];
    this.createdBy = data.createdBy || '';
    this.lastMessage = data.lastMessage;
    this.settings = data.settings || {
      isEncrypted: true,
      onlyAdminsCanMessage: false,
      onlyAdminsCanAddMembers: false,
      disappearingMessages: false,
    };
    this.messageCount = data.messageCount || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.deletedAt = data.deletedAt;
  }

  addParticipant(participant: IChatParticipant): void {
    const exists = this.participants.some(p => p.userId === participant.userId);
    if (!exists) {
      this.participants.push(participant);
      this.updatedAt = new Date();
    }
  }

  removeParticipant(userId: string): void {
    const index = this.participants.findIndex(p => p.userId === userId);
    if (index >= 0) {
      this.participants[index].isActive = false;
      this.participants[index].leftAt = new Date();
      this.updatedAt = new Date();
    }
  }

  updateLastMessage(message: IChat['lastMessage']): void {
    this.lastMessage = message;
    this.messageCount += 1;
    this.updatedAt = new Date();
  }

  isUserParticipant(userId: string): boolean {
    return this.participants.some(p => p.userId === userId && p.isActive);
  }

  isUserAdmin(userId: string): boolean {
    const participant = this.participants.find(p => p.userId === userId && p.isActive);
    return participant?.role === 'admin';
  }

  getParticipantById(userId: string): IChatParticipant | undefined {
    return this.participants.find(p => p.userId === userId && p.isActive);
  }

  muteNotifications(userId: string, duration?: number): void {
    const participant = this.participants.find(p => p.userId === userId);
    if (participant) {
      participant.notificationsMuted = true;
      if (duration) {
        participant.mutedUntil = new Date(Date.now() + duration * 1000);
      }
      this.updatedAt = new Date();
    }
  }

  toJSON() {
    return { ...this };
  }
}
