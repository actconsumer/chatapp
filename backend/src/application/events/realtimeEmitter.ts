import { signalRService } from '../../infrastructure/realtime/signalr.service';
import { socketServer } from '../../sockets/socket.server';
import { logger } from '../../utils/logger';

export class RealtimeEmitter {
  async emitToUser(userId: string, event: string, payload: unknown): Promise<void> {
    try {
      socketServer.emitToUser(userId, event, payload);
      await signalRService.sendToUser(userId, event, payload);
    } catch (error) {
      logger.error(`[RealtimeEmitter] Failed to emit to user ${userId} for event ${event}`, error);
    }
  }

  async emitToUsers(userIds: Iterable<string>, event: string, payload: unknown, excludeUserId?: string): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const userId of userIds) {
      if (excludeUserId && userId === excludeUserId) {
        continue;
      }
      socketServer.emitToUser(userId, event, payload);
      promises.push(signalRService.sendToUser(userId, event, payload));
    }
    await Promise.all(promises);
  }
}

export const realtimeEmitter = new RealtimeEmitter();
