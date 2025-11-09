/**
 * Story Controller
 * Production-grade REST API for story management
 * Features: Story creation, viewing, reactions, privacy controls, media upload
 */

import { Request, Response, NextFunction } from 'express';
import { storyService } from '../services/StoryService';
import { AppError } from '../middleware/error.middleware';
import multer from 'multer';
import path from 'path';

// Configure multer for story media uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
}).single('media');

export class StoryController {
  /**
   * Upload story media
   * POST /api/stories/upload
   */
  async uploadStoryMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      upload(req, res, async (err) => {
        if (err) {
          return next(new AppError(err.message, 400));
        }

        if (!req.file) {
          throw new AppError('No media file provided', 400);
        }

        try {
          const result = await storyService.uploadStoryMedia(
            req.user!.id,
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
          );

          res.json({
            success: true,
            data: result
          });
        } catch (uploadError) {
          next(uploadError);
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new story
   * POST /api/stories
   * Supports both JSON body (with pre-uploaded mediaUrl) and multipart/form-data (direct upload)
   */
  async createStory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      // Handle multipart file upload
      upload(req, res, async (err) => {
        if (err && !(err.message === 'Unexpected field')) {
          return next(new AppError(err.message, 400));
        }

        try {
          let mediaUrl: string;
          let mediaType: 'image' | 'video' | 'text' = 'image';
          let thumbnailUrl: string | undefined;

          // Check if file was uploaded
          if (req.file) {
            // Direct file upload
            const uploadResult = await storyService.uploadStoryMedia(
              req.user!.id,
              req.file.buffer,
              req.file.originalname,
              req.file.mimetype
            );
            
            mediaUrl = uploadResult.url;
            mediaType = uploadResult.type;
          } else {
            // Pre-uploaded URL or text story
            mediaUrl = req.body.mediaUrl;
            mediaType = req.body.mediaType;

            if (!mediaUrl && mediaType !== 'text') {
              throw new AppError('Media URL or file is required', 400);
            }
          }

          // Extract other fields from body
          const {
            caption,
            backgroundColor,
            duration,
            privacy,
            customViewerIds,
            text,
          } = req.body;

          // Validate media type
          if (mediaType && !['image', 'video', 'text'].includes(mediaType)) {
            throw new AppError('Invalid media type', 400);
          }

          // For text stories, use backgroundColor as mediaUrl placeholder
          if (mediaType === 'text' || !mediaUrl) {
            mediaUrl = backgroundColor || '#667eea';
          }

          // Parse JSON fields if they're strings
          const parsedCustomViewerIds = typeof customViewerIds === 'string' 
            ? JSON.parse(customViewerIds) 
            : customViewerIds;

          const story = await storyService.createStory(
            req.user!.id,
            mediaUrl,
            mediaType === 'text' ? 'image' : mediaType,
            {
              caption: caption || text,
              backgroundColor,
              thumbnailUrl: thumbnailUrl || req.body.thumbnailUrl,
              duration: duration ? parseInt(duration) : undefined,
              privacy,
              customViewerIds: parsedCustomViewerIds,
            }
          );

          res.status(201).json({
            success: true,
            data: story,
          });
        } catch (uploadError) {
          next(uploadError);
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get friends' active stories
   * GET /api/stories
   */
  async getFriendsStories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const stories = await storyService.getFriendsStories(req.user.id);

      res.json({
        success: true,
        data: stories
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stories grouped by user
   * GET /api/stories/grouped
   */
  async getStoriesGroupedByUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const groupedStories = await storyService.getStoriesGroupedByUser(req.user.id);

      // Convert Map to object for JSON serialization
      const storiesObject = Object.fromEntries(groupedStories);

      res.json({
        success: true,
        data: storiesObject
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's stories
   * GET /api/stories/my
   */
  async getMyStories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const stories = await storyService.getUserStories(req.user.id);

      res.json({
        success: true,
        data: stories
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific user's stories
   * GET /api/stories/user/:userId
   */
  async getUserStories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { userId } = req.params;
      const stories = await storyService.getUserStories(userId);

      res.json({
        success: true,
        data: stories
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single story
   * GET /api/stories/:storyId
   */
  async getStory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { storyId } = req.params;
      const story = await storyService.getStory(storyId, req.user.id);

      res.json({
        success: true,
        data: story
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * View a story (track view)
   * POST /api/stories/:storyId/view
   */
  async viewStory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { storyId } = req.params;
      const story = await storyService.viewStory(storyId, req.user.id);

      res.json({
        success: true,
        data: story
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get story viewers
   * GET /api/stories/:storyId/viewers
   */
  async getStoryViewers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { storyId } = req.params;
      const viewers = await storyService.getStoryViewers(storyId, req.user.id);

      res.json({
        success: true,
        data: viewers
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add reaction to story
   * POST /api/stories/:storyId/react
   */
  async addReaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { storyId } = req.params;
      const { emoji } = req.body;

      if (!emoji) {
        throw new AppError('Emoji is required', 400);
      }

      const story = await storyService.addReaction(storyId, req.user.id, emoji);

      res.json({
        success: true,
        data: story
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove reaction from story
   * DELETE /api/stories/:storyId/react
   */
  async removeReaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { storyId } = req.params;
      const story = await storyService.removeReaction(storyId, req.user.id);

      res.json({
        success: true,
        data: story
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a story
   * DELETE /api/stories/:storyId
   */
  async deleteStory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { storyId } = req.params;
      await storyService.deleteStory(storyId, req.user.id);

      res.json({
        success: true,
        message: 'Story deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clean up expired stories (admin/cron endpoint)
   * POST /api/stories/cleanup
   */
  async cleanupExpiredStories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Add admin authentication check
      const deletedCount = await storyService.cleanupExpiredStories();

      res.json({
        success: true,
        message: `Cleaned up ${deletedCount} expired stories`
      });
    } catch (error) {
      next(error);
    }
  }
}

export const storyController = new StoryController();
