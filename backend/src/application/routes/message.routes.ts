/**
 * Message Routes
 * Professional REST API routes for message operations
 */

import { Router } from 'express';
import { messageController } from '../controllers/MessageController';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB for videos
});

// All routes require authentication
router.use(authenticate);

// Message operations
router.post('/', messageController.sendMessage.bind(messageController));
router.post('/upload', upload.single('file'), messageController.uploadMedia.bind(messageController));
router.get('/:chatId', messageController.getMessages.bind(messageController));
router.get('/:chatId/search', messageController.searchMessages.bind(messageController));
router.get('/:chatId/unread-count', messageController.getUnreadCount.bind(messageController));
router.get('/:chatId/:messageId', messageController.getMessage.bind(messageController));

// Message actions
router.patch('/:messageId', messageController.editMessage.bind(messageController));
router.delete('/:messageId', messageController.deleteMessage.bind(messageController));
router.delete('/:messageId/forme', messageController.deleteMessageForMe.bind(messageController));

// Reactions
router.post('/:messageId/reactions', messageController.addReaction.bind(messageController));
router.delete('/:messageId/reactions/:emoji', messageController.removeReaction.bind(messageController));

// Forward
router.post('/:messageId/forward', messageController.forwardMessage.bind(messageController));

// Status
router.post('/:chatId/delivered', messageController.markAsDelivered.bind(messageController));
router.post('/:chatId/read', messageController.markAsRead.bind(messageController));

export default router;
