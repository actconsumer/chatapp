/**
 * Repository Interfaces (Ports)
 * Define contracts for data access without implementation details
 * Following Clean Architecture / Hexagonal Architecture principles
 */

import { IUser, IUserProfile } from '../entities/User';
import { IMessage } from '../entities/Message';
import { IChat, IChatParticipant } from '../entities/Chat';
import { IStory } from '../entities/Story';
import { IOTP, OTPPurpose } from '../entities/OTP';

// ============= User Repository =============
export interface IUserRepository {
  create(user: IUser): Promise<IUser>;
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  update(id: string, data: Partial<IUser>): Promise<IUser>;
  delete(id: string): Promise<void>;
  updateLastSeen(userId: string, timestamp: Date): Promise<void>;
  updateOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  search(query: string, limit?: number): Promise<IUserProfile[]>;
  addRefreshToken(userId: string, token: string): Promise<void>;
  removeRefreshToken(userId: string, token: string): Promise<void>;
  findByRefreshToken(token: string): Promise<IUser | null>;
}

// ============= Chat Repository =============
export interface IChatRepository {
  create(chat: IChat): Promise<IChat>;
  findById(id: string): Promise<IChat | null>;
  findByParticipants(participantIds: string[]): Promise<IChat | null>;
  findByUserId(userId: string, limit?: number, offset?: number): Promise<IChat[]>;
  update(id: string, data: Partial<IChat>): Promise<IChat>;
  delete(id: string): Promise<void>;
  addParticipant(chatId: string, participant: IChatParticipant): Promise<void>;
  removeParticipant(chatId: string, userId: string): Promise<void>;
  updateParticipant(chatId: string, userId: string, data: Partial<IChatParticipant>): Promise<void>;
  updateLastMessage(chatId: string, message: IChat['lastMessage']): Promise<void>;
  markMessagesAsRead(chatId: string, userId: string, messageId: string): Promise<void>;
}

// ============= Message Repository =============
export interface IMessageRepository {
  create(message: IMessage): Promise<IMessage>;
  findById(id: string): Promise<IMessage | null>;
  findByChatId(chatId: string, limit?: number, offset?: number): Promise<IMessage[]>;
  findByChatIdBefore(chatId: string, beforeTimestamp: Date, limit?: number): Promise<IMessage[]>;
  update(id: string, data: Partial<IMessage>): Promise<IMessage>;
  delete(id: string): Promise<void>;
  deleteForUser(messageId: string, userId: string): Promise<void>;
  deleteForEveryone(messageId: string): Promise<void>;
  updateStatus(messageId: string, status: IMessage['status']): Promise<void>;
  addReaction(messageId: string, reaction: IMessage['reactions'][0]): Promise<void>;
  removeReaction(messageId: string, userId: string, emoji: string): Promise<void>;
  markAsDelivered(messageId: string, userId: string): Promise<void>;
  markAsRead(messageId: string, userId: string): Promise<void>;
  search(chatId: string, query: string, limit?: number): Promise<IMessage[]>;
  getUnreadCount(chatId: string, userId: string): Promise<number>;
}

// ============= Story Repository =============
export interface IStoryRepository {
  create(story: IStory): Promise<IStory>;
  findById(id: string): Promise<IStory | null>;
  findByUserId(userId: string): Promise<IStory[]>;
  findActiveStories(userId: string): Promise<IStory[]>;
  findFriendsActiveStories(userId: string): Promise<IStory[]>;
  update(id: string, data: Partial<IStory>): Promise<IStory>;
  delete(id: string): Promise<void>;
  addView(storyId: string, viewer: IStory['viewers'][0]): Promise<void>;
  addReaction(storyId: string, reaction: IStory['reactions'][0]): Promise<void>;
  deleteExpiredStories(): Promise<number>;
}

// ============= OTP Repository =============
export interface IOTPRepository {
  create(otp: IOTP): Promise<IOTP>;
  findById(id: string): Promise<IOTP | null>;
  findByEmailAndPurpose(email: string, purpose: OTPPurpose): Promise<IOTP | null>;
  findByUserIdAndPurpose(userId: string, purpose: OTPPurpose): Promise<IOTP | null>;
  update(id: string, data: Partial<IOTP>): Promise<IOTP>;
  delete(id: string): Promise<void>;
  deleteExpired(): Promise<number>;
  incrementAttempts(id: string): Promise<void>;
  markAsUsed(id: string): Promise<void>;
}

// ============= Generic Repository Interface =============
export interface IRepository<T> {
  create(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  findAll(limit?: number, offset?: number): Promise<T[]>;
}
