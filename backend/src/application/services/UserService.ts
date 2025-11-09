/**
 * User Service
 * Business logic for user profile management
 */

import { cosmosDBClient } from '../../infrastructure/database/cosmosdb.config';
import { azureBlobStorage } from '../../infrastructure/storage/blob.config';
import { IUser, IUserProfile } from '../../domain/entities/User';
import { AppError } from '../middleware/error.middleware';

export class UserService {
  private readonly userContainer = 'users';

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<IUserProfile> {
    const user = await cosmosDBClient.getItem<IUser>(this.userContainer, userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    };
  }

  /**
   * Get current user full profile
   */
  async getCurrentUser(userId: string): Promise<IUser> {
    const user = await cosmosDBClient.getItem<IUser>(this.userContainer, userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<Pick<IUser, 'displayName' | 'bio' | 'phoneNumber'>>
  ): Promise<IUserProfile> {
    const user = await cosmosDBClient.getItem<IUser>(this.userContainer, userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    await cosmosDBClient.upsertItem(this.userContainer, updatedUser);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      isOnline: updatedUser.isOnline,
      lastSeen: updatedUser.lastSeen,
    };
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(userId: string, fileBuffer: Buffer, fileName: string): Promise<string> {
    const user = await cosmosDBClient.getItem<IUser>(this.userContainer, userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Delete old avatar if exists
    if (user.avatar) {
      const oldAvatarPath = user.avatar.split('/').pop();
      if (oldAvatarPath) {
        await azureBlobStorage.deleteBlob('avatars', oldAvatarPath);
      }
    }

    // Upload new avatar
    const avatarPath = `${userId}/${Date.now()}-${fileName}`;
    const avatarUrl = await azureBlobStorage.uploadBlob('avatars', avatarPath, fileBuffer);

    // Update user
    user.avatar = avatarUrl;
    user.updatedAt = new Date();
    await cosmosDBClient.upsertItem(this.userContainer, user);

    return avatarUrl;
  }

  /**
   * Search users
   */
  async searchUsers(query: string, currentUserId: string, limit: number = 20): Promise<IUserProfile[]> {
    const users = await cosmosDBClient.queryItems<IUser>(
      this.userContainer,
      `SELECT * FROM c WHERE 
       (CONTAINS(LOWER(c.username), @query) OR 
        CONTAINS(LOWER(c.displayName), @query) OR
        CONTAINS(LOWER(c.email), @query)) AND
       c.id != @currentUserId AND
       c.isActive = true
       OFFSET 0 LIMIT @limit`,
      { query: query.toLowerCase(), currentUserId, limit }
    );

    return users.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    }));
  }

  /**
   * Update online status
   */
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const user = await cosmosDBClient.getItem<IUser>(this.userContainer, userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isOnline = isOnline;
    user.lastSeen = new Date();
    await cosmosDBClient.upsertItem(this.userContainer, user);
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    settings: Partial<IUser['privacySettings']>
  ): Promise<IUser['privacySettings']> {
    const user = await cosmosDBClient.getItem<IUser>(this.userContainer, userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.privacySettings = {
      ...user.privacySettings,
      ...settings,
    };
    user.updatedAt = new Date();
    
    await cosmosDBClient.upsertItem(this.userContainer, user);

    return user.privacySettings;
  }
}

export const userService = new UserService();
