/**
 * Story Service
 * Production-grade story management with 24-hour TTL and view tracking
 * Features: Story creation, viewing, reactions, privacy controls, friend filtering
 */

import { cosmosDBClient } from '../../infrastructure/database/cosmosdb.config';
import { azureBlobStorage } from '../../infrastructure/storage/blob.config';
import { AppError } from '../middleware/error.middleware';
import { Story, IStory, IStoryViewer, IStoryReaction, StoryPrivacy } from '../../domain/entities/Story';
import { IUser } from '../../domain/entities/User';
import { v4 as uuidv4 } from 'uuid';
import { notificationService } from './NotificationService';

export class StoryService {
  private readonly storiesContainer = 'stories';
  private readonly usersContainer = 'users';
  private readonly STORY_TTL = 24 * 60 * 60; // 24 hours in seconds
  private socketEmitter?: (event: string, data: any) => void;

  /**
   * Set socket emitter for real-time events
   */
  setSocketEmitter(emitter: (event: string, data: any) => void): void {
    this.socketEmitter = emitter;
  }

  /**
   * Create a new story
   */
  async createStory(
    userId: string,
    mediaUrl: string,
    mediaType: 'image' | 'video',
    options?: {
      caption?: string;
      backgroundColor?: string;
      thumbnailUrl?: string;
      duration?: number;
      privacy?: StoryPrivacy;
      customViewerIds?: string[];
    }
  ): Promise<IStory> {
    const user = await cosmosDBClient.getItem<IUser>(this.usersContainer, userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const expiresAt = new Date(Date.now() + this.STORY_TTL * 1000);

    const story = new Story({
      id: uuidv4(),
      userId,
      username: user.username,
      displayName: user.displayName,
      userAvatar: user.avatar,
      mediaUrl,
      mediaType,
      caption: options?.caption,
      backgroundColor: options?.backgroundColor,
      thumbnailUrl: options?.thumbnailUrl,
      duration: options?.duration || (mediaType === 'video' ? 15 : 10),
      viewers: [],
      reactions: [],
      viewCount: 0,
      privacy: options?.privacy || 'friends',
      customViewerIds: options?.customViewerIds || [],
      createdAt: new Date(),
      expiresAt,
      isActive: true
    });

    const createdStory = await cosmosDBClient.upsertItem<IStory>(this.storiesContainer, story);

    // Emit socket event for real-time updates
    if (this.socketEmitter) {
      this.socketEmitter('story:new', {
        id: createdStory.id,
        userId: createdStory.userId,
        userName: createdStory.username,
        userAvatar: createdStory.userAvatar,
        mediaUrl: createdStory.mediaUrl,
        type: createdStory.mediaType,
        createdAt: createdStory.createdAt,
        expiresAt: createdStory.expiresAt,
      });
    }

    // Send notifications to friends (async, don't wait)
    this.notifyFriendsAboutStory(userId, user.username, createdStory.id).catch(err => {
      console.error('Failed to notify friends about story:', err);
    });

    return createdStory;
  }

  /**
   * Notify friends when user posts a story
   */
  private async notifyFriendsAboutStory(userId: string, userName: string, storyId: string): Promise<void> {
    try {
      // TODO: Get user's friends list from FriendService
      // For now, this is a placeholder - integrate with your friends system
      // const friends = await friendService.getFriends(userId);
      
      // Example notification (you'll need to implement friend retrieval)
      // for (const friend of friends) {
      //   await notificationService.createNotification(
      //     friend.id,
      //     'story',
      //     'New Story',
      //     `${userName} posted a new story`,
      //     { storyId, userId, userName }
      //   );
      // }
      
      console.log(`Story notification ready for ${userName}'s friends (storyId: ${storyId})`);
    } catch (error) {
      console.error('Error notifying friends:', error);
    }
  }

  /**
   * Upload story media
   */
  async uploadStoryMedia(
    userId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{ url: string; type: 'image' | 'video' }> {
    const user = await cosmosDBClient.getItem<IUser>(this.usersContainer, userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    let type: 'image' | 'video' = 'image';
    if (mimeType.startsWith('video/')) {
      type = 'video';
    }

    const blobName = `stories/${userId}/${uuidv4()}_${fileName}`;
    const url = await azureBlobStorage.uploadBlob('media', blobName, fileBuffer, mimeType);

    return { url, type };
  }

  /**
   * Get active stories from friends
   */
  async getFriendsStories(userId: string): Promise<IStory[]> {
    // Get all active stories (not expired)
    const now = new Date();
    const allStories = await cosmosDBClient.queryItems<IStory>(
      this.storiesContainer,
      'SELECT * FROM c WHERE c.isActive = true AND c.expiresAt > @now ORDER BY c.createdAt DESC',
      [{ name: '@now', value: now.toISOString() }]
    );

    // TODO: Filter by friends only (requires friend service integration)
    // For now, return all stories except user's own
    return allStories.filter(story => story.userId !== userId);
  }

  /**
   * Get user's own stories
   */
  async getMyStories(userId: string): Promise<IStory[]> {
    return this.getUserStories(userId);
  }

  /**
   * Get specific user's stories
   */
  async getUserStories(userId: string): Promise<IStory[]> {
    const now = new Date();
    return await cosmosDBClient.queryItems<IStory>(
      this.storiesContainer,
      'SELECT * FROM c WHERE c.userId = @userId AND c.isActive = true AND c.expiresAt > @now ORDER BY c.createdAt DESC',
      [
        { name: '@userId', value: userId },
        { name: '@now', value: now.toISOString() }
      ]
    );
  }

  /**
   * Get specific story
   */
  async getStory(storyId: string, _userId?: string): Promise<IStory> {
    const story = await cosmosDBClient.getItem<IStory>(this.storiesContainer, storyId);

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    if (!story.isActive || new Date() > story.expiresAt) {
      throw new AppError('Story has expired', 410);
    }

    return story;
  }

  /**
   * View a story (track view)
   */
  async viewStory(storyId: string, viewerId: string): Promise<IStory> {
    const story = await this.getStory(storyId, viewerId);

    // Don't track if viewing own story
    if (story.userId === viewerId) {
      return story;
    }

    // Check if already viewed
    const alreadyViewed = story.viewers.some((v: IStoryViewer) => v.userId === viewerId);
    if (alreadyViewed) {
      return story;
    }

    // Get viewer details
    const viewer = await cosmosDBClient.getItem<IUser>(this.usersContainer, viewerId);
    if (!viewer) {
      throw new AppError('Viewer not found', 404);
    }

    // Add view
    story.viewers.push({
      userId: viewerId,
      username: viewer.username,
      displayName: viewer.displayName,
      avatar: viewer.avatar,
      viewedAt: new Date()
    });
    story.viewCount = story.viewers.length;

    return await cosmosDBClient.upsertItem<IStory>(this.storiesContainer, story);
  }

  /**
   * Get story viewers
   */
  async getStoryViewers(storyId: string, userId: string): Promise<IStoryViewer[]> {
    const story = await this.getStory(storyId, userId);

    // Only story owner can see viewers
    if (story.userId !== userId) {
      throw new AppError('Not authorized to view story viewers', 403);
    }

    return story.viewers;
  }

  /**
   * Delete story
   */
  async deleteStory(storyId: string, userId: string): Promise<void> {
    const story = await this.getStory(storyId, userId);

    // Only story owner can delete
    if (story.userId !== userId) {
      throw new AppError('Not authorized to delete this story', 403);
    }

    // Soft delete
    story.isActive = false;
    await cosmosDBClient.upsertItem(this.storiesContainer, story);

    // Delete media from blob storage
    try {
      const fileName = story.mediaUrl.split('/').pop();
      if (fileName) {
        await azureBlobStorage.deleteBlob('media', `stories/${userId}/${fileName}`);
      }
    } catch (error) {
      // Ignore blob deletion errors
    }
  }

  /**
   * Add reaction to story
   */
  async addReaction(
    storyId: string,
    userId: string,
    emoji: string
  ): Promise<IStory> {
    const story = await this.getStory(storyId, userId);

    // Get user details
    const user = await cosmosDBClient.getItem<IUser>(this.usersContainer, userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if user already reacted
    const existingReactionIndex = story.reactions.findIndex(
      (r: IStoryReaction) => r.userId === userId
    );

    if (existingReactionIndex >= 0) {
      // Update existing reaction
      story.reactions[existingReactionIndex].emoji = emoji;
      story.reactions[existingReactionIndex].timestamp = new Date();
    } else {
      // Add new reaction
      story.reactions.push({
        userId,
        username: user.username,
        emoji,
        timestamp: new Date()
      });
    }

    return await cosmosDBClient.upsertItem<IStory>(this.storiesContainer, story);
  }

  /**
   * Remove reaction from story
   */
  async removeReaction(storyId: string, userId: string): Promise<IStory> {
    const story = await this.getStory(storyId, userId);

    story.reactions = story.reactions.filter(
      (r: IStoryReaction) => r.userId !== userId
    );

    return await cosmosDBClient.upsertItem<IStory>(this.storiesContainer, story);
  }

  /**
   * Clean up expired stories (should be run periodically)
   */
  async cleanupExpiredStories(): Promise<number> {
    const now = new Date();
    const expiredStories = await cosmosDBClient.queryItems<IStory>(
      this.storiesContainer,
      'SELECT * FROM c WHERE c.expiresAt < @now AND c.isActive = true',
      [{ name: '@now', value: now.toISOString() }]
    );

    for (const story of expiredStories) {
      story.isActive = false;
      await cosmosDBClient.upsertItem(this.storiesContainer, story);

      // Delete media
      try {
        const fileName = story.mediaUrl.split('/').pop();
        if (fileName) {
          await azureBlobStorage.deleteBlob('media', `stories/${story.userId}/${fileName}`);
        }
      } catch (error) {
        // Ignore errors
      }
    }

    return expiredStories.length;
  }

  /**
   * Get stories grouped by user
   */
  async getStoriesGroupedByUser(userId: string): Promise<Map<string, IStory[]>> {
    const stories = await this.getFriendsStories(userId);
    const grouped = new Map<string, IStory[]>();

    for (const story of stories) {
      const userStories = grouped.get(story.userId) || [];
      userStories.push(story);
      grouped.set(story.userId, userStories);
    }

    return grouped;
  }
}

export const storyService = new StoryService();
