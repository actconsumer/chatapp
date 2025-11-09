/**
 * Redis Cache Configuration
 * For caching active sessions, online users, and message queues
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '../../utils/logger';

export class RedisCache {
  private static instance: RedisCache;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }
    return RedisCache.instance;
  }

  public async initialize(): Promise<void> {
    try {
      const config = {
        socket: {
          host: process.env.REDIS_HOST!,
          port: parseInt(process.env.REDIS_PORT || '6380'),
          ...(process.env.REDIS_TLS_ENABLED === 'true' && {
            tls: true,
          }),
        },
        password: process.env.REDIS_PASSWORD,
      };

      this.client = createClient(config);

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  public getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not initialized or not connected');
    }
    return this.client;
  }

  // ========== Cache Operations ==========

  public async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    const client = this.getClient();
    if (expirySeconds) {
      await client.setEx(key, expirySeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  public async get(key: string): Promise<string | null> {
    const client = this.getClient();
    return await client.get(key);
  }

  public async del(key: string): Promise<void> {
    const client = this.getClient();
    await client.del(key);
  }

  public async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    const result = await client.exists(key);
    return result === 1;
  }

  public async setObject(key: string, value: any, expirySeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), expirySeconds);
  }

  public async getObject<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  // ========== Session Management ==========

  public async setSession(userId: string, sessionData: any, expirySeconds: number = 86400): Promise<void> {
    const key = `session:${userId}`;
    await this.setObject(key, sessionData, expirySeconds);
  }

  public async getSession(userId: string): Promise<any | null> {
    const key = `session:${userId}`;
    return await this.getObject(key);
  }

  public async deleteSession(userId: string): Promise<void> {
    const key = `session:${userId}`;
    await this.del(key);
  }

  // ========== Online Status ==========

  public async setUserOnline(userId: string): Promise<void> {
    const key = `online:${userId}`;
    await this.set(key, Date.now().toString(), 300); // 5 minutes expiry
  }

  public async setUserOffline(userId: string): Promise<void> {
    const key = `online:${userId}`;
    await this.del(key);
  }

  public async isUserOnline(userId: string): Promise<boolean> {
    const key = `online:${userId}`;
    return await this.exists(key);
  }

  // ========== Typing Indicators ==========

  public async setUserTyping(chatId: string, userId: string): Promise<void> {
    const key = `typing:${chatId}:${userId}`;
    await this.set(key, 'true', 5); // 5 seconds expiry
  }

  public async getUsersTyping(chatId: string): Promise<string[]> {
    const client = this.getClient();
    const pattern = `typing:${chatId}:*`;
    const keys = await client.keys(pattern);
    return keys.map(key => key.split(':')[2]);
  }

  // ========== Message Queue ==========

  public async pushToQueue(queueName: string, message: string): Promise<void> {
    const client = this.getClient();
    await client.rPush(queueName, message);
  }

  public async popFromQueue(queueName: string): Promise<string | null> {
    const client = this.getClient();
    return await client.lPop(queueName);
  }

  // ========== Rate Limiting ==========

  public async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    const client = this.getClient();
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, windowSeconds);
    }
    return count;
  }

  public async getRateLimitCount(key: string): Promise<number> {
    const client = this.getClient();
    const value = await client.get(key);
    return value ? parseInt(value) : 0;
  }

  public async close(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

export const redisCache = RedisCache.getInstance();
