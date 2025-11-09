/**
 * Security PIN Service
 * Handles PIN/passcode for accessing messages on non-trusted devices
 * Professional-grade security with hashing, rate limiting, and device trust
 */

import { cosmosDBClient } from '../../infrastructure/database/cosmosdb.config';
import { AppError } from '../middleware/error.middleware';
import { SecurityPin, ISecurityPin } from '../../domain/entities/SecurityPin';
import { deviceService } from './DeviceService';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import bcrypt from 'bcryptjs';
import { logger } from '../../utils/logger';

export class SecurityPinService {
  private readonly securityPinsContainer = 'securityPins';
  private readonly HASH_ITERATIONS = 10000;
  private readonly KEY_LENGTH = 64;
  private readonly DIGEST = 'sha512';
  private readonly userRepository = new UserRepository();

  /**
   * Hash PIN with salt
   */
  private hashPin(pin: string, salt: string): string {
    return crypto
      .pbkdf2Sync(pin, salt, this.HASH_ITERATIONS, this.KEY_LENGTH, this.DIGEST)
      .toString('hex');
  }

  /**
   * Generate random salt
   */
  private generateSalt(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Set up security PIN (during signup or settings)
   */
  async setupPin(userId: string, pin: string): Promise<ISecurityPin> {
    // Validate PIN format (4-6 digits)
    if (!/^\d{4,6}$/.test(pin)) {
      throw new AppError('PIN must be 4-6 digits', 400);
    }

    // Check for existing PIN
    const existingPins = await cosmosDBClient.queryItems<ISecurityPin>(
      this.securityPinsContainer,
      'SELECT * FROM c WHERE c.userId = @userId',
      [{ name: '@userId', value: userId }]
    );

    const salt = this.generateSalt();
    const pinHash = this.hashPin(pin, salt);

    if (existingPins.length > 0) {
      // Update existing PIN
      const securityPin = existingPins[0];
      securityPin.pinHash = pinHash;
      securityPin.salt = salt;
      securityPin.isEnabled = true;
      securityPin.failedAttempts = 0;
      securityPin.lockedUntil = undefined;
      securityPin.updatedAt = new Date();
      const updated = await cosmosDBClient.upsertItem<ISecurityPin>(
        this.securityPinsContainer,
        securityPin
      );
      try {
        await this.userRepository.update(userId, { securityPinConfigured: true });
      } catch (error) {
        logger.error('Failed to update user while enabling security PIN:', error);
      }
      return updated;
    }

    // Create new PIN
    const securityPin = new SecurityPin({
      id: uuidv4(),
      userId,
      pinHash,
      salt,
      isEnabled: true,
      failedAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const created = await cosmosDBClient.upsertItem<ISecurityPin>(
      this.securityPinsContainer,
      securityPin
    );
    try {
      await this.userRepository.update(userId, { securityPinConfigured: true });
    } catch (error) {
      logger.error('Failed to update user while creating security PIN:', error);
    }
    return created;
  }

  /**
   * Verify PIN
   */
  async verifyPin(userId: string, pin: string, deviceId: string): Promise<{
    success: boolean;
    requiresPin: boolean;
    message?: string;
  }> {
    // Check if device is trusted
    const isTrusted = await deviceService.isDeviceTrusted(userId, deviceId);
    if (isTrusted) {
      return {
        success: true,
        requiresPin: false,
        message: 'Trusted device - no PIN required'
      };
    }

    // Get security PIN
    const securityPins = await cosmosDBClient.queryItems<ISecurityPin>(
      this.securityPinsContainer,
      'SELECT * FROM c WHERE c.userId = @userId',
      [{ name: '@userId', value: userId }]
    );

    if (securityPins.length === 0 || !securityPins[0].isEnabled) {
      return {
        success: true,
        requiresPin: false,
        message: 'No PIN configured'
      };
    }

    const securityPin = new SecurityPin(securityPins[0]);

    // Check if locked
    if (securityPin.isLocked()) {
      const lockMinutes = Math.ceil(
        (securityPin.lockedUntil!.getTime() - Date.now()) / (60 * 1000)
      );
      throw new AppError(
        `Too many failed attempts. Try again in ${lockMinutes} minutes`,
        429
      );
    }

    // Verify PIN
    const inputHash = this.hashPin(pin, securityPin.salt);
    if (inputHash !== securityPin.pinHash) {
      securityPin.incrementFailedAttempts();
      await cosmosDBClient.upsertItem(this.securityPinsContainer, securityPin);

      return {
        success: false,
        requiresPin: true,
        message: `Incorrect PIN. ${5 - securityPin.failedAttempts} attempts remaining`
      };
    }

    // PIN correct - reset failed attempts
    securityPin.resetFailedAttempts();
    await cosmosDBClient.upsertItem(this.securityPinsContainer, securityPin);

    // Verify device
    await deviceService.verifyDevice(userId, deviceId);

    return {
      success: true,
      requiresPin: true,
      message: 'PIN verified successfully'
    };
  }

  /**
   * Check if PIN is required for device
   */
  async isPinRequired(userId: string, deviceId: string): Promise<boolean> {
    // Check if device is trusted
    const isTrusted = await deviceService.isDeviceTrusted(userId, deviceId);
    if (isTrusted) {
      return false;
    }

    // Check if PIN is enabled
    const securityPins = await cosmosDBClient.queryItems<ISecurityPin>(
      this.securityPinsContainer,
      'SELECT * FROM c WHERE c.userId = @userId',
      [{ name: '@userId', value: userId }]
    );

    return securityPins.length > 0 && securityPins[0].isEnabled;
  }

  /**
   * Change PIN
   */
  async changePin(
    userId: string,
    options: {
      currentPin?: string;
      password?: string;
      newPin: string;
      deviceId?: string;
    }
  ): Promise<ISecurityPin> {
    const { currentPin, password, newPin, deviceId } = options;

    if (!password && !currentPin) {
      throw new AppError('Provide current PIN or account password to change security PIN', 400);
    }

    if (password) {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Invalid account password', 401);
      }
    } else if (currentPin && deviceId) {
      const verification = await this.verifyPin(userId, currentPin, deviceId);
      if (!verification.success) {
        throw new AppError('Current PIN is incorrect', 401);
      }
    } else if (currentPin && !deviceId) {
      throw new AppError('Device ID required when verifying with current PIN', 400);
    }

    const updated = await this.setupPin(userId, newPin);

    if (deviceId) {
      try {
        await deviceService.verifyDevice(userId, deviceId);
      } catch (error) {
        logger.warn('Device verification failed after PIN change', error as Error);
      }
    }

    return updated;
  }

  /**
   * Disable PIN
   */
  async disablePin(userId: string, pin: string, deviceId: string): Promise<void> {
    // Verify PIN before disabling
    const verification = await this.verifyPin(userId, pin, deviceId);
    if (!verification.success) {
      throw new AppError('PIN is incorrect', 401);
    }

    const securityPins = await cosmosDBClient.queryItems<ISecurityPin>(
      this.securityPinsContainer,
      'SELECT * FROM c WHERE c.userId = @userId',
      [{ name: '@userId', value: userId }]
    );

    if (securityPins.length > 0) {
      const securityPin = securityPins[0];
      securityPin.isEnabled = false;
      securityPin.updatedAt = new Date();
      await cosmosDBClient.upsertItem(this.securityPinsContainer, securityPin);
      try {
        await this.userRepository.update(userId, { securityPinConfigured: false });
      } catch (error) {
        logger.error('Failed to update user while disabling security PIN:', error);
      }
    }
  }

  /**
   * Enable PIN
   */
  async enablePin(userId: string, pin: string): Promise<ISecurityPin> {
    return await this.setupPin(userId, pin);
  }

  /**
   * Get PIN status
   */
  async getPinStatus(userId: string): Promise<{
    isEnabled: boolean;
    lastVerified?: Date;
    failedAttempts: number;
    isLocked: boolean;
    lockedUntil?: Date;
  }> {
    const securityPins = await cosmosDBClient.queryItems<ISecurityPin>(
      this.securityPinsContainer,
      'SELECT * FROM c WHERE c.userId = @userId',
      [{ name: '@userId', value: userId }]
    );

    if (securityPins.length === 0) {
      return {
        isEnabled: false,
        failedAttempts: 0,
        isLocked: false
      };
    }

    const securityPin = new SecurityPin(securityPins[0]);
    return {
      isEnabled: securityPin.isEnabled,
      lastVerified: securityPin.lastVerifiedAt,
      failedAttempts: securityPin.failedAttempts,
      isLocked: securityPin.isLocked(),
      lockedUntil: securityPin.lockedUntil
    };
  }

  /**
   * Reset PIN (for account recovery - requires additional verification)
   */
  async resetPin(userId: string): Promise<void> {
    const securityPins = await cosmosDBClient.queryItems<ISecurityPin>(
      this.securityPinsContainer,
      'SELECT * FROM c WHERE c.userId = @userId',
      [{ name: '@userId', value: userId }]
    );

    if (securityPins.length > 0) {
      await cosmosDBClient.deleteItem(this.securityPinsContainer, securityPins[0].id);
    }

    // Also revoke all device trust
    await deviceService.revokeAllDevicesExcept(userId, '');
    try {
      await this.userRepository.update(userId, { securityPinConfigured: false });
    } catch (error) {
      logger.error('Failed to update user while resetting security PIN:', error);
    }
  }
}

export const securityPinService = new SecurityPinService();
