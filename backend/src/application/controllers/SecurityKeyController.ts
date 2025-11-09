

import { Request, Response } from 'express';
import { securityKeyService } from '../services/SecurityKeyService';
import { logger } from '../../utils/logger';
// Using Express extended Request type from src/types/express.d.ts

export class SecurityKeyController {
  /**
   * POST /api/v1/security/keys/generate
   * Generate new key pair for device
   */
  generateKeyPair = async (_req: Request, res: Response): Promise<void> => {
    try {
      const keyPair = securityKeyService.generateKeyPair();

      res.status(200).json({
        success: true,
        message: 'Key pair generated successfully',
        data: {
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey,
          keyFingerprint: keyPair.keyFingerprint,
        },
      });
    } catch (error: any) {
      logger.error('Key pair generation error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to generate key pair',
      });
    }
  };

  /**
   * POST /api/v1/security/devices/register
   * Register a new device
   */
  registerDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const {
        deviceId,
        deviceName,
        deviceType,
        platform,
        publicKey,
        masterPassword,
      } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!deviceId || !deviceName || !deviceType || !platform || !publicKey) {
        res.status(400).json({
          success: false,
          message: 'Device information and public key are required',
        });
        return;
      }

      const securityKey = await securityKeyService.registerDevice(
        userId,
        {
          deviceId,
          deviceName,
          deviceType,
          platform,
          publicKey,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
        },
        masterPassword
      );

      res.status(201).json({
        success: true,
        message: 'Device registered successfully',
        data: {
          deviceId: securityKey.deviceId,
          deviceName: securityKey.deviceName,
          keyFingerprint: securityKey.keyFingerprint,
          status: securityKey.status,
          createdAt: securityKey.createdAt,
        },
      });
    } catch (error: any) {
      logger.error('Device registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to register device',
      });
    }
  };

  /**
   * GET /api/v1/security/devices
   * Get all registered devices
   */
  getDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const devices = await securityKeyService.getUserDevices(userId);

      res.status(200).json({
        success: true,
        data: {
          devices,
          totalDevices: devices.length,
        },
      });
    } catch (error: any) {
      logger.error('Get devices error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get devices',
      });
    }
  };

  /**
   * DELETE /api/v1/security/devices/:deviceId
   * Revoke a device
   */
  revokeDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { deviceId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!deviceId) {
        res.status(400).json({
          success: false,
          message: 'Device ID is required',
        });
        return;
      }

      await securityKeyService.revokeDevice(userId, deviceId);

      res.status(200).json({
        success: true,
        message: 'Device revoked successfully',
      });
    } catch (error: any) {
      logger.error('Revoke device error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to revoke device',
      });
    }
  };

  /**
   * POST /api/v1/security/messages/:messageId/keys
   * Encrypt message key for recipient devices
   */
  encryptMessageKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { messageId } = req.params;
      const { chatId, messageKey, recipientUserIds } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!messageKey || !recipientUserIds || !Array.isArray(recipientUserIds)) {
        res.status(400).json({
          success: false,
          message: 'Message key and recipient user IDs are required',
        });
        return;
      }

      const messageKeys = await securityKeyService.encryptMessageKeyForDevices(
        messageId,
        chatId,
        userId,
        messageKey,
        recipientUserIds
      );

      res.status(201).json({
        success: true,
        message: 'Message keys encrypted for all recipient devices',
        data: {
          totalKeys: messageKeys.length,
          recipients: recipientUserIds.length,
        },
      });
    } catch (error: any) {
      logger.error('Encrypt message key error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to encrypt message key',
      });
    }
  };

  /**
   * GET /api/v1/security/messages/:messageId/keys/:deviceId
   * Get encrypted message key for device
   */
  getMessageKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { messageId, deviceId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const messageKey = await securityKeyService.getMessageKeyForDevice(
        messageId,
        deviceId
      );

      if (!messageKey) {
        res.status(404).json({
          success: false,
          message: 'Message key not found for this device',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: messageKey,
      });
    } catch (error: any) {
      logger.error('Get message key error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get message key',
      });
    }
  };

  /**
   * POST /api/v1/security/devices/:deviceId/verify
   * Verify device ownership with signature
   */
  verifyDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { deviceId } = req.params;
      const { signature, challenge } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!signature || !challenge) {
        res.status(400).json({
          success: false,
          message: 'Signature and challenge are required',
        });
        return;
      }

      const isValid = await securityKeyService.verifyDevice(
        userId,
        deviceId,
        signature,
        challenge
      );

      res.status(200).json({
        success: true,
        message: isValid ? 'Device verified' : 'Device verification failed',
        data: { isValid },
      });
    } catch (error: any) {
      logger.error('Verify device error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to verify device',
      });
    }
  };
}
