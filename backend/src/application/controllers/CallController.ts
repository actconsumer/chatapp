import { Request, Response, NextFunction } from 'express';
import { callService } from '../services/CallService';
import { AppError } from '../middleware/error.middleware';

class CallController {
  async initiateCall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { receiverId, type, offer, chatId } = req.body;
      if (!receiverId || !type) {
        throw new AppError('receiverId and type are required', 400);
      }

      const call = await callService.initiateCall(userId, {
        receiverId,
        type,
        offer,
        chatId,
      });

      res.status(201).json({
        success: true,
        data: call,
      });
    } catch (error) {
      next(error);
    }
  }

  async answerCall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { callId } = req.params;
      const { answer } = req.body;
      const call = await callService.answerCall(callId, userId, { answer });

      res.json({
        success: true,
        data: call,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectCall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { callId } = req.params;
      const { reason } = req.body;
      const call = await callService.rejectCall(callId, userId, reason);

      res.json({
        success: true,
        data: call,
      });
    } catch (error) {
      next(error);
    }
  }

  async endCall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { callId } = req.params;
      let call;
      try {
        call = await callService.endCall(callId, userId);
      } catch (error: any) {
        if (error?.statusCode === 404 && req.query.chatId) {
          call = await callService.endActiveCallByChat(req.query.chatId as string, userId);
        } else {
          throw error;
        }
      }

      res.json({
        success: true,
        data: call,
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      const type = req.query.type as 'voice' | 'video' | undefined;

      const history = await callService.getHistory(userId, { limit, offset, type });

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { callId } = req.params;
      const call = await callService.getCall(callId);

      res.json({
        success: true,
        data: call,
      });
    } catch (error) {
      next(error);
    }
  }

  async addParticipants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { callId } = req.params;
      const participantIds = Array.isArray(req.body.participantIds) ? req.body.participantIds : [];

      if (participantIds.length === 0) {
        throw new AppError('participantIds must be a non-empty array', 400);
      }

      const call = await callService.addParticipants(callId, participantIds, userId);

      res.json({
        success: true,
        data: call,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeParticipant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { callId, participantId } = req.params;
      if (!participantId) {
        throw new AppError('participantId is required', 400);
      }

      const call = await callService.removeParticipant(callId, participantId, userId);

      res.json({
        success: true,
        data: call,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const settings = await callService.getCallSettings(userId);
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const settings = await callService.updateCallSettings(userId, req.body);
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAcsToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const token = await callService.getAcsToken(userId);
      res.json({
        success: true,
        data: token,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendTelemetry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      await callService.sendTelemetry({
        callId: req.body.callId,
        userId,
        duration: req.body.duration,
        quality: req.body.quality,
        issues: req.body.issues || [],
      });

  res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getCallQuality(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { callId } = req.params;
      const quality = await callService.getCallQuality(callId);

      res.json({
        success: true,
        data: quality,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const callController = new CallController();
