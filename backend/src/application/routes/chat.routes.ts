/**
 * Chat Routes
 * Professional REST API routes for chat operations
 */

import { Router } from 'express';
import { chatController } from '../controllers/ChatController';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// All routes require authentication
router.use(authenticate);

// Chat management
router.post('/', chatController.createChat.bind(chatController));
router.get('/', chatController.getUserChats.bind(chatController));
router.get('/search', chatController.searchChats.bind(chatController));
router.get('/:chatId', chatController.getChat.bind(chatController));
router.patch('/:chatId', chatController.updateChat.bind(chatController));
router.delete('/:chatId', chatController.deleteChat.bind(chatController));

// Group avatar
router.post('/:chatId/avatar', upload.single('avatar'), chatController.uploadGroupAvatar.bind(chatController));

// Participants
router.post('/:chatId/participants', chatController.addParticipant.bind(chatController));
router.delete('/:chatId/participants/:participantId', chatController.removeParticipant.bind(chatController));
router.patch('/:chatId/participants/:participantId/role', chatController.updateParticipantRole.bind(chatController));

// Chat actions
router.post('/:chatId/mute', chatController.toggleMute.bind(chatController));
router.post('/:chatId/read', chatController.markAsRead.bind(chatController));
router.get('/:chatId/stats', chatController.getChatStats.bind(chatController));

export default router;
