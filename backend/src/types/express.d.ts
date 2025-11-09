/**
 * Express Type Extensions
 * Extend Express Request to include authenticated user
 */

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        displayName: string;
        isEmailVerified?: boolean;
        twoFactorEnabled?: boolean;
        securityPinConfigured?: boolean;
        deviceId?: string;
      };
      deviceInfo?: {
        deviceId: string;
        deviceName: string;
        deviceType: string;
        platform: string;
        ipAddress?: string;
      };
    }
  }
}

export {};
