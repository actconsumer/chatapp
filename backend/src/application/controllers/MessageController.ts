/**
 * Message Controller
 * Professional REST API controller for message operations
 */

import { Request, Response, NextFunction } from 'express';
import { messageService } from '../services/MessageService';
import { AppError } from '../middleware/error.middleware';

export class MessageController {
  /**
   * Send message
   * POST /api/messages
   */
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId, text, mediaUrl, mediaType, replyTo } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const message = await messageService.sendMessage(
        chatId,
        userId,
        text,
        mediaUrl,
        mediaType,
        replyTo
      );

      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload media
   * POST /api/messages/upload
   */
  async uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const result = await messageService.uploadMedia(
        chatId,
        userId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get messages
   * GET /api/messages/:chatId
   */
  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const beforeTimestamp = req.query.before 
        ? new Date(req.query.before as string) 
        : undefined;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const messages = await messageService.getMessages(chatId, userId, limit, beforeTimestamp);

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single message
   * GET /api/messages/:chatId/:messageId
   */
  async getMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const message = await messageService.getMessage(messageId, userId);

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Edit message
   * PATCH /api/messages/:messageId
   */
  async editMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messageId } = req.params;
      const { text } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const message = await messageService.editMessage(messageId, userId, text);

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete message for everyone
   * DELETE /api/messages/:messageId
   */
  async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      await messageService.deleteMessageForEveryone(messageId, userId);

      res.json({
        success: true,
        message: 'Message deleted'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete message for me
   * DELETE /api/messages/:messageId/forme
   */
  async deleteMessageForMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      await messageService.deleteMessageForMe(messageId, userId);

      res.json({
        success: true,
        message: 'Message deleted for you'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add reaction
   * POST /api/messages/:messageId/reactions
   */
  async addReaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const message = await messageService.addReaction(messageId, userId, emoji);

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove reaction
   * DELETE /api/messages/:messageId/reactions/:emoji
   */
  async removeReaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messageId, emoji } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const message = await messageService.removeReaction(messageId, userId, emoji);

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forward message
   * POST /api/messages/:messageId/forward
   */
  async forwardMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messageId } = req.params;
      const { targetChatIds } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const messages = await messageService.forwardMessage(messageId, userId, targetChatIds);

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark messages as delivered
   * POST /api/messages/:chatId/delivered
   */
  async markAsDelivered(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const { messageIds } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      await messageService.markAsDelivered(chatId, userId, messageIds);

      res.json({
        success: true,
        message: 'Messages marked as delivered'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark messages as read
   * POST /api/messages/:chatId/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const { messageIds } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      await messageService.markAsRead(chatId, userId, messageIds);

      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search messages
   * GET /api/messages/:chatId/search
   */
  async searchMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const { query, limit } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const messages = await messageService.searchMessages(
        chatId,
        userId,
        query as string,
        parseInt(limit as string) || 20
      );

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread count
   * GET /api/messages/:chatId/unread-count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const count = await messageService.getUnreadCount(chatId, userId);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const messageController = new MessageController();
