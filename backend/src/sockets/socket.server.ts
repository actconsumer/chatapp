import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { jwtService } from '../utils/jwt';
import { logger } from '../utils/logger';
import { presenceService } from '../application/services/PresenceService';
import { callService } from '../application/services/CallService';

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
  };
}

class SocketServer {
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map();
  private corsOrigins: string[] = [];

  initialize(server: HTTPServer, origins: string[]): void {
    if (this.io) {
      logger.warn('[SocketServer] Already initialized');
      return;
    }

    this.corsOrigins = origins;

    this.io = new Server(server, {
      cors: {
        origin: origins,
        credentials: true,
      },
    });

    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        if (!token) {
          return next(new Error('Unauthorized'));
        }
        const payload = jwtService.verifyAccessToken(token);
        if (!payload?.userId) {
          return next(new Error('Unauthorized'));
        }
        (socket as AuthenticatedSocket).data.userId = payload.userId;
        next();
      } catch (error) {
        next(new Error('Unauthorized'));
      }
    });

    this.io.on('connection', (socket) => this.handleConnection(socket as AuthenticatedSocket));

    logger.info('[SocketServer] Initialized and ready for connections');
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    if (!this.io) {
      return;
    }

    const sockets = this.userSockets.get(userId);
    if (!sockets?.size) {
      return;
    }

    sockets.forEach((socketId) => {
      this.io!.to(socketId).emit(event, payload);
    });
  }

  emitToUsers(userIds: Iterable<string>, event: string, payload: unknown, excludeUserId?: string): void {
    for (const userId of userIds) {
      if (excludeUserId && userId === excludeUserId) {
        continue;
      }
      this.emitToUser(userId, event, payload);
    }
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.data.userId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);
    socket.join(`user:${userId}`);

    logger.info(`[SocketServer] User ${userId} connected via socket ${socket.id}`);

    presenceService.setOnline(userId).catch((error) => logger.error('Failed to set presence online', error));

    this.registerEventHandlers(socket, userId);

    socket.on('disconnect', (reason) => {
      this.userSockets.get(userId)?.delete(socket.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
        presenceService.setOffline(userId).catch((error) => logger.error('Failed to set presence offline', error));
      }
      logger.info(`[SocketServer] User ${userId} disconnected (${reason})`);
    });
  }

  private registerEventHandlers(socket: AuthenticatedSocket, userId: string): void {
    socket.on('call:signal', async (payload: any) => {
      try {
        if (!payload?.callId || !payload?.type) return;
        await callService.relaySignal(payload.callId, {
          ...payload,
          from: userId,
        });
      } catch (error) {
        logger.error('Failed to relay call signal', error);
      }
    });

    socket.on('call:add-participants', async (payload: any) => {
      try {
        if (!payload?.callId || !Array.isArray(payload?.participantIds)) return;
        await callService.addParticipants(payload.callId, payload.participantIds, userId);
      } catch (error) {
        logger.error('Failed to add participants', error);
      }
    });

    socket.on('call:remove-participant', async (payload: any) => {
      try {
        if (!payload?.callId || !payload?.participantId) return;
        await callService.removeParticipant(payload.callId, payload.participantId, userId);
      } catch (error) {
        logger.error('Failed to remove participant', error);
      }
    });

    socket.on('call:mute', async (payload: any) => {
      try {
        if (!payload?.callId || !payload?.participantId) return;
        await callService.updateMuteState(payload.callId, payload.participantId, !!payload.isMuted);
      } catch (error) {
        logger.error('Failed to update mute state', error);
      }
    });

    socket.on('call:speaking', async (payload: any) => {
      try {
        if (!payload?.callId) return;
        await callService.updateSpeakingState(payload.callId, payload.participantId || userId, !!payload.isSpeaking);
      } catch (error) {
        logger.error('Failed to update speaking state', error);
      }
    });

    socket.on('settings:updated', async (payload: any) => {
      try {
        if (payload?.type === 'call') {
          await callService.updateCallSettings(userId, payload.settings || {});
        }
      } catch (error) {
        logger.error('Failed to update call settings via socket', error);
      }
    });

    socket.on('typing', (payload: any) => {
      if (!payload?.conversationId) return;
      if (payload.isTyping) {
        presenceService.setTyping(userId, payload.conversationId).catch(() => undefined);
      } else {
        presenceService.stopTyping(userId, payload.conversationId).catch(() => undefined);
      }
    });

    socket.on('message:read', (payload: any) => {
      // Future implementation: integrate with read receipts via SignalR
      logger.debug(`[SocketServer] message:read payload from ${userId}`, payload);
    });
  }
}

export const socketServer = new SocketServer();
