/**
 * Chat Controller
 * Professional REST API controller for chat operations
 */

import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/ChatService';
import { AppError } from '../middleware/error.middleware';

export class ChatController {
  /**
   * Create a new chat
   * POST /api/chats
   */
  async createChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { participantIds, type, name, description } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const chat = await chatService.createChat(userId, participantIds, type, name, description);

      res.status(201).json({
        success: true,
        data: chat
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's chats
   * GET /api/chats
   */
  async getUserChats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const continuationToken = req.query.continuationToken as string;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const result = await chatService.getUserChats(userId, limit, continuationToken);

      res.json({
        success: true,
        data: result.chats,
        continuationToken: result.continuationToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get chat by ID
   * GET /api/chats/:chatId
   */
  async getChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const chat = await chatService.getChat(chatId, userId);

      res.json({
        success: true,
        data: chat
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update chat
   * PATCH /api/chats/:chatId
   */
  async updateChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.user?.id;
      const updates = req.body;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const chat = await chatService.updateChat(chatId, userId, updates);

      res.json({
        success: true,
        data: chat
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload group avatar
   * POST /api/chats/:chatId/avatar
   */
  async uploadGroupAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const avatarUrl = await chatService.uploadGroupAvatar(
        chatId,
        userId,
        req.file.buffer,
        req.file.originalname
      );

      res.json({
        success: true,
        data: { avatarUrl }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add participant
   * POST /api/chats/:chatId/participants
   */
  async addParticipant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const { participantId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const chat = await chatService.addParticipant(chatId, userId, participantId);

      res.json({
        success: true,
        data: chat
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove participant
   * DELETE /api/chats/:chatId/participants/:participantId
   */
  async removeParticipant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId, participantId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const chat = await chatService.removeParticipant(chatId, userId, participantId);

      res.json({
        success: true,
        data: chat
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update participant role
   * PATCH /api/chats/:chatId/participants/:participantId/role
   */
  async updateParticipantRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId, participantId } = req.params;
      const { role } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const chat = await chatService.updateParticipantRole(chatId, userId, participantId, role);

      res.json({
        success: true,
        data: chat
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle mute
   * POST /api/chats/:chatId/mute
   */
  async toggleMute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const { duration } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const chat = await chatService.toggleMute(chatId, userId, duration);

      res.json({
        success: true,
        data: chat
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark as read
   * POST /api/chats/:chatId/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const { lastReadMessageId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const chat = await chatService.markAsRead(chatId, userId, lastReadMessageId);

      res.json({
        success: true,
        data: chat
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete chat
   * DELETE /api/chats/:chatId
   */
  async deleteChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      await chatService.deleteChat(chatId, userId);

      res.json({
        success: true,
        message: 'Chat deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search chats
   * GET /api/chats/search
   */
  async searchChats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, limit } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const chats = await chatService.searchChats(
        userId,
        query as string,
        parseInt(limit as string) || 20
      );

      res.json({
        success: true,
        data: chats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get chat statistics
   * GET /api/chats/:chatId/stats
   */
  async getChatStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const stats = await chatService.getChatStats(chatId, userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
