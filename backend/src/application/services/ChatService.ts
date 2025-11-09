/**
 * Chat Service
 * Professional-grade chat management service for Project Chat
 * Handles conversations (1-on-1 and group chats) with Azure Cosmos DB
 */

import { cosmosDBClient } from '../../infrastructure/database/cosmosdb.config';
import { azureBlobStorage } from '../../infrastructure/storage/blob.config';
import { AppError } from '../middleware/error.middleware';
import { Chat, IChat, IChatParticipant } from '../../domain/entities/Chat';
import { IUser } from '../../domain/entities/User';
import { v4 as uuidv4 } from 'uuid';

export class ChatService {
  private readonly chatsContainer = 'chats';
  private readonly usersContainer = 'users';

  /**
   * Helper: Get active participant IDs
   */
  private getParticipantIds(participants: IChatParticipant[]): string[] {
    return participants.filter(p => p.isActive).map(p => p.userId);
  }

  /**
   * Helper: Create participant object
   */
  private async createParticipant(
    userId: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<IChatParticipant> {
    const user = await cosmosDBClient.getItem<IUser>(this.usersContainer, userId);
    if (!user) {
      throw new AppError(`User ${userId} not found`, 404);
    }

    return {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      role,
      joinedAt: new Date(),
      isActive: true,
      permissions: {
        canSendMessages: true,
        canAddMembers: role === 'admin',
        canRemoveMembers: role === 'admin',
        canEditGroupInfo: role === 'admin',
        canDeleteMessages: role === 'admin'
      },
      notificationsMuted: false
    };
  }

  /**
   * Create a new chat (1-on-1 or group)
   */
  async createChat(
    creatorId: string,
    participantIds: string[],
    type: 'direct' | 'group' = 'direct',
    name?: string,
    description?: string
  ): Promise<IChat> {
    // Validate creator exists
    const creator = await cosmosDBClient.getItem<IUser>(this.usersContainer, creatorId);
    if (!creator) {
      throw new AppError('Creator not found', 404);
    }

    // Check for existing direct chat
    if (type === 'direct') {
      if (participantIds.length !== 1) {
        throw new AppError('Direct chat must have exactly 2 participants', 400);
      }

      const existingChats = await cosmosDBClient.queryItems<IChat>(
        this.chatsContainer,
        'SELECT * FROM c WHERE c.type = @type AND c.isActive = true',
        [{ name: '@type', value: 'direct' }]
      );

      const otherUserId = participantIds[0];
      const directChat = existingChats.find(chat => {
        const activeParticipants = chat.participants.filter(p => p.isActive);
        return (
          activeParticipants.length === 2 &&
          activeParticipants.some(p => p.userId === creatorId) &&
          activeParticipants.some(p => p.userId === otherUserId)
        );
      });

      if (directChat) {
        return directChat;
      }
    }

    // Create participants array
    const participants: IChatParticipant[] = [];
    
    // Add creator as admin
    participants.push(await this.createParticipant(creatorId, type === 'group' ? 'admin' : 'member'));

    // Add other participants
    for (const participantId of participantIds) {
      if (participantId !== creatorId) {
        participants.push(await this.createParticipant(participantId, 'member'));
      }
    }

    // Create chat using Chat class
    const chatData = new Chat({
      id: uuidv4(),
      type,
      participants,
      createdBy: creatorId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      messageCount: 0,
      settings: {
        isEncrypted: true,
        onlyAdminsCanMessage: false,
        onlyAdminsCanAddMembers: type === 'group',
        disappearingMessages: false
      },
      ...(type === 'group' && {
        name: name || 'New Group',
        description
      })
    });

    return await cosmosDBClient.upsertItem<IChat>(this.chatsContainer, chatData);
  }

  /**
   * Get chat by ID
   */
  async getChat(chatId: string, userId: string): Promise<IChat> {
    const chat = await cosmosDBClient.getItem<IChat>(this.chatsContainer, chatId);

    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    // Check if user is active participant
    const isParticipant = chat.participants.some(
      p => p.userId === userId && p.isActive
    );

    if (!isParticipant) {
      throw new AppError('Not authorized to view this chat', 403);
    }

    return chat;
  }

  /**
   * Get all chats for a user (with pagination)
   */
  async getUserChats(
    userId: string,
    limit: number = 50,
    continuationToken?: string
  ): Promise<{ chats: IChat[]; continuationToken?: string }> {
    // Query all chats where user is an active participant
    const allChats = await cosmosDBClient.queryItems<IChat>(
      this.chatsContainer,
      'SELECT * FROM c WHERE c.isActive = true ORDER BY c.updatedAt DESC',
      []
    );

    // Filter chats where user is active participant
    const userChats = allChats.filter(chat =>
      chat.participants.some(p => p.userId === userId && p.isActive)
    );

    // Simple pagination (in production, use Cosmos DB continuation tokens)
    const startIndex = continuationToken ? parseInt(continuationToken) : 0;
    const endIndex = startIndex + limit;
    const paginatedChats = userChats.slice(startIndex, endIndex);

    return {
      chats: paginatedChats,
      continuationToken: endIndex < userChats.length ? endIndex.toString() : undefined
    };
  }

  /**
   * Update chat (group name, description, settings)
   */
  async updateChat(
    chatId: string,
    userId: string,
    updates: {
      name?: string;
      description?: string;
      settings?: Partial<IChat['settings']>;
    }
  ): Promise<IChat> {
    const chat = await this.getChat(chatId, userId);

    if (chat.type !== 'group') {
      throw new AppError('Can only update group chats', 400);
    }

    // Check permissions
    const participant = chat.participants.find(p => p.userId === userId && p.isActive);
    if (!participant) {
      throw new AppError('Not a chat participant', 403);
    }

    if (!participant.permissions.canEditGroupInfo && participant.role !== 'admin') {
      throw new AppError('No permission to edit group info', 403);
    }

    // Apply updates
    if (updates.name) chat.name = updates.name;
    if (updates.description !== undefined) chat.description = updates.description;
    if (updates.settings) {
      chat.settings = { ...chat.settings, ...updates.settings };
    }
    chat.updatedAt = new Date();

    return await cosmosDBClient.upsertItem<IChat>(this.chatsContainer, chat);
  }

  /**
   * Upload group avatar
   */
  async uploadGroupAvatar(
    chatId: string,
    userId: string,
    fileBuffer: Buffer,
    fileName: string
  ): Promise<string> {
    const chat = await this.getChat(chatId, userId);

    if (chat.type !== 'group') {
      throw new AppError('Can only set avatar for group chats', 400);
    }

    // Check permissions
    const participant = chat.participants.find(p => p.userId === userId && p.isActive);
    if (!participant?.permissions.canEditGroupInfo && participant?.role !== 'admin') {
      throw new AppError('No permission to change group avatar', 403);
    }

    // Delete old avatar
    if (chat.avatar) {
      try {
        const oldFileName = chat.avatar.split('/').pop();
        if (oldFileName) {
          await azureBlobStorage.deleteBlob('avatars', oldFileName);
        }
      } catch (error) {
        // Ignore deletion errors
      }
    }

    // Upload new avatar
    const blobName = `group_${chatId}_${Date.now()}_${fileName}`;
    const avatarUrl = await azureBlobStorage.uploadBlob(
      'avatars',
      blobName,
      fileBuffer,
      'image/jpeg'
    );

    // Update chat
    chat.avatar = avatarUrl;
    chat.updatedAt = new Date();
    await cosmosDBClient.upsertItem(this.chatsContainer, chat);

    return avatarUrl;
  }

  /**
   * Add participant to group chat
   */
  async addParticipant(
    chatId: string,
    addedBy: string,
    newParticipantId: string
  ): Promise<IChat> {
    const chat = await this.getChat(chatId, addedBy);

    if (chat.type !== 'group') {
      throw new AppError('Can only add participants to group chats', 400);
    }

    // Check if already a participant
    if (chat.participants.some(p => p.userId === newParticipantId && p.isActive)) {
      throw new AppError('User is already a participant', 400);
    }

    // Check permissions
    const adder = chat.participants.find(p => p.userId === addedBy && p.isActive);
    if (!adder) {
      throw new AppError('Not a chat participant', 403);
    }

    if (chat.settings.onlyAdminsCanAddMembers && adder.role !== 'admin') {
      throw new AppError('Only admins can add members', 403);
    }

    if (!adder.permissions.canAddMembers) {
      throw new AppError('No permission to add members', 403);
    }

    // Add new participant
    const newParticipant = await this.createParticipant(newParticipantId, 'member');
    chat.participants.push(newParticipant);
    chat.updatedAt = new Date();

    return await cosmosDBClient.upsertItem<IChat>(this.chatsContainer, chat);
  }

  /**
   * Remove participant from group chat
   */
  async removeParticipant(
    chatId: string,
    removedBy: string,
    participantToRemove: string
  ): Promise<IChat> {
    const chat = await this.getChat(chatId, removedBy);

    if (chat.type !== 'group') {
      throw new AppError('Can only remove participants from group chats', 400);
    }

    const remover = chat.participants.find(p => p.userId === removedBy && p.isActive);
    const toRemove = chat.participants.find(p => p.userId === participantToRemove && p.isActive);

    if (!remover || !toRemove) {
      throw new AppError('Invalid participant', 400);
    }

    // Check permissions (users can leave, admins can remove members)
    if (removedBy !== participantToRemove) {
      if (remover.role !== 'admin' || !remover.permissions.canRemoveMembers) {
        throw new AppError('No permission to remove members', 403);
      }
      if (toRemove.role === 'admin' && remover.role !== 'admin') {
        throw new AppError('Cannot remove admin', 403);
      }
    }

    // Mark as inactive instead of removing
    toRemove.isActive = false;
    toRemove.leftAt = new Date();
    chat.updatedAt = new Date();

    // If no active participants, deactivate chat
    const activeParticipants = chat.participants.filter(p => p.isActive);
    if (activeParticipants.length === 0) {
      chat.isActive = false;
    }

    return await cosmosDBClient.upsertItem<IChat>(this.chatsContainer, chat);
  }

  /**
   * Update participant role
   */
  async updateParticipantRole(
    chatId: string,
    updatedBy: string,
    participantId: string,
    newRole: 'member' | 'admin'
  ): Promise<IChat> {
    const chat = await this.getChat(chatId, updatedBy);

    if (chat.type !== 'group') {
      throw new AppError('Can only update roles in group chats', 400);
    }

    const updater = chat.participants.find(p => p.userId === updatedBy && p.isActive);
    const toUpdate = chat.participants.find(p => p.userId === participantId && p.isActive);

    if (!updater || !toUpdate) {
      throw new AppError('Invalid participant', 400);
    }

    // Only admins can change roles
    if (updater.role !== 'admin') {
      throw new AppError('Only admins can change roles', 403);
    }

    // Update role and permissions
    toUpdate.role = newRole;
    toUpdate.permissions = {
      canSendMessages: true,
      canAddMembers: newRole === 'admin',
      canRemoveMembers: newRole === 'admin',
      canEditGroupInfo: newRole === 'admin',
      canDeleteMessages: newRole === 'admin'
    };
    chat.updatedAt = new Date();

    return await cosmosDBClient.upsertItem<IChat>(this.chatsContainer, chat);
  }

  /**
   * Mute/unmute chat notifications
   */
  async toggleMute(
    chatId: string,
    userId: string,
    duration?: number
  ): Promise<IChat> {
    const chat = await this.getChat(chatId, userId);

    const participant = chat.participants.find(p => p.userId === userId && p.isActive);
    if (!participant) {
      throw new AppError('Not a chat participant', 403);
    }

    participant.notificationsMuted = !participant.notificationsMuted;
    if (participant.notificationsMuted && duration) {
      participant.mutedUntil = new Date(Date.now() + duration * 1000);
    } else {
      participant.mutedUntil = undefined;
    }
    chat.updatedAt = new Date();

    return await cosmosDBClient.upsertItem<IChat>(this.chatsContainer, chat);
  }

  /**
   * Mark messages as read in chat
   */
  async markAsRead(
    chatId: string,
    userId: string,
    lastReadMessageId: string
  ): Promise<IChat> {
    const chat = await this.getChat(chatId, userId);

    const participant = chat.participants.find(p => p.userId === userId && p.isActive);
    if (!participant) {
      throw new AppError('Not a chat participant', 403);
    }

    participant.lastReadMessageId = lastReadMessageId;
    participant.lastReadAt = new Date();
    chat.updatedAt = new Date();

    return await cosmosDBClient.upsertItem<IChat>(this.chatsContainer, chat);
  }

  /**
   * Delete/archive chat
   */
  async deleteChat(chatId: string, userId: string): Promise<void> {
    const chat = await this.getChat(chatId, userId);

    // For group chats, only admin can delete
    if (chat.type === 'group') {
      const participant = chat.participants.find(p => p.userId === userId && p.isActive);
      if (!participant || participant.role !== 'admin') {
        throw new AppError('Only admins can delete the group', 403);
      }
    }

    chat.isActive = false;
    chat.deletedAt = new Date();
    chat.updatedAt = new Date();
    await cosmosDBClient.upsertItem(this.chatsContainer, chat);
  }

  /**
   * Search chats by name or participant
   */
  async searchChats(
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<IChat[]> {
    const allChats = await cosmosDBClient.queryItems<IChat>(
      this.chatsContainer,
      'SELECT * FROM c WHERE c.isActive = true',
      []
    );

    // Filter user's chats
    const userChats = allChats.filter(chat =>
      chat.participants.some(p => p.userId === userId && p.isActive)
    );

    // Search by name or participant name
    const searchLower = query.toLowerCase();
    return userChats
      .filter(chat => {
        if (chat.name?.toLowerCase().includes(searchLower)) return true;
        return chat.participants.some(
          p =>
            p.displayName.toLowerCase().includes(searchLower) ||
            p.username.toLowerCase().includes(searchLower)
        );
      })
      .slice(0, limit);
  }

  /**
   * Get chat statistics
   */
  async getChatStats(chatId: string, userId: string): Promise<{
    totalMessages: number;
    totalParticipants: number;
    activeParticipants: number;
    admins: number;
  }> {
    const chat = await this.getChat(chatId, userId);

    const activeParticipants = chat.participants.filter(p => p.isActive);
    const admins = activeParticipants.filter(p => p.role === 'admin');

    return {
      totalMessages: chat.messageCount,
      totalParticipants: chat.participants.length,
      activeParticipants: activeParticipants.length,
      admins: admins.length
    };
  }
}

export const chatService = new ChatService();
