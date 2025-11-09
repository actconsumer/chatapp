/**
 * Notification Service
 * Professional notification system for Project Chat
 * Handles in-app notifications and push notifications
 */

import { cosmosDBClient } from '../../infrastructure/database/cosmosdb.config';
import { AppError } from '../middleware/error.middleware';
import { Notification, INotification, NotificationType, INotificationPreferences } from '../../domain/entities/Notification';
import { deviceService } from './DeviceService';
import { v4 as uuidv4 } from 'uuid';

export class NotificationService {
  private readonly notificationsContainer = 'notifications';
  private readonly usersContainer = 'users';

  /**
   * Create and send a notification
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<INotification> {
    // Check user's notification preferences
    const preferences = await this.getNotificationPreferences(userId);

    // Check if this type of notification is enabled
    const typeEnabled = this.isNotificationTypeEnabled(preferences, type);
    if (!typeEnabled) {
      throw new AppError('Notification type is disabled by user', 400);
    }

    // Create notification
    const notification = new Notification({
      id: uuidv4(),
      userId,
      type,
      title,
      body,
      data: data || {},
      isRead: false,
      createdAt: new Date()
    });

    const savedNotification = await cosmosDBClient.upsertItem<INotification>(
      this.notificationsContainer,
      notification
    );

    // Send push notification if enabled
    if (preferences.pushEnabled) {
      await this.sendPushNotification(userId, title, body, data);
    }

    return savedNotification;
  }

  /**
   * Helper: Check if notification type is enabled
   */
  private isNotificationTypeEnabled(
    preferences: INotificationPreferences,
    type: NotificationType
  ): boolean {
    switch (type) {
      case 'message':
      case 'group_message':
        return preferences.messages;
      case 'friend_request':
      case 'friend_accepted':
        return preferences.friendRequests;
      case 'group_invite':
        return preferences.groupInvites;
      case 'call_missed':
        return preferences.calls;
      case 'story_view':
      case 'story_reply':
        return preferences.stories;
      case 'mention':
        return preferences.mentions;
      default:
        return true;
    }
  }

  /**
   * Send push notification to user's devices
   */
  private async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // Get user's devices with push tokens
      const devices = await deviceService.getUserDevices(userId);
      const devicesWithPushTokens = devices.filter(d => d.pushToken && d.isTrusted);

      // In production, integrate with Azure Notification Hubs or Firebase Cloud Messaging
      // For now, just log
      console.log('Push notification would be sent to', devicesWithPushTokens.length, 'devices');
      console.log('Title:', title);
      console.log('Body:', body);
      console.log('Data:', data);

      // TODO: Implement actual push notification sending
      // Example with Azure Notification Hubs:
      // await notificationHub.send(devicesWithPushTokens.map(d => d.pushToken), { title, body, data });
    } catch (error) {
      console.error('Failed to send push notification:', error);
      // Don't throw error - notification creation should succeed even if push fails
    }
  }

  /**
   * Get all notifications for a user
   */
  async getNotifications(
    userId: string,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<INotification[]> {
    let query = 'SELECT * FROM c WHERE c.userId = @userId';
    const parameters: any[] = [{ name: '@userId', value: userId }];

    if (unreadOnly) {
      query += ' AND c.isRead = false';
    }

    query += ' ORDER BY c.createdAt DESC OFFSET 0 LIMIT @limit';
    parameters.push({ name: '@limit', value: limit });

    return await cosmosDBClient.queryItems<INotification>(
      this.notificationsContainer,
      query,
      parameters
    );
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string, userId: string): Promise<INotification> {
    const notification = await cosmosDBClient.getItem<INotification>(
      this.notificationsContainer,
      notificationId
    );

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    return notification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await this.getNotification(notificationId, userId);

    const notificationInstance = new Notification(notification);
    notificationInstance.markAsRead();

    return await cosmosDBClient.upsertItem<INotification>(
      this.notificationsContainer,
      notificationInstance
    );
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const unreadNotifications = await this.getNotifications(userId, 1000, true);

    for (const notification of unreadNotifications) {
      const notificationInstance = new Notification(notification);
      notificationInstance.markAsRead();
      await cosmosDBClient.upsertItem(this.notificationsContainer, notificationInstance);
    }

    return unreadNotifications.length;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.getNotification(notificationId, userId);
    await cosmosDBClient.deleteItem(this.notificationsContainer, notification.id);
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<number> {
    const notifications = await this.getNotifications(userId, 1000);

    for (const notification of notifications) {
      await cosmosDBClient.deleteItem(this.notificationsContainer, notification.id);
    }

    return notifications.length;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const unreadNotifications = await this.getNotifications(userId, 1000, true);
    return unreadNotifications.length;
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<INotificationPreferences> {
    // In production, store preferences in user document or separate collection
    // For now, return default preferences
    // TODO: Store in database and retrieve actual preferences

    return {
      userId,
      pushEnabled: true,
      sound: true,
      vibration: true,
      emailEnabled: false,
      messages: true,
      friendRequests: true,
      groupInvites: true,
      calls: true,
      stories: true,
      mentions: true
    };
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    updates: Partial<INotificationPreferences>
  ): Promise<INotificationPreferences> {
    // TODO: Store preferences in database
    // For now, just return the updates merged with defaults

    const currentPreferences = await this.getNotificationPreferences(userId);
    const updatedPreferences = { ...currentPreferences, ...updates };

    // In production: await cosmosDBClient.upsertItem(preferencesContainer, updatedPreferences);

    return updatedPreferences;
  }

  /**
   * Send notification for new message
   */
  async notifyNewMessage(
    recipientId: string,
    senderName: string,
    messageText: string,
    chatId: string
  ): Promise<void> {
    await this.createNotification(
      recipientId,
      'message',
      `New message from ${senderName}`,
      messageText,
      { chatId, senderName }
    );
  }

  /**
   * Send notification for friend request
   */
  async notifyFriendRequest(
    recipientId: string,
    senderName: string,
    requestId: string
  ): Promise<void> {
    await this.createNotification(
      recipientId,
      'friend_request',
      'New Friend Request',
      `${senderName} sent you a friend request`,
      { requestId, senderName }
    );
  }

  /**
   * Send notification for friend request accepted
   */
  async notifyFriendRequestAccepted(
    recipientId: string,
    accepterName: string
  ): Promise<void> {
    await this.createNotification(
      recipientId,
      'friend_accepted',
      'Friend Request Accepted',
      `${accepterName} accepted your friend request`,
      { accepterName }
    );
  }

  /**
   * Send notification for group invite
   */
  async notifyGroupInvite(
    recipientId: string,
    groupName: string,
    inviterName: string,
    chatId: string
  ): Promise<void> {
    await this.createNotification(
      recipientId,
      'group_invite',
      'Group Invitation',
      `${inviterName} added you to ${groupName}`,
      { chatId, groupName, inviterName }
    );
  }

  /**
   * Send notification for missed call
   */
  async notifyMissedCall(
    recipientId: string,
    callerName: string,
    callId: string
  ): Promise<void> {
    await this.createNotification(
      recipientId,
      'call_missed',
      'Missed Call',
      `Missed call from ${callerName}`,
      { callId, callerName }
    );
  }

  /**
   * Send notification for story mention
   */
  async notifyStoryMention(
    recipientId: string,
    mentionerName: string,
    storyId: string
  ): Promise<void> {
    await this.createNotification(
      recipientId,
      'story_reply',
      'Story Mention',
      `${mentionerName} mentioned you in their story`,
      { storyId, mentionerName }
    );
  }

  /**
   * Send notification for message reaction
   */
  async notifyReaction(
    recipientId: string,
    reactorName: string,
    emoji: string,
    messageId: string
  ): Promise<void> {
    await this.createNotification(
      recipientId,
      'mention',
      'New Reaction',
      `${reactorName} reacted ${emoji} to your message`,
      { messageId, reactorName, emoji }
    );
  }
}

export const notificationService = new NotificationService();
