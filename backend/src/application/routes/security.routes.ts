/**
 * Security Key Routes
 * Endpoints for device registration and encryption key management
 */

import { Router } from 'express';
import { SecurityKeyController } from '../controllers/SecurityKeyController';
import { authenticate } from '../middleware/auth.middleware';
import { body, param, ValidationChain } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();
const securityKeyController = new SecurityKeyController();

// Validation rules
const validateRegisterDevice: ValidationChain[] = [
  body('deviceId')
    .isString()
    .notEmpty()
    .withMessage('Device ID is required'),
  body('deviceName')
    .isString()
    .notEmpty()
    .withMessage('Device name is required'),
  body('deviceType')
    .isString()
    .isIn(['mobile', 'desktop', 'tablet', 'web'])
    .withMessage('Invalid device type'),
  body('platform')
    .isString()
    .notEmpty()
    .withMessage('Platform is required'),
  body('publicKey')
    .isString()
    .notEmpty()
    .withMessage('Public key is required'),
];

const validateEncryptMessageKey: ValidationChain[] = [
  param('messageId')
    .isString()
    .notEmpty()
    .withMessage('Message ID is required'),
  body('chatId')
    .isString()
    .notEmpty()
    .withMessage('Chat ID is required'),
  body('messageKey')
    .isString()
    .notEmpty()
    .withMessage('Message key is required'),
  body('recipientUserIds')
    .isArray()
    .notEmpty()
    .withMessage('Recipient user IDs are required'),
];

const validateDeviceId: ValidationChain[] = [
  param('deviceId')
    .isString()
    .notEmpty()
    .withMessage('Device ID is required'),
];

const validateVerifyDevice: ValidationChain[] = [
  param('deviceId')
    .isString()
    .notEmpty()
    .withMessage('Device ID is required'),
  body('signature')
    .isString()
    .notEmpty()
    .withMessage('Signature is required'),
  body('challenge')
    .isString()
    .notEmpty()
    .withMessage('Challenge is required'),
];

/**
 * @route   POST /api/v1/security/keys/generate
 * @desc    Generate new RSA key pair for device
 * @access  Public
 */
router.post('/keys/generate', securityKeyController.generateKeyPair);

/**
 * @route   POST /api/v1/security/devices/register
 * @desc    Register a new device
 * @access  Private
 */
router.post(
  '/devices/register',
  authenticate,
  validateRegisterDevice,
  validateRequest,
  securityKeyController.registerDevice
);

/**
 * @route   GET /api/v1/security/devices
 * @desc    Get all registered devices
 * @access  Private
 */
router.get('/devices', authenticate, securityKeyController.getDevices);

/**
 * @route   DELETE /api/v1/security/devices/:deviceId
 * @desc    Revoke a device
 * @access  Private
 */
router.delete(
  '/devices/:deviceId',
  authenticate,
  validateDeviceId,
  validateRequest,
  securityKeyController.revokeDevice
);

/**
 * @route   POST /api/v1/security/messages/:messageId/keys
 * @desc    Encrypt message key for recipient devices
 * @access  Private
 */
router.post(
  '/messages/:messageId/keys',
  authenticate,
  validateEncryptMessageKey,
  validateRequest,
  securityKeyController.encryptMessageKey
);

/**
 * @route   GET /api/v1/security/messages/:messageId/keys/:deviceId
 * @desc    Get encrypted message key for device
 * @access  Private
 */
router.get(
  '/messages/:messageId/keys/:deviceId',
  authenticate,
  securityKeyController.getMessageKey
);

/**
 * @route   POST /api/v1/security/devices/:deviceId/verify
 * @desc    Verify device ownership with signature
 * @access  Private
 */
router.post(
  '/devices/:deviceId/verify',
  authenticate,
  validateVerifyDevice,
  validateRequest,
  securityKeyController.verifyDevice
);

export default router;
