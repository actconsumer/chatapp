/**
 * Security PIN Controller
 * Professional REST API controller for security PIN operations
 */

import { Request, Response, NextFunction } from 'express';
import { securityPinService } from '../services/SecurityPinService';
import { deviceService } from '../services/DeviceService';
import { AppError } from '../middleware/error.middleware';

export class SecurityPinController {
  /**
   * Setup PIN
   * POST /api/security/pin/setup
   */
  async setupPin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pin } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const securityPin = await securityPinService.setupPin(userId, pin);

      res.status(201).json({
        success: true,
        message: 'Security PIN configured successfully',
        data: {
          isEnabled: securityPin.isEnabled,
          createdAt: securityPin.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify PIN
   * POST /api/security/pin/verify
   */
  async verifyPin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pin } = req.body;
      const userId = req.user?.id;
      const deviceId = req.deviceInfo?.deviceId || req.body.deviceId;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      if (!deviceId) {
        throw new AppError('Device ID required', 400);
      }

      const result = await securityPinService.verifyPin(userId, pin, deviceId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if PIN is required
   * GET /api/security/pin/required
   */
  async isPinRequired(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const deviceId = req.deviceInfo?.deviceId || req.query.deviceId as string;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      if (!deviceId) {
        throw new AppError('Device ID required', 400);
      }

      const required = await securityPinService.isPinRequired(userId, deviceId);

      res.json({
        success: true,
        data: { required }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change PIN
   * PUT /api/security/pin
   */
  async changePin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPin, newPin, password } = req.body;
      const userId = req.user?.id;
      const deviceId = req.deviceInfo?.deviceId || req.body.deviceId;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      if (!newPin) {
        throw new AppError('New PIN is required', 400);
      }

      if (currentPin && !deviceId) {
        throw new AppError('Device ID required when verifying with current PIN', 400);
      }

      const securityPin = await securityPinService.changePin(userId, {
        currentPin,
        password,
        newPin,
        deviceId,
      });

      res.json({
        success: true,
        message: 'PIN changed successfully',
        data: {
          isEnabled: securityPin.isEnabled,
          updatedAt: securityPin.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disable PIN
   * DELETE /api/security/pin
   */
  async disablePin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pin } = req.body;
      const userId = req.user?.id;
      const deviceId = req.deviceInfo?.deviceId || req.body.deviceId;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      if (!deviceId) {
        throw new AppError('Device ID required', 400);
      }

      await securityPinService.disablePin(userId, pin, deviceId);

      res.json({
        success: true,
        message: 'Security PIN disabled'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enable PIN
   * POST /api/security/pin/enable
   */
  async enablePin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pin } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const securityPin = await securityPinService.enablePin(userId, pin);

      res.json({
        success: true,
        message: 'Security PIN enabled',
        data: {
          isEnabled: securityPin.isEnabled
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get PIN status
   * GET /api/security/pin/status
   */
  async getPinStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const status = await securityPinService.getPinStatus(userId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Trust device (skip PIN on this device)
   * POST /api/security/devices/trust
   */
  async trustDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const deviceId = req.deviceInfo?.deviceId || req.body.deviceId;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      if (!deviceId) {
        throw new AppError('Device ID required', 400);
      }

      const device = await deviceService.trustDevice(userId, deviceId);

      res.json({
        success: true,
        message: 'Device trusted successfully',
        data: device
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get trusted devices
   * GET /api/security/devices
   */
  async getTrustedDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const devices = await deviceService.getUserDevices(userId);

      res.json({
        success: true,
        data: devices
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke device trust
   * DELETE /api/security/devices/:deviceId
   */
  async revokeDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { deviceId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      await deviceService.revokeDevice(userId, deviceId);

      res.json({
        success: true,
        message: 'Device trust revoked'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke all devices except current
   * POST /api/security/devices/revoke-all
   */
  async revokeAllDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const currentDeviceId = req.deviceInfo?.deviceId || req.body.deviceId;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      if (!currentDeviceId) {
        throw new AppError('Device ID required', 400);
      }

      const revokedCount = await deviceService.revokeAllDevicesExcept(userId, currentDeviceId);

      res.json({
        success: true,
        message: `${revokedCount} device(s) revoked`,
        data: { revokedCount }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const securityPinController = new SecurityPinController();
