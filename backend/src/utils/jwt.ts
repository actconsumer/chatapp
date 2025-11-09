/**
 * JWT Token Utility
 * Handles JWT token generation, verification, and refresh
 */

import jwt from 'jsonwebtoken';
import { IUser } from '../domain/entities/User';
import { logger } from './logger';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  deviceId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class JWTService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

    if (this.accessTokenSecret.length < 32) {
      logger.warn('JWT_SECRET should be at least 32 characters long');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  public generateTokenPair(user: IUser | TokenPayload): TokenPair {
    const payload: TokenPayload = {
      userId: 'id' in user ? user.id : user.userId,
      email: user.email,
      username: user.username,
    };

    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
    } as jwt.SignOptions);

    // Calculate expiry time in seconds
    const expiresIn = this.getExpirySeconds(this.accessTokenExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify access token
   */
  public verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      logger.error('Access token verification failed:', error);
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  public verifyRefreshToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      logger.error('Refresh token verification failed:', error);
      return null;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  public decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Token decode failed:', error);
      return null;
    }
  }

  /**
   * Get expiry time in seconds from expiry string
   */
  private getExpirySeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }
}

export const jwtService = new JWTService();
