/**
 * Message Service
 * Professional-grade message handling service for Project Chat
 * Handles sending, editing, deleting, reactions, and message delivery
 */

import { cosmosDBClient } from '../../infrastructure/database/cosmosdb.config';
import { azureBlobStorage } from '../../infrastructure/storage/blob.config';
import { AppError } from '../middleware/error.middleware';
import { Message, IMessage, IReaction, IMessageReply, MessageType } from '../../domain/entities/Message';
import { IChat } from '../../domain/entities/Chat';
import { IUser } from '../../domain/entities/User';
import { v4 as uuidv4 } from 'uuid';

export class MessageService {
  private readonly messagesContainer = 'messages';
  private readonly chatsContainer = 'chats';
  private readonly usersContainer = 'users';

  /**
   * Send a new text or media message
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    text?: string,
    mediaUrl?: string,
    mediaType?: MessageType,
    replyTo?: IMessageReply
  ): Promise<IMessage> {
    // Verify chat exists and user is participant
    const chat = await cosmosDBClient.getItem<IChat>(this.chatsContainer, chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    const participant = chat.participants.find(p => p.userId === senderId && p.isActive);
    if (!participant) {
      throw new AppError('Not a chat participant', 403);
    }

    // Check permissions for group chats
    if (chat.type === 'group' && chat.settings.onlyAdminsCanMessage) {
      if (participant.role !== 'admin') {
        throw new AppError('Only admins can post in this group', 403);
      }
    }

    if (!participant.permissions.canSendMessages) {
      throw new AppError('No permission to send messages', 403);
    }

    // Get sender details
    const sender = await cosmosDBClient.getItem<IUser>(this.usersContainer, senderId);
    if (!sender) {
      throw new AppError('Sender not found', 404);
    }

    // Validate message content
    if (!text && !mediaUrl) {
      throw new AppError('Message must have text or media', 400);
    }

    // Create message using Message class
    const messageData = new Message({
      id: uuidv4(),
      chatId,
      senderId,
      senderName: sender.displayName,
      senderAvatar: sender.avatar,
      text,
      mediaUrl,
      mediaType,
      status: 'sent',
      timestamp: new Date(),
      deliveredTo: [],
      readBy: [],
      reactions: [],
      mentions: [],
      isEdited: false,
      isDeleted: false,
      deletedFor: [],
      isEncrypted: chat.settings.isEncrypted,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(replyTo && { replyTo })
    });

    const savedMessage = await cosmosDBClient.upsertItem<IMessage>(
      this.messagesContainer,
      messageData
    );

    // Update chat's last message and message count
    chat.lastMessage = {
      id: savedMessage.id,
      text: savedMessage.text || '[Media]',
      senderId: savedMessage.senderId,
      senderName: savedMessage.senderName,
      timestamp: savedMessage.timestamp,
      type: savedMessage.mediaType || 'text'
    };
    chat.messageCount += 1;
    chat.updatedAt = new Date();
    await cosmosDBClient.upsertItem(this.chatsContainer, chat);

    return savedMessage;
  }

  /**
   * Upload media (image, video, audio, file) and return URL
   */
  async uploadMedia(
    chatId: string,
    userId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{
    url: string;
    type: MessageType;
    metadata: {
      fileName: string;
      fileSize: number;
      mimeType: string;
    };
  }> {
    // Verify chat access
    const chat = await cosmosDBClient.getItem<IChat>(this.chatsContainer, chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    const isParticipant = chat.participants.some(p => p.userId === userId && p.isActive);
    if (!isParticipant) {
      throw new AppError('Not authorized', 403);
    }

    // Determine media type and container
    let container = 'documents';
    let type: MessageType = 'file';

    if (mimeType.startsWith('image/')) {
      container = 'media';
      type = 'image';
    } else if (mimeType.startsWith('video/')) {
      container = 'media';
      type = 'video';
    } else if (mimeType.startsWith('audio/')) {
      container = 'media';
      type = 'voice';
    }

    // Upload to Azure Blob Storage
    const blobName = `${chatId}/${uuidv4()}_${fileName}`;
    const url = await azureBlobStorage.uploadBlob(container, blobName, fileBuffer, mimeType);

    return {
      url,
      type,
      metadata: {
        fileName,
        fileSize: fileBuffer.length,
        mimeType
      }
    };
  }

  /**
   * Get messages for a chat (paginated)
   */
  async getMessages(
    chatId: string,
    userId: string,
    limit: number = 50,
    beforeTimestamp?: Date
  ): Promise<IMessage[]> {
    // Verify chat access
    const chat = await cosmosDBClient.getItem<IChat>(this.chatsContainer, chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    const isParticipant = chat.participants.some(p => p.userId === userId && p.isActive);
    if (!isParticipant) {
      throw new AppError('Not authorized', 403);
    }

    // Build query
    let query = 'SELECT * FROM c WHERE c.chatId = @chatId AND c.isDeleted = false';
    const parameters: any[] = [{ name: '@chatId', value: chatId }];

    if (beforeTimestamp) {
      query += ' AND c.timestamp < @before';
      parameters.push({ name: '@before', value: beforeTimestamp.toISOString() });
    }

    query += ' ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit';
    parameters.push({ name: '@limit', value: limit });

    const messages = await cosmosDBClient.queryItems<IMessage>(
      this.messagesContainer,
      query,
      parameters
    );

    // Filter out messages deleted for this user
    const filteredMessages = messages.filter(msg => !msg.deletedFor.includes(userId));

    return filteredMessages.reverse(); // Return in ascending order (oldest first)
  }

  /**
   * Get a single message
   */
  async getMessage(messageId: string, userId: string): Promise<IMessage> {
    const message = await cosmosDBClient.getItem<IMessage>(this.messagesContainer, messageId);

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    // Verify user has access to the chat
    const chat = await cosmosDBClient.getItem<IChat>(this.chatsContainer, message.chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    const isParticipant = chat.participants.some(p => p.userId === userId && p.isActive);
    if (!isParticipant) {
      throw new AppError('Not authorized', 403);
    }

    // Check if message is deleted for this user
    if (message.deletedFor.includes(userId)) {
      throw new AppError('Message not found', 404);
    }

    return message;
  }

  /**
   * Edit a message
   */
  async editMessage(
    messageId: string,
    userId: string,
    newText: string
  ): Promise<IMessage> {
    const message = await this.getMessage(messageId, userId);

    if (message.senderId !== userId) {
      throw new AppError('Can only edit your own messages', 403);
    }

    if (message.isDeleted) {
      throw new AppError('Cannot edit deleted messages', 400);
    }

    // Use Message class method
    const messageInstance = new Message(message);
    messageInstance.edit(newText);

    return await cosmosDBClient.upsertItem<IMessage>(this.messagesContainer, messageInstance);
  }

  /**
   * Delete message for everyone (sender or admin only)
   */
  async deleteMessageForEveryone(messageId: string, userId: string): Promise<void> {
    const message = await this.getMessage(messageId, userId);

    // Check permissions
    const chat = await cosmosDBClient.getItem<IChat>(this.chatsContainer, message.chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    const participant = chat.participants.find(p => p.userId === userId && p.isActive);
    const isAdmin = participant && participant.role === 'admin';
    const isSender = message.senderId === userId;

    if (!isSender && !isAdmin) {
      throw new AppError('Not authorized to delete this message', 403);
    }

    // Use Message class method
    const messageInstance = new Message(message);
    messageInstance.deleteForEveryone();

    await cosmosDBClient.upsertItem(this.messagesContainer, messageInstance);
  }

  /**
   * Delete message for me only
   */
  async deleteMessageForMe(messageId: string, userId: string): Promise<void> {
    const message = await this.getMessage(messageId, userId);

    // Use Message class method
    const messageInstance = new Message(message);
    messageInstance.deleteForUser(userId);

    await cosmosDBClient.upsertItem(this.messagesContainer, messageInstance);
  }

  /**
   * Add reaction to a message
   */
  async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<IMessage> {
    const message = await this.getMessage(messageId, userId);

    // Get user details
    const user = await cosmosDBClient.getItem<IUser>(this.usersContainer, userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.userId === userId && r.emoji === emoji
    );

    if (existingReaction) {
      throw new AppError('Already reacted with this emoji', 400);
    }

    // Add reaction using Message class method
    const messageInstance = new Message(message);
    const reaction: IReaction = {
      emoji,
      userId,
      userName: user.displayName,
      timestamp: new Date()
    };
    messageInstance.addReaction(reaction);

    return await cosmosDBClient.upsertItem<IMessage>(this.messagesContainer, messageInstance);
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<IMessage> {
    const message = await this.getMessage(messageId, userId);

    // Find and remove reaction
    const messageInstance = new Message(message);
    messageInstance.reactions = messageInstance.reactions.filter(
      r => !(r.userId === userId && r.emoji === emoji)
    );
    messageInstance.updatedAt = new Date();

    return await cosmosDBClient.upsertItem<IMessage>(this.messagesContainer, messageInstance);
  }

  /**
   * Forward message to other chats
   */
  async forwardMessage(
    messageId: string,
    userId: string,
    targetChatIds: string[]
  ): Promise<IMessage[]> {
    const originalMessage = await this.getMessage(messageId, userId);

    const forwardedMessages: IMessage[] = [];

    for (const targetChatId of targetChatIds) {
      const message = await this.sendMessage(
        targetChatId,
        userId,
        originalMessage.text,
        originalMessage.mediaUrl,
        originalMessage.mediaType
      );

      forwardedMessages.push(message);
    }

    return forwardedMessages;
  }

  /**
   * Mark messages as delivered
   */
  async markAsDelivered(chatId: string, userId: string, messageIds: string[]): Promise<void> {
    for (const messageId of messageIds) {
      const message = await cosmosDBClient.getItem<IMessage>(this.messagesContainer, messageId);

      if (message && message.chatId === chatId && message.senderId !== userId) {
        const messageInstance = new Message(message);
        messageInstance.markAsDelivered(userId);
        await cosmosDBClient.upsertItem(this.messagesContainer, messageInstance);
      }
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(chatId: string, userId: string, messageIds: string[]): Promise<void> {
    for (const messageId of messageIds) {
      const message = await cosmosDBClient.getItem<IMessage>(this.messagesContainer, messageId);

      if (message && message.chatId === chatId && message.senderId !== userId) {
        const messageInstance = new Message(message);
        messageInstance.markAsRead(userId);
        await cosmosDBClient.upsertItem(this.messagesContainer, messageInstance);
      }
    }
  }

  /**
   * Search messages in a chat
   */
  async searchMessages(
    chatId: string,
    userId: string,
    searchQuery: string,
    limit: number = 20
  ): Promise<IMessage[]> {
    // Verify chat access
    const chat = await cosmosDBClient.getItem<IChat>(this.chatsContainer, chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    const isParticipant = chat.participants.some(p => p.userId === userId && p.isActive);
    if (!isParticipant) {
      throw new AppError('Not authorized', 403);
    }

    const messages = await cosmosDBClient.queryItems<IMessage>(
      this.messagesContainer,
      'SELECT * FROM c WHERE c.chatId = @chatId AND c.isDeleted = false AND CONTAINS(LOWER(c.text), LOWER(@query)) ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit',
      [
        { name: '@chatId', value: chatId },
        { name: '@query', value: searchQuery },
        { name: '@limit', value: limit }
      ]
    );

    // Filter out messages deleted for this user
    return messages.filter(msg => !msg.deletedFor.includes(userId));
  }

  /**
   * Get unread message count for a chat
   */
  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    const chat = await cosmosDBClient.getItem<IChat>(this.chatsContainer, chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    const participant = chat.participants.find(p => p.userId === userId && p.isActive);
    if (!participant) {
      throw new AppError('Not a chat participant', 403);
    }

    const lastReadMessageId = participant.lastReadMessageId;

    if (!lastReadMessageId) {
      // User hasn't read any messages, count all messages from others
      const allMessages = await cosmosDBClient.queryItems<IMessage>(
        this.messagesContainer,
        'SELECT * FROM c WHERE c.chatId = @chatId AND c.senderId != @userId AND c.isDeleted = false',
        [
          { name: '@chatId', value: chatId },
          { name: '@userId', value: userId }
        ]
      );
      return allMessages.filter(msg => !msg.deletedFor.includes(userId)).length;
    }

    // Get timestamp of last read message
    const lastReadMessage = await cosmosDBClient.getItem<IMessage>(
      this.messagesContainer,
      lastReadMessageId
    );

    if (!lastReadMessage) {
      return 0;
    }

    // Count messages after last read
    const unreadMessages = await cosmosDBClient.queryItems<IMessage>(
      this.messagesContainer,
      'SELECT * FROM c WHERE c.chatId = @chatId AND c.senderId != @userId AND c.timestamp > @lastReadTime AND c.isDeleted = false',
      [
        { name: '@chatId', value: chatId },
        { name: '@userId', value: userId },
        { name: '@lastReadTime', value: lastReadMessage.timestamp.toISOString() }
      ]
    );

    return unreadMessages.filter(msg => !msg.deletedFor.includes(userId)).length;
  }
}

export const messageService = new MessageService();
