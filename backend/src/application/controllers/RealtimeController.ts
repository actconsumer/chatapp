import { Request, Response, NextFunction } from 'express';
import { signalRService } from '../../infrastructure/realtime/signalr.service';
import { AppError } from '../middleware/error.middleware';

class RealtimeController {
  async negotiate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const connection = await signalRService.negotiate(userId);
      res.json({
        success: true,
        data: connection,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const realtimeController = new RealtimeController();
