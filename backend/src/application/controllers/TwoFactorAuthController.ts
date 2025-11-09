/**
 * Two-Factor Authentication Controller
 * Handles 2FA setup, verification, and management
 */

import { Request, Response } from 'express';
import { twoFactorAuthService } from '../services/TwoFactorAuthService';
import { logger } from '../../utils/logger';
// Using extended Express Request type (see src/types/express.d.ts) rather than a custom AuthRequest type

export class TwoFactorAuthController {
  /**
   * POST /api/v1/auth/2fa/setup
   * Generate 2FA setup (secret, QR code, backup codes)
   */
  setup = async (req: Request, res: Response): Promise<void> => {
    try {
  const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Get user data (in production, fetch from repository)
      const user = {
        id: userId,
  email: req.user?.email || '',
  username: req.user?.username || '',
      } as any;

      const setupData = await twoFactorAuthService.generateSetup(user);

      res.status(200).json({
        success: true,
        message: '2FA setup generated. Scan QR code and verify to enable.',
        data: {
          qrCodeUrl: setupData.qrCodeUrl,
          manualEntryKey: setupData.manualEntryKey,
          backupCodes: setupData.backupCodes,
        },
      });
    } catch (error: any) {
      logger.error('2FA setup error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to generate 2FA setup',
      });
    }
  };

  /**
   * POST /api/v1/auth/2fa/verify
   * Verify TOTP token and enable 2FA
   */
  verify = async (req: Request, res: Response): Promise<void> => {
    try {
  const userId = req.user?.id;
      const { token } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Verification token is required',
        });
        return;
      }

      const twoFactorAuth = await twoFactorAuthService.verifyAndEnable(userId, token);

      res.status(200).json({
        success: true,
        message: '2FA enabled successfully',
        data: {
          isEnabled: twoFactorAuth.isEnabled,
          enabledAt: twoFactorAuth.enabledAt,
          backupCodesCount: twoFactorAuth.backupCodes.length,
        },
      });
    } catch (error: any) {
      logger.error('2FA verification error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '2FA verification failed',
      });
    }
  };

  /**
   * POST /api/v1/auth/2fa/validate
   * Validate TOTP token during login
   */
  validate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, token, backupCode } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      let isValid = false;

      // Try backup code first if provided
      if (backupCode) {
        isValid = await twoFactorAuthService.verifyBackupCode(userId, backupCode);
        
        if (isValid) {
          res.status(200).json({
            success: true,
            message: 'Backup code verified. Please enable 2FA again.',
            data: { isValid: true, usedBackupCode: true },
          });
          return;
        }
      }

      // Validate TOTP token
      if (token) {
        isValid = await twoFactorAuthService.verifyToken(userId, token);
      }

      if (!isValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid verification code',
          data: { isValid: false },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: '2FA code verified',
        data: { isValid: true },
      });
    } catch (error: any) {
      logger.error('2FA validation error:', error);
      res.status(400).json({
        success: false,
        message: error.message || '2FA validation failed',
      });
    }
  };

  /**
   * POST /api/v1/auth/2fa/disable
   * Disable 2FA
   */
  disable = async (req: Request, res: Response): Promise<void> => {
    try {
  const userId = req.user?.id;
      const { password } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!password) {
        res.status(400).json({
          success: false,
          message: 'Password is required to disable 2FA',
        });
        return;
      }

      await twoFactorAuthService.disable(userId, password);

      res.status(200).json({
        success: true,
        message: '2FA disabled successfully',
      });
    } catch (error: any) {
      logger.error('2FA disable error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to disable 2FA',
      });
    }
  };

  /**
   * POST /api/v1/auth/2fa/backup-codes/regenerate
   * Regenerate backup codes
   */
  regenerateBackupCodes = async (req: Request, res: Response): Promise<void> => {
    try {
  const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const backupCodes = await twoFactorAuthService.regenerateBackupCodes(userId);

      res.status(200).json({
        success: true,
        message: 'Backup codes regenerated successfully',
        data: {
          backupCodes,
        },
      });
    } catch (error: any) {
      logger.error('Backup codes regeneration error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to regenerate backup codes',
      });
    }
  };

  /**
   * GET /api/v1/auth/2fa/status
   * Get 2FA status
   */
  getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
  const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const status = await twoFactorAuthService.getStatus(userId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      logger.error('Get 2FA status error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get 2FA status',
      });
    }
  };
}
