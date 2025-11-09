/**
 * Story Routes
 * Production-grade REST API routes for story management
 */

import { Router } from 'express';
import { storyController } from '../controllers/StoryController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Story media upload
router.post('/upload', storyController.uploadStoryMedia.bind(storyController));

// Story CRUD operations
router.post('/', storyController.createStory.bind(storyController));
router.get('/', storyController.getFriendsStories.bind(storyController));
router.get('/grouped', storyController.getStoriesGroupedByUser.bind(storyController));
router.get('/my', storyController.getMyStories.bind(storyController));
router.get('/user/:userId', storyController.getUserStories.bind(storyController));
router.get('/:storyId', storyController.getStory.bind(storyController));
router.delete('/:storyId', storyController.deleteStory.bind(storyController));

// Story interactions
router.post('/:storyId/view', storyController.viewStory.bind(storyController));
router.get('/:storyId/viewers', storyController.getStoryViewers.bind(storyController));
router.post('/:storyId/react', storyController.addReaction.bind(storyController));
router.delete('/:storyId/react', storyController.removeReaction.bind(storyController));

// Admin/Cron endpoint for cleanup
router.post('/cleanup', storyController.cleanupExpiredStories.bind(storyController));

export default router;
