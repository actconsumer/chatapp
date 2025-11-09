/**
 * User Repository Implementation (Cosmos DB)
 * Implements IUserRepository interface for Cosmos DB
 */

import { Container } from '@azure/cosmos';
import { IUser, IUserProfile, User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/interfaces';
import { cosmosDBClient } from '../database/cosmosdb.config';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class UserRepository implements IUserRepository {
  private container: Container;

  constructor() {
    const container = cosmosDBClient.usersContainer;
    if (!container) {
      throw new Error('Users container not initialized');
    }
    this.container = container;
  }

  async create(userData: IUser): Promise<IUser> {
    try {
      const user = new User({
        ...userData,
        id: userData.id || uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { resource } = await this.container.items.create(user);
      logger.info(`User created: ${resource?.id}`);
      return new User(resource as IUser);
    } catch (error) {
      logger.error('Failed to create user:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<IUser | null> {
    try {
      const { resource } = await this.container.item(id, id).read<IUser>();
      return resource ? new User(resource) : null;
    } catch (error: any) {
      if (error.code === 404) return null;
      logger.error('Failed to find user by ID:', error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      const querySpec = {
        query: 'SELECT * FROM users u WHERE u.email = @email',
        parameters: [{ name: '@email', value: email.toLowerCase() }],
      };

      const { resources } = await this.container.items.query<IUser>(querySpec).fetchAll();
      return resources.length > 0 ? new User(resources[0]) : null;
    } catch (error) {
      logger.error('Failed to find user by email:', error);
      throw error;
    }
  }

  async findByUsername(username: string): Promise<IUser | null> {
    try {
      const querySpec = {
        query: 'SELECT * FROM users u WHERE u.username = @username',
        parameters: [{ name: '@username', value: username.toLowerCase() }],
      };

      const { resources } = await this.container.items.query<IUser>(querySpec).fetchAll();
      return resources.length > 0 ? new User(resources[0]) : null;
    } catch (error) {
      logger.error('Failed to find user by username:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser> {
    try {
      const existing = await this.findById(id);
      if (!existing) throw new Error('User not found');

      const updated = {
        ...existing,
        ...data,
        id, // Ensure ID doesn't change
        updatedAt: new Date(),
      };

      const { resource } = await this.container.item(id, id).replace(updated);
      logger.info(`User updated: ${id}`);
      return new User(resource as IUser);
    } catch (error) {
      logger.error('Failed to update user:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.container.item(id, id).delete();
      logger.info(`User deleted: ${id}`);
    } catch (error) {
      logger.error('Failed to delete user:', error);
      throw error;
    }
  }

  async updateLastSeen(userId: string, timestamp: Date): Promise<void> {
    try {
      const user = await this.findById(userId);
      if (user) {
        await this.update(userId, { lastSeen: timestamp });
      }
    } catch (error) {
      logger.error('Failed to update last seen:', error);
      throw error;
    }
  }

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      const user = await this.findById(userId);
      if (user) {
        await this.update(userId, { 
          isOnline, 
          lastSeen: isOnline ? new Date() : user.lastSeen 
        });
      }
    } catch (error) {
      logger.error('Failed to update online status:', error);
      throw error;
    }
  }

  async search(query: string, limit: number = 20): Promise<IUserProfile[]> {
    try {
      const querySpec = {
        query: `
          SELECT u.id, u.email, u.username, u.displayName, u.avatar, u.bio, u.isOnline, u.lastSeen 
          FROM users u 
          WHERE CONTAINS(LOWER(u.username), @query) 
            OR CONTAINS(LOWER(u.displayName), @query)
            OR CONTAINS(LOWER(u.email), @query)
          ORDER BY u.username
          OFFSET 0 LIMIT @limit
        `,
        parameters: [
          { name: '@query', value: query.toLowerCase() },
          { name: '@limit', value: limit },
        ],
      };

      const { resources } = await this.container.items.query<IUserProfile>(querySpec).fetchAll();
      return resources;
    } catch (error) {
      logger.error('Failed to search users:', error);
      throw error;
    }
  }

  async addRefreshToken(userId: string, token: string): Promise<void> {
    try {
      const user = await this.findById(userId);
      if (user) {
        const refreshTokens = user.refreshTokens || [];
        refreshTokens.push(token);
        await this.update(userId, { refreshTokens });
      }
    } catch (error) {
      logger.error('Failed to add refresh token:', error);
      throw error;
    }
  }

  async removeRefreshToken(userId: string, token: string): Promise<void> {
    try {
      const user = await this.findById(userId);
      if (user) {
        const refreshTokens = (user.refreshTokens || []).filter(t => t !== token);
        await this.update(userId, { refreshTokens });
      }
    } catch (error) {
      logger.error('Failed to remove refresh token:', error);
      throw error;
    }
  }

  async findByRefreshToken(token: string): Promise<IUser | null> {
    try {
      const querySpec = {
        query: 'SELECT * FROM users u WHERE ARRAY_CONTAINS(u.refreshTokens, @token)',
        parameters: [{ name: '@token', value: token }],
      };

      const { resources } = await this.container.items.query<IUser>(querySpec).fetchAll();
      return resources.length > 0 ? new User(resources[0]) : null;
    } catch (error) {
      logger.error('Failed to find user by refresh token:', error);
      throw error;
    }
  }
}
