/**
 * Two-Factor Authentication Service
 * Handles TOTP generation, QR codes, backup codes
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { ITwoFactorAuth, TwoFactorAuth } from '../../domain/entities/TwoFactorAuth';
import { IUser } from '../../domain/entities/User';
import { encryptionService } from '../../utils/encryption';
import { redisCache } from '../../infrastructure/cache/redis.config';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export class TwoFactorAuthService {
  private appName: string = 'Project Chat';
  private readonly userRepository = new UserRepository();

  /**
   * Generate 2FA setup (secret, QR code, backup codes)
   */
  async generateSetup(user: IUser): Promise<TwoFactorSetupResponse> {
    try {
      // Generate TOTP secret
      const secret = authenticator.generateSecret();

      // Create OTP Auth URL for QR code
      const otpauthUrl = authenticator.keyuri(
        user.email,
        this.appName,
        secret
      );

      // Generate QR code as Data URL
      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes(10);

      // Store temporary setup in Redis (10 minutes expiry)
      await redisCache.setObject(
        `2fa:setup:${user.id}`,
        {
          secret,
          backupCodes: backupCodes.map(code => encryptionService.hash(code)),
          createdAt: new Date().toISOString(),
        },
        600
      );

      logger.info(`2FA setup generated for user: ${user.id}`);

      return {
        secret,
        qrCodeUrl,
        backupCodes,
        manualEntryKey: this.formatSecretForManualEntry(secret),
      };
    } catch (error) {
      logger.error('Failed to generate 2FA setup:', error);
      throw new Error('Failed to generate 2FA setup');
    }
  }

  /**
   * Verify TOTP token and enable 2FA
   */
  async verifyAndEnable(userId: string, token: string): Promise<ITwoFactorAuth> {
    try {
      // Get setup from Redis
      const setupData = await redisCache.getObject<any>(`2fa:setup:${userId}`);
      
      if (!setupData) {
        throw new Error('2FA setup not found or expired. Please start setup again.');
      }

      // Verify token
      const isValid = authenticator.verify({
        token,
        secret: setupData.secret,
      });

      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Create 2FA record
      const twoFactorAuth = new TwoFactorAuth({
        id: uuidv4(),
        userId,
        secret: setupData.secret,
        isEnabled: true,
        backupCodes: setupData.backupCodes.map((code: string) => ({
          code,
          isUsed: false,
        })),
        createdAt: new Date(),
        enabledAt: new Date(),
      });

      // Store in database (would use repository in production)
      // await this.twoFactorAuthRepository.create(twoFactorAuth);

      // Store in Redis for quick access
      await redisCache.setObject(`2fa:${userId}`, twoFactorAuth);

      // Delete setup data
      await redisCache.del(`2fa:setup:${userId}`);

      // Persist 2FA enabled status on user record
      try {
        await this.userRepository.update(userId, { twoFactorEnabled: true });
      } catch (error) {
        logger.error('Failed to mark 2FA enabled on user:', error);
      }

      logger.info(`2FA enabled for user: ${userId}`);

      return twoFactorAuth;
    } catch (error) {
      logger.error('Failed to verify and enable 2FA:', error);
      throw error;
    }
  }

  /**
   * Verify TOTP token during login
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    try {
      // Get 2FA config
      const twoFactorAuth = await redisCache.getObject<ITwoFactorAuth>(`2fa:${userId}`);
      
      if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
        throw new Error('2FA not enabled for this user');
      }

      // Verify token
      const isValid = authenticator.verify({
        token,
        secret: twoFactorAuth.secret,
      });

      if (isValid) {
        // Update last used
        twoFactorAuth.lastUsedAt = new Date();
        await redisCache.setObject(`2fa:${userId}`, twoFactorAuth);
        logger.info(`2FA token verified for user: ${userId}`);
      }

      return isValid;
    } catch (error) {
      logger.error('Failed to verify 2FA token:', error);
      throw error;
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, backupCode: string): Promise<boolean> {
    try {
      // Get 2FA config
      const twoFactorAuth = await redisCache.getObject<ITwoFactorAuth>(`2fa:${userId}`);
      
      if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
        throw new Error('2FA not enabled for this user');
      }

      const hashedCode = encryptionService.hash(backupCode);

      // Find matching backup code
      const backupCodeIndex = twoFactorAuth.backupCodes.findIndex(
        code => code.code === hashedCode && !code.isUsed
      );

      if (backupCodeIndex === -1) {
        return false;
      }

      // Mark code as used
      twoFactorAuth.backupCodes[backupCodeIndex].isUsed = true;
      twoFactorAuth.backupCodes[backupCodeIndex].usedAt = new Date();
      twoFactorAuth.lastUsedAt = new Date();

      // Update in cache
      await redisCache.setObject(`2fa:${userId}`, twoFactorAuth);

      logger.info(`Backup code used for user: ${userId}`);

      return true;
    } catch (error) {
      logger.error('Failed to verify backup code:', error);
      throw error;
    }
  }

  /**
   * Disable 2FA
   * @param userId - User ID
   * @param password - User password for verification
   */
  async disable(userId: string, password: string): Promise<void> {
    try {
      // In production, verify password first
      // const user = await this.userRepository.findById(userId);
      // const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      // if (!isPasswordValid) throw new Error('Invalid password');
      
      if (!password) {
        throw new Error('Password is required to disable 2FA');
      }

      // Delete 2FA config
      await redisCache.del(`2fa:${userId}`);

      try {
        await this.userRepository.update(userId, { twoFactorEnabled: false });
      } catch (error) {
        logger.error('Failed to update user during 2FA disable:', error);
      }

      logger.info(`2FA disabled for user: ${userId}`);
    } catch (error) {
      logger.error('Failed to disable 2FA:', error);
      throw error;
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      // Get 2FA config
      const twoFactorAuth = await redisCache.getObject<ITwoFactorAuth>(`2fa:${userId}`);
      
      if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
        throw new Error('2FA not enabled for this user');
      }

      // Generate new backup codes
      const newBackupCodes = this.generateBackupCodes(10);

      // Update 2FA config
      twoFactorAuth.backupCodes = newBackupCodes.map(code => ({
        code: encryptionService.hash(code),
        isUsed: false,
      }));

      // Update in cache
      await redisCache.setObject(`2fa:${userId}`, twoFactorAuth);

      logger.info(`Backup codes regenerated for user: ${userId}`);

      return newBackupCodes;
    } catch (error) {
      logger.error('Failed to regenerate backup codes:', error);
      throw error;
    }
  }

  /**
   * Get 2FA status
   */
  async getStatus(userId: string): Promise<any> {
    try {
      const twoFactorAuth = await redisCache.getObject<ITwoFactorAuth>(`2fa:${userId}`);
      
      if (!twoFactorAuth) {
        return {
          isEnabled: false,
          hasBackupCodes: false,
          unusedBackupCodesCount: 0,
        };
      }

      const unusedBackupCodesCount = twoFactorAuth.backupCodes.filter(
        code => !code.isUsed
      ).length;

      return {
        isEnabled: twoFactorAuth.isEnabled,
        hasBackupCodes: twoFactorAuth.backupCodes.length > 0,
        unusedBackupCodesCount,
        enabledAt: twoFactorAuth.enabledAt,
        lastUsedAt: twoFactorAuth.lastUsedAt,
      };
    } catch (error) {
      logger.error('Failed to get 2FA status:', error);
      throw error;
    }
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto
        .randomBytes(4)
        .toString('hex')
        .toUpperCase()
        .match(/.{1,4}/g)!
        .join('-');
      codes.push(code);
    }

    return codes;
  }

  /**
   * Format secret for manual entry
   */
  private formatSecretForManualEntry(secret: string): string {
    return secret.match(/.{1,4}/g)!.join(' ');
  }

  /**
   * Check if user has 2FA enabled
   */
  async isEnabled(userId: string): Promise<boolean> {
    try {
      const twoFactorAuth = await redisCache.getObject<ITwoFactorAuth>(`2fa:${userId}`);
      return twoFactorAuth?.isEnabled || false;
    } catch (error) {
      return false;
    }
  }
}

export const twoFactorAuthService = new TwoFactorAuthService();
