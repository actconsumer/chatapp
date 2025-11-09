/**
 * Authentication Service
 * Business logic for authentication operations
 */

import { IUser } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/interfaces';
import { jwtService, TokenPair } from '../../utils/jwt';
import { encryptionService } from '../../utils/encryption';
import { emailService } from '../../utils/email';
import { redisCache } from '../../infrastructure/cache/redis.config';
import { logger } from '../../utils/logger';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  constructor(private userRepository: IUserRepository) {}

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ user: IUser; tokens: TokenPair }> {
    try {
      // Check if user already exists
      const existingEmail = await this.userRepository.findByEmail(data.email);
      if (existingEmail) {
        throw new Error('Email already registered');
      }

      const existingUsername = await this.userRepository.findByUsername(data.username);
      if (existingUsername) {
        throw new Error('Username already taken');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);

      // Create user
      const user = await this.userRepository.create({
        id: uuidv4(),
        email: data.email.toLowerCase(),
        username: data.username.toLowerCase(),
        displayName: data.displayName,
        passwordHash,
        isEmailVerified: false,
        isPhoneVerified: false,
        isActive: true,
        isOnline: false,
        lastSeen: new Date(),
        privacySettings: {
          showOnlineStatus: true,
          showLastSeen: true,
          showProfilePhoto: 'everyone',
          whoCanAddToGroups: 'everyone',
        },
        twoFactorEnabled: false,
        securityPinConfigured: false,
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IUser);

      // Generate OTP for email verification
      await this.sendEmailVerificationOTP(user.email);

      // Generate tokens
      const tokens = jwtService.generateTokenPair(user);

      // Store refresh token
      await this.userRepository.addRefreshToken(user.id, tokens.refreshToken);

      // Cache session
      await redisCache.setSession(user.id, { userId: user.id, email: user.email });

      logger.info(`User registered: ${user.email}`);

      return { user, tokens };
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<{ user: IUser; tokens: TokenPair }> {
    try {
      // Find user
      const user = await this.userRepository.findByEmail(data.email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Generate tokens
      const tokens = jwtService.generateTokenPair(user);

      // Store refresh token
      await this.userRepository.addRefreshToken(user.id, tokens.refreshToken);

      // Update online status
      await this.userRepository.updateOnlineStatus(user.id, true);

      // Cache session
      await redisCache.setSession(user.id, { userId: user.id, email: user.email });

      logger.info(`User logged in: ${user.email}`);

      return { user, tokens };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      // Remove refresh token
      await this.userRepository.removeRefreshToken(userId, refreshToken);

      // Update online status
      await this.userRepository.updateOnlineStatus(userId, false);

      // Remove session
      await redisCache.deleteSession(userId);

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = jwtService.verifyRefreshToken(refreshToken);
      if (!payload) {
        throw new Error('Invalid refresh token');
      }

      // Find user
      const user = await this.userRepository.findByRefreshToken(refreshToken);
      if (!user) {
        throw new Error('User not found or token invalid');
      }

      // Generate new tokens
      const tokens = jwtService.generateTokenPair(user);

      // Replace old refresh token with new one
      await this.userRepository.removeRefreshToken(user.id, refreshToken);
      await this.userRepository.addRefreshToken(user.id, tokens.refreshToken);

      logger.info(`Token refreshed for user: ${user.id}`);

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Send email verification OTP
   */
  async sendEmailVerificationOTP(email: string): Promise<void> {
    try {
      // Generate OTP
      const otpCode = encryptionService.generateOTP(6);

      // Store OTP in cache (10 minutes expiry)
      await redisCache.set(
        `otp:email:${email}`,
        JSON.stringify({
          code: otpCode,
          purpose: 'email_verification',
          attempts: 0,
          createdAt: new Date().toISOString(),
        }),
        600
      );

      // Send email
      await emailService.sendOTPEmail(email, otpCode, 'email_verification');

      logger.info(`OTP sent to: ${email}`);
    } catch (error) {
      logger.error('Failed to send OTP:', error);
      throw error;
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(email: string, otpCode: string): Promise<boolean> {
    try {
      const key = `otp:email:${email}`;
      const otpData = await redisCache.get(key);

      if (!otpData) {
        throw new Error('OTP expired or not found');
      }

      const otp = JSON.parse(otpData);

      // Check attempts
      if (otp.attempts >= 5) {
        await redisCache.del(key);
        throw new Error('Too many attempts. Please request a new OTP.');
      }

      // Verify code
      if (otp.code !== otpCode) {
        otp.attempts += 1;
        await redisCache.set(key, JSON.stringify(otp), 600);
        throw new Error('Invalid OTP code');
      }

      // Update user
      const user = await this.userRepository.findByEmail(email);
      if (user) {
        await this.userRepository.update(user.id, { isEmailVerified: true });
        
        // Send welcome email
        await emailService.sendWelcomeEmail(email, user.displayName);
      }

      // Delete OTP
      await redisCache.del(key);

      logger.info(`Email verified: ${email}`);
      return true;
    } catch (error) {
      logger.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return;
      }

      // Generate OTP
      const otpCode = encryptionService.generateOTP(6);

      // Store OTP in cache (10 minutes expiry)
      await redisCache.set(
        `otp:reset:${email}`,
        JSON.stringify({
          code: otpCode,
          purpose: 'password_reset',
          attempts: 0,
          userId: user.id,
          createdAt: new Date().toISOString(),
        }),
        600
      );

      // Send email
      await emailService.sendOTPEmail(email, otpCode, 'password_reset');

      logger.info(`Password reset OTP sent to: ${email}`);
    } catch (error) {
      logger.error('Password reset request failed:', error);
      throw error;
    }
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(email: string, otpCode: string, newPassword: string): Promise<void> {
    try {
      const key = `otp:reset:${email}`;
      const otpData = await redisCache.get(key);

      if (!otpData) {
        throw new Error('OTP expired or not found');
      }

      const otp = JSON.parse(otpData);

      // Check attempts
      if (otp.attempts >= 5) {
        await redisCache.del(key);
        throw new Error('Too many attempts. Please request a new OTP.');
      }

      // Verify code
      if (otp.code !== otpCode) {
        otp.attempts += 1;
        await redisCache.set(key, JSON.stringify(otp), 600);
        throw new Error('Invalid OTP code');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update user password
      await this.userRepository.update(otp.userId, { passwordHash });

      // Invalidate all refresh tokens for security
      await this.userRepository.update(otp.userId, { refreshTokens: [] });

      // Delete OTP
      await redisCache.del(key);

      logger.info(`Password reset for user: ${otp.userId}`);
    } catch (error) {
      logger.error('Password reset failed:', error);
      throw error;
    }
  }
}
