/**
 * Security PIN Routes
 * Professional REST API routes for security PIN and device trust operations
 */

import { Router } from 'express';
import { securityPinController } from '../controllers/SecurityPinController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// PIN management
router.post('/setup', securityPinController.setupPin.bind(securityPinController));
router.post('/verify', securityPinController.verifyPin.bind(securityPinController));
router.get('/required', securityPinController.isPinRequired.bind(securityPinController));
router.put('/', securityPinController.changePin.bind(securityPinController));
router.delete('/', securityPinController.disablePin.bind(securityPinController));
router.post('/enable', securityPinController.enablePin.bind(securityPinController));
router.get('/status', securityPinController.getPinStatus.bind(securityPinController));

// Device trust management
router.post('/devices/trust', securityPinController.trustDevice.bind(securityPinController));
router.get('/devices', securityPinController.getTrustedDevices.bind(securityPinController));
router.delete('/devices/:deviceId', securityPinController.revokeDevice.bind(securityPinController));
router.post('/devices/revoke-all', securityPinController.revokeAllDevices.bind(securityPinController));

export default router;
