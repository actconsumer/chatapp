import { Router } from 'express';
import { callController } from '../controllers/CallController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/initiate', callController.initiateCall.bind(callController));
router.post('/:callId/answer', callController.answerCall.bind(callController));
router.post('/:callId/reject', callController.rejectCall.bind(callController));
router.post('/:callId/end', callController.endCall.bind(callController));
router.get('/history', callController.getHistory.bind(callController));
router.get('/settings', callController.getSettings.bind(callController));
router.patch('/settings', callController.updateSettings.bind(callController));
router.get('/acs-token', callController.getAcsToken.bind(callController));
router.post('/telemetry', callController.sendTelemetry.bind(callController));
router.get('/:callId/quality', callController.getCallQuality.bind(callController));
router.get('/:callId', callController.getCall.bind(callController));
router.post('/:callId/participants', callController.addParticipants.bind(callController));
router.delete('/:callId/participants/:participantId', callController.removeParticipant.bind(callController));

export default router;
