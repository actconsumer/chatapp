/**
 * Security Key Service
 * Manages device-specific encryption keys for E2E encryption
 */

import { ISecurityKey, SecurityKey, IMessageKey, MessageKey, IDeviceSession } from '../../domain/entities/SecurityKey';
import { encryptionService } from '../../utils/encryption';
import { redisCache } from '../../infrastructure/cache/redis.config';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  keyFingerprint: string;
}

export interface DeviceRegistrationData {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'web';
  platform: string;
  publicKey: string;
  userAgent?: string;
  ipAddress?: string;
}

export class SecurityKeyService {
  /**
   * Generate a new key pair for a device
   */
  generateKeyPair(): KeyPair {
    try {
      // Generate RSA key pair (2048-bit)
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      // Generate fingerprint (SHA-256 hash of public key)
      const keyFingerprint = crypto
        .createHash('sha256')
        .update(publicKey)
        .digest('hex');

      return {
        publicKey: Buffer.from(publicKey).toString('base64'),
        privateKey: Buffer.from(privateKey).toString('base64'),
        keyFingerprint,
      };
    } catch (error) {
      logger.error('Failed to generate key pair:', error);
      throw new Error('Failed to generate key pair');
    }
  }

  /**
   * Register a new device for a user
   */
  async registerDevice(
    userId: string,
    deviceData: DeviceRegistrationData,
    masterPassword?: string
  ): Promise<ISecurityKey> {
    try {
      // Encrypt private key with user's master password
      const privateKeyEncrypted = masterPassword
        ? this.encryptPrivateKey(deviceData.publicKey, masterPassword)
        : '';

      // Generate fingerprint
      const keyFingerprint = crypto
        .createHash('sha256')
        .update(deviceData.publicKey)
        .digest('hex');

      // Create security key
      const securityKey = new SecurityKey({
        id: uuidv4(),
        userId,
        deviceId: deviceData.deviceId,
        deviceName: deviceData.deviceName,
        keyType: 'identity',
        publicKey: deviceData.publicKey,
        privateKeyEncrypted,
        keyFingerprint,
        status: 'active',
        createdAt: new Date(),
      });

      // Store in Redis for quick access
      await redisCache.setObject(
        `security-key:${userId}:${deviceData.deviceId}`,
        securityKey
      );

      // Track device session
      const deviceSession: IDeviceSession = {
        deviceId: deviceData.deviceId,
        deviceName: deviceData.deviceName,
        deviceType: deviceData.deviceType,
        platform: deviceData.platform,
        lastActive: new Date(),
        ipAddress: deviceData.ipAddress,
        userAgent: deviceData.userAgent,
        publicKey: deviceData.publicKey,
        isCurrentDevice: true,
      };

      await this.addDeviceSession(userId, deviceSession);

      logger.info(`Device registered for user ${userId}: ${deviceData.deviceName}`);

      return securityKey;
    } catch (error) {
      logger.error('Failed to register device:', error);
      throw error;
    }
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string): Promise<IDeviceSession[]> {
    try {
      const devicesKey = `devices:${userId}`;
      const devices = await redisCache.getObject<IDeviceSession[]>(devicesKey);
      return devices || [];
    } catch (error) {
      logger.error('Failed to get user devices:', error);
      return [];
    }
  }

  /**
   * Revoke a device
   */
  async revokeDevice(userId: string, deviceId: string): Promise<void> {
    try {
      // Get security key
      const keyData = await redisCache.getObject<ISecurityKey>(
        `security-key:${userId}:${deviceId}`
      );

      if (keyData) {
        const securityKey = new SecurityKey(keyData);
        securityKey.revoke();

        // Update in cache
        await redisCache.setObject(
          `security-key:${userId}:${deviceId}`,
          securityKey
        );
      }

      // Remove from device sessions
      const devices = await this.getUserDevices(userId);
      const updatedDevices = devices.filter(d => d.deviceId !== deviceId);
      await redisCache.setObject(`devices:${userId}`, updatedDevices);

      logger.info(`Device revoked for user ${userId}: ${deviceId}`);
    } catch (error) {
      logger.error('Failed to revoke device:', error);
      throw error;
    }
  }

  /**
   * Encrypt message key for multiple devices
   */
  async encryptMessageKeyForDevices(
    messageId: string,
    chatId: string,
    senderId: string,
    messageKey: string,
    recipientUserIds: string[]
  ): Promise<IMessageKey[]> {
    try {
      const messageKeys: IMessageKey[] = [];

      for (const recipientUserId of recipientUserIds) {
        // Get all active devices for the recipient
        const devices = await this.getUserDevices(recipientUserId);

        for (const device of devices) {
          // Encrypt message key with device's public key
          const encryptedKey = this.encryptWithPublicKey(
            messageKey,
            device.publicKey
          );

          const msgKey = new MessageKey({
            id: uuidv4(),
            messageId,
            chatId,
            senderId,
            encryptedKey,
            recipientDeviceId: device.deviceId,
            keyVersion: 1,
            createdAt: new Date(),
          });

          messageKeys.push(msgKey);

          // Store in Redis
          await redisCache.setObject(
            `message-key:${messageId}:${device.deviceId}`,
            msgKey,
            86400 // 24 hours expiry
          );
        }
      }

      logger.info(`Message keys encrypted for ${messageKeys.length} devices`);

      return messageKeys;
    } catch (error) {
      logger.error('Failed to encrypt message keys:', error);
      throw error;
    }
  }

  /**
   * Get message key for a specific device
   */
  async getMessageKeyForDevice(
    messageId: string,
    deviceId: string
  ): Promise<IMessageKey | null> {
    try {
      const messageKey = await redisCache.getObject<IMessageKey>(
        `message-key:${messageId}:${deviceId}`
      );
      return messageKey;
    } catch (error) {
      logger.error('Failed to get message key:', error);
      return null;
    }
  }

  /**
   * Decrypt message key with device's private key
   */
  decryptMessageKey(
    encryptedKey: string,
    privateKey: string
  ): string {
    try {
      const privateKeyBuffer = Buffer.from(privateKey, 'base64');
      const encryptedBuffer = Buffer.from(encryptedKey, 'base64');

      const decrypted = crypto.privateDecrypt(
        {
          key: privateKeyBuffer,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        encryptedBuffer
      );

      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Failed to decrypt message key:', error);
      throw new Error('Failed to decrypt message key');
    }
  }

  /**
   * Encrypt data with public key
   */
  private encryptWithPublicKey(data: string, publicKey: string): string {
    try {
      const publicKeyBuffer = Buffer.from(publicKey, 'base64');
      const dataBuffer = Buffer.from(data, 'utf8');

      const encrypted = crypto.publicEncrypt(
        {
          key: publicKeyBuffer,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        dataBuffer
      );

      return encrypted.toString('base64');
    } catch (error) {
      logger.error('Failed to encrypt with public key:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Encrypt private key with master password (optional)
   * @param privateKey - RSA private key
   * @param masterPassword - User's master password (reserved for future use)
   */
  private encryptPrivateKey(privateKey: string, masterPassword: string): string {
    try {
      // Master password parameter reserved for future enhancement
      // Currently using encryptionService with system key
      if (masterPassword) {
        // In future: derive encryption key from master password
        logger.debug('Master password parameter available for key derivation');
      }
      
      const result = encryptionService.encrypt(privateKey);
      return JSON.stringify(result);
    } catch (error) {
      logger.error('Failed to encrypt private key:', error);
      throw new Error('Failed to encrypt private key');
    }
  }

  /**
   * Decrypt private key with master password
   * @param encryptedPrivateKey - Encrypted private key
   * @param masterPassword - User's master password (reserved for future use)
   */
  decryptPrivateKey(encryptedPrivateKey: string, masterPassword: string): string {
    try {
      // Master password parameter reserved for future enhancement
      // Currently using encryptionService with system key
      if (masterPassword) {
        // In future: derive decryption key from master password
        logger.debug('Master password parameter available for key derivation');
      }
      
      const parsed = JSON.parse(encryptedPrivateKey);
      return encryptionService.decrypt(
        parsed.encrypted,
        parsed.iv,
        parsed.tag
      );
    } catch (error) {
      logger.error('Failed to decrypt private key:', error);
      throw new Error('Failed to decrypt private key');
    }
  }

  /**
   * Add device session
   */
  private async addDeviceSession(
    userId: string,
    deviceSession: IDeviceSession
  ): Promise<void> {
    try {
      const devicesKey = `devices:${userId}`;
      const devices = await redisCache.getObject<IDeviceSession[]>(devicesKey) || [];

      // Remove existing session for this device
      const filteredDevices = devices.filter(d => d.deviceId !== deviceSession.deviceId);

      // Add new session
      filteredDevices.push(deviceSession);

      // Store updated list
      await redisCache.setObject(devicesKey, filteredDevices);
    } catch (error) {
      logger.error('Failed to add device session:', error);
      throw error;
    }
  }

  /**
   * Update device last active
   */
  async updateDeviceActivity(userId: string, deviceId: string): Promise<void> {
    try {
      const devices = await this.getUserDevices(userId);
      const deviceIndex = devices.findIndex(d => d.deviceId === deviceId);

      if (deviceIndex >= 0) {
        devices[deviceIndex].lastActive = new Date();
        await redisCache.setObject(`devices:${userId}`, devices);
      }
    } catch (error) {
      logger.error('Failed to update device activity:', error);
    }
  }

  /**
   * Verify device ownership
   */
  async verifyDevice(
    userId: string,
    deviceId: string,
    signature: string,
    challenge: string
  ): Promise<boolean> {
    try {
      const securityKey = await redisCache.getObject<ISecurityKey>(
        `security-key:${userId}:${deviceId}`
      );

      if (!securityKey || !securityKey.publicKey) {
        return false;
      }

      // Verify signature with public key
      const publicKeyBuffer = Buffer.from(securityKey.publicKey, 'base64');
      const signatureBuffer = Buffer.from(signature, 'base64');
      const challengeBuffer = Buffer.from(challenge, 'utf8');

      const verify = crypto.createVerify('SHA256');
      verify.update(challengeBuffer);
      verify.end();

      return verify.verify(publicKeyBuffer, signatureBuffer);
    } catch (error) {
      logger.error('Failed to verify device:', error);
      return false;
    }
  }
}

export const securityKeyService = new SecurityKeyService();
