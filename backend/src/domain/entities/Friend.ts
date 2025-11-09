/**
 * Friend Domain Entity
 * Represents friend relationships between users
 */

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface IFriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverUsername: string;
  receiverDisplayName: string;
  receiverAvatar?: string;
  status: FriendRequestStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
}

export interface IFriend {
  id: string;
  userId: string;
  friendId: string;
  friendUsername: string;
  friendDisplayName: string;
  friendAvatar?: string;
  friendsSince: Date;
  isFavorite: boolean;
  isBlocked: boolean;
  blockedAt?: Date;
  lastInteraction?: Date;
}

export class FriendRequest implements IFriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverUsername: string;
  receiverDisplayName: string;
  receiverAvatar?: string;
  status: FriendRequestStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;

  constructor(data: Partial<IFriendRequest>) {
    this.id = data.id || '';
    this.senderId = data.senderId || '';
    this.senderUsername = data.senderUsername || '';
    this.senderDisplayName = data.senderDisplayName || '';
    this.senderAvatar = data.senderAvatar;
    this.receiverId = data.receiverId || '';
    this.receiverUsername = data.receiverUsername || '';
    this.receiverDisplayName = data.receiverDisplayName || '';
    this.receiverAvatar = data.receiverAvatar;
    this.status = data.status || 'pending';
    this.message = data.message;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.respondedAt = data.respondedAt;
  }
}

export class Friend implements IFriend {
  id: string;
  userId: string;
  friendId: string;
  friendUsername: string;
  friendDisplayName: string;
  friendAvatar?: string;
  friendsSince: Date;
  isFavorite: boolean;
  isBlocked: boolean;
  blockedAt?: Date;
  lastInteraction?: Date;

  constructor(data: Partial<IFriend>) {
    this.id = data.id || `${data.userId}_${data.friendId}`;
    this.userId = data.userId || '';
    this.friendId = data.friendId || '';
    this.friendUsername = data.friendUsername || '';
    this.friendDisplayName = data.friendDisplayName || '';
    this.friendAvatar = data.friendAvatar;
    this.friendsSince = data.friendsSince || new Date();
    this.isFavorite = data.isFavorite || false;
    this.isBlocked = data.isBlocked || false;
    this.blockedAt = data.blockedAt;
    this.lastInteraction = data.lastInteraction;
  }
}
