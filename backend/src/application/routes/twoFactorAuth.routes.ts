/**
 * Two-Factor Authentication Routes
 * Endpoints for 2FA management
 */

import { Router } from 'express';
import { TwoFactorAuthController } from '../controllers/TwoFactorAuthController';
import { authenticate } from '../middleware/auth.middleware';
import { body, ValidationChain } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();
const twoFactorAuthController = new TwoFactorAuthController();

// Validation rules
const validateVerify: ValidationChain[] = [
  body('token')
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage('Token must be 6 digits'),
];

const validateLogin: ValidationChain[] = [
  body('userId')
    .isString()
    .notEmpty()
    .withMessage('User ID is required'),
  body('token')
    .optional()
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage('Token must be 6 digits'),
  body('backupCode')
    .optional()
    .isString()
    .isLength({ min: 8, max: 8 })
    .withMessage('Backup code must be 8 characters'),
];

const validateDisable: ValidationChain[] = [
  body('password')
    .isString()
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * @route   POST /api/v1/auth/2fa/setup
 * @desc    Generate 2FA setup (QR code, secret, backup codes)
 * @access  Private
 */
router.post('/setup', authenticate, twoFactorAuthController.setup);

/**
 * @route   POST /api/v1/auth/2fa/verify
 * @desc    Verify TOTP token and enable 2FA
 * @access  Private
 */
router.post(
  '/verify',
  authenticate,
  validateVerify,
  validateRequest,
  twoFactorAuthController.verify
);

/**
 * @route   POST /api/v1/auth/2fa/validate
 * @desc    Validate TOTP token during login
 * @access  Public (called during login flow)
 */
router.post(
  '/validate',
  validateLogin,
  validateRequest,
  twoFactorAuthController.validate
);

/**
 * @route   POST /api/v1/auth/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post(
  '/disable',
  authenticate,
  validateDisable,
  validateRequest,
  twoFactorAuthController.disable
);

/**
 * @route   POST /api/v1/auth/2fa/backup-codes/regenerate
 * @desc    Regenerate backup codes
 * @access  Private
 */
router.post(
  '/backup-codes/regenerate',
  authenticate,
  twoFactorAuthController.regenerateBackupCodes
);

/**
 * @route   GET /api/v1/auth/2fa/status
 * @desc    Get 2FA status
 * @access  Private
 */
router.get('/status', authenticate, twoFactorAuthController.getStatus);

export default router;
