/**
 * Authentication Middleware
 * Protects routes and verifies JWT tokens
 */

import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../../utils/jwt';
import { cosmosDBClient } from '../../infrastructure/database/cosmosdb.config';
import { IUser } from '../../domain/entities/User';
import { logger } from '../../utils/logger';

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = jwtService.verifyAccessToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }

    // Get user from database to ensure they still exist
    const user = await cosmosDBClient.getItem<IUser>('users', payload.userId);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Attach user to request matching Express type extensions
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      twoFactorEnabled: user.twoFactorEnabled,
      securityPinConfigured: user.securityPinConfigured ?? false,
      isEmailVerified: user.isEmailVerified,
      deviceId: payload.deviceId || undefined,
    };

    // Attach device info if available
    if (req.headers['x-device-id']) {
      req.deviceInfo = {
        deviceId: req.headers['x-device-id'] as string,
        deviceName: req.headers['x-device-name'] as string || 'Unknown',
        deviceType: req.headers['x-device-type'] as string || 'mobile',
        platform: req.headers['x-platform'] as string || 'unknown',
        ipAddress: req.ip || req.connection.remoteAddress,
      };
    }

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = jwtService.verifyAccessToken(token);

      if (payload) {
        const user = await cosmosDBClient.getItem<IUser>('users', payload.userId);
        
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            isEmailVerified: user.isEmailVerified,
            twoFactorEnabled: user.twoFactorEnabled,
            securityPinConfigured: user.securityPinConfigured ?? false,
            deviceId: payload.deviceId || undefined,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};
