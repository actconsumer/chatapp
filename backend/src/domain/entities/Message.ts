/**
 * Message Domain Entity
 * Represents a single message in a chat or group conversation
 */

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'file' | 'location' | 'contact';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface IReaction {
  emoji: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface IMessageReply {
  messageId: string;
  text: string;
  senderId: string;
  senderName: string;
  mediaUrl?: string;
  mediaType?: MessageType;
}

export interface IMessageMention {
  userId: string;
  username: string;
  startIndex: number;
  length: number;
}

export interface IMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  
  // Content
  text?: string;
  mediaUrl?: string;
  mediaType?: MessageType;
  mediaThumbnail?: string;
  mediaMetadata?: {
    fileName?: string;
    fileSize?: number;
    duration?: number; // for audio/video
    width?: number;    // for images/video
    height?: number;   // for images/video
  };
  
  // Status and Tracking
  status: MessageStatus;
  timestamp: Date;
  deliveredTo: string[]; // User IDs who received the message
  readBy: string[];      // User IDs who read the message
  
  // Features
  reactions: IReaction[];
  replyTo?: IMessageReply;
  mentions: IMessageMention[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedFor: string[]; // User IDs for whom message is deleted
  
  // Encryption
  isEncrypted: boolean;
  encryptionKeyId?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export class Message implements IMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: MessageType;
  mediaThumbnail?: string;
  mediaMetadata?: IMessage['mediaMetadata'];
  status: MessageStatus;
  timestamp: Date;
  deliveredTo: string[];
  readBy: string[];
  reactions: IReaction[];
  replyTo?: IMessageReply;
  mentions: IMessageMention[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedFor: string[];
  isEncrypted: boolean;
  encryptionKeyId?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<IMessage>) {
    this.id = data.id || '';
    this.chatId = data.chatId || '';
    this.senderId = data.senderId || '';
    this.senderName = data.senderName || '';
    this.senderAvatar = data.senderAvatar;
    this.text = data.text;
    this.mediaUrl = data.mediaUrl;
    this.mediaType = data.mediaType;
    this.mediaThumbnail = data.mediaThumbnail;
    this.mediaMetadata = data.mediaMetadata;
    this.status = data.status || 'sending';
    this.timestamp = data.timestamp || new Date();
    this.deliveredTo = data.deliveredTo || [];
    this.readBy = data.readBy || [];
    this.reactions = data.reactions || [];
    this.replyTo = data.replyTo;
    this.mentions = data.mentions || [];
    this.isEdited = data.isEdited || false;
    this.editedAt = data.editedAt;
    this.isDeleted = data.isDeleted || false;
    this.deletedAt = data.deletedAt;
    this.deletedFor = data.deletedFor || [];
    this.isEncrypted = data.isEncrypted || false;
    this.encryptionKeyId = data.encryptionKeyId;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  addReaction(reaction: IReaction): void {
    const existingIndex = this.reactions.findIndex(
      r => r.userId === reaction.userId && r.emoji === reaction.emoji
    );
    
    if (existingIndex >= 0) {
      this.reactions.splice(existingIndex, 1);
    } else {
      this.reactions.push(reaction);
    }
    this.updatedAt = new Date();
  }

  markAsDelivered(userId: string): void {
    if (!this.deliveredTo.includes(userId)) {
      this.deliveredTo.push(userId);
      if (this.status === 'sent') {
        this.status = 'delivered';
      }
      this.updatedAt = new Date();
    }
  }

  markAsRead(userId: string): void {
    if (!this.readBy.includes(userId)) {
      this.readBy.push(userId);
      this.status = 'read';
      this.updatedAt = new Date();
    }
  }

  edit(newText: string): void {
    this.text = newText;
    this.isEdited = true;
    this.editedAt = new Date();
    this.updatedAt = new Date();
  }

  deleteForUser(userId: string): void {
    if (!this.deletedFor.includes(userId)) {
      this.deletedFor.push(userId);
      this.updatedAt = new Date();
    }
  }

  deleteForEveryone(): void {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  toJSON() {
    return { ...this };
  }
}
