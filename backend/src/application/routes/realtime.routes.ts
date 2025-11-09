import { Router } from 'express';
import { realtimeController } from '../controllers/RealtimeController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.post('/negotiate', realtimeController.negotiate.bind(realtimeController));

export default router;
