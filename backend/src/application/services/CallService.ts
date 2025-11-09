import { v4 as uuid } from 'uuid';
import { callRepository } from '../../infrastructure/repositories/CallRepository';
import { callSettingsRepository } from '../../infrastructure/repositories/CallSettingsRepository';
import { callTelemetryRepository } from '../../infrastructure/repositories/CallTelemetryRepository';
import { azureCommunicationService } from '../../infrastructure/communication/acsClient';
import {
  ICall,
  ICallParticipant,
  CallType,
  createCallEntity,
  addParticipant,
  updateCallStatus,
  removeParticipant,
  setParticipantMuteState,
  setParticipantSpeakingState,
} from '../../domain/entities/Call';
import { ICallSettings } from '../../domain/entities/CallSettings';
import { ICallTelemetry, ICallQualityMetrics } from '../../domain/entities/CallTelemetry';
import { AppError } from '../middleware/error.middleware';
import { userService } from './UserService';
import { realtimeEmitter } from '../events/realtimeEmitter';
import { logger } from '../../utils/logger';

interface InitiateCallOptions {
  receiverId: string;
  type: CallType;
  offer: unknown;
  chatId?: string;
}

interface AnswerCallPayload {
  answer: unknown;
}

interface CallHistoryParams {
  limit?: number;
  offset?: number;
  type?: CallType;
}

interface CallTelemetryPayload {
  callId: string;
  userId: string;
  duration: number;
  quality: ICallQualityMetrics;
  issues: string[];
}

class CallService {
  async initiateCall(initiatorId: string, options: InitiateCallOptions): Promise<ICall> {
    const initiatorProfile = await userService.getUserProfile(initiatorId);
    const receiverProfile = await userService.getUserProfile(options.receiverId);

    let call = createCallEntity({
      initiatorId,
      type: options.type,
      targetUserIds: [options.receiverId],
      chatId: options.chatId,
      metadata: { offer: options.offer },
    });

    const hostParticipant: ICallParticipant = {
      id: initiatorProfile.id,
      userId: initiatorId,
      displayName: initiatorProfile.displayName || initiatorProfile.username,
      avatarUrl: initiatorProfile.avatar,
      role: 'host',
      joinedAt: new Date().toISOString(),
      muted: false,
    };

    call = addParticipant(call, hostParticipant);
    call = await callRepository.create(call);

  await realtimeEmitter.emitToUser(options.receiverId, 'call:incoming', {
      callId: call.id,
      from: initiatorId,
      to: options.receiverId,
      type: options.type,
      offer: options.offer,
      initiator: {
        id: initiatorProfile.id,
        name: initiatorProfile.displayName || initiatorProfile.username,
        avatar: initiatorProfile.avatar,
      },
      receiver: {
        id: receiverProfile.id,
        name: receiverProfile.displayName || receiverProfile.username,
        avatar: receiverProfile.avatar,
      },
    });

    logger.info(`[CallService] Initiated ${options.type} call ${call.id} from ${initiatorId} to ${options.receiverId}`);

    return call;
  }

  async answerCall(callId: string, userId: string, payload: AnswerCallPayload): Promise<ICall> {
    const call = await this.ensureCall(callId);

    const participantProfile = await userService.getUserProfile(userId);
    const participant: ICallParticipant = {
      id: participantProfile.id,
      userId,
      displayName: participantProfile.displayName || participantProfile.username,
      avatarUrl: participantProfile.avatar,
      role: call.initiatorId === userId ? 'host' : 'participant',
      joinedAt: new Date().toISOString(),
    };

    let updated = addParticipant(call, participant);
    updated = updateCallStatus(updated, 'ongoing');

    updated = await callRepository.upsert(updated);

  await realtimeEmitter.emitToUser(call.initiatorId, 'call:signal', {
      callId: updated.id,
      type: 'answer',
      from: userId,
      to: call.initiatorId,
      signal: payload.answer,
    });

    await this.broadcastToParticipants(updated, 'call:participant-joined', {
      callId: updated.id,
      userId,
      userName: participant.displayName,
      userAvatar: participant.avatarUrl,
    }, userId);

    return updated;
  }

  async rejectCall(callId: string, userId: string, reason?: string): Promise<ICall> {
    const call = await this.ensureCall(callId);
    const updated = await callRepository.upsert(updateCallStatus(call, 'rejected'));

    await this.broadcastToParticipants(updated, 'call:ended', {
      callId: updated.id,
      reason: reason || 'rejected',
      by: userId,
    });

    return updated;
  }

  async endCall(callId: string, userId: string): Promise<ICall> {
    const call = await this.ensureCall(callId);
    const updated = await callRepository.upsert(updateCallStatus(call, 'ended'));

    await this.broadcastToParticipants(updated, 'call:ended', {
      callId: updated.id,
      by: userId,
    });

    return updated;
  }

  async endActiveCallByChat(chatId: string, userId: string): Promise<ICall | null> {
    const history = await callRepository.getUserHistory(userId, 10, 0);
    const active = history.find((call) => call.chatId === chatId && ['ongoing', 'ringing'].includes(call.status));
    if (!active) {
      return null;
    }
    return this.endCall(active.id, userId);
  }

  async getCall(callId: string): Promise<ICall> {
    return this.ensureCall(callId);
  }

  async getHistory(userId: string, params: CallHistoryParams): Promise<ICall[]> {
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    const history = await callRepository.getUserHistory(userId, limit, offset);
    if (params.type) {
      return history.filter((call) => call.type === params.type);
    }
    return history;
  }

  async getCallSettings(userId: string): Promise<ICallSettings> {
    return callSettingsRepository.ensureDefault(userId);
  }

  async updateCallSettings(userId: string, updates: Partial<ICallSettings>): Promise<ICallSettings> {
    const existing = await callSettingsRepository.ensureDefault(userId);
    const updated: ICallSettings = {
      ...existing,
      ...updates,
      userId,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    const result = await callSettingsRepository.upsert(updated);

    await this.broadcastToParticipantsForUser(userId, 'settings:updated', {
      type: 'call',
      settings: updates,
    });

    return result;
  }

  async getAcsToken(userId: string) {
    return azureCommunicationService.issueToken(userId);
  }

  async sendTelemetry(payload: CallTelemetryPayload): Promise<void> {
    const telemetry: ICallTelemetry = {
      id: uuid(),
      callId: payload.callId,
      userId: payload.userId,
      durationSeconds: payload.duration,
      quality: payload.quality,
      issues: payload.issues,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await callTelemetryRepository.log(telemetry);
  }

  async getCallQuality(callId: string): Promise<ICallQualityMetrics> {
    const telemetry = await callTelemetryRepository.getRecent(callId, 10);
    if (!telemetry.length) {
      return {
        networkQuality: 'good',
        bandwidth: 0,
        latency: 0,
        packetLoss: 0,
        jitter: 0,
      };
    }

    const aggregate = telemetry.reduce(
      (acc, entry) => {
        acc.bandwidth += entry.quality.bandwidth;
        acc.latency += entry.quality.latency;
        acc.packetLoss += entry.quality.packetLoss;
        acc.jitter += entry.quality.jitter;
        acc.count += 1;
        acc.statuses.push(entry.quality.networkQuality);
        return acc;
      },
      { bandwidth: 0, latency: 0, packetLoss: 0, jitter: 0, count: 0, statuses: [] as Array<ICallQualityMetrics['networkQuality']> },
    );

    const avg = {
      bandwidth: Math.round(aggregate.bandwidth / aggregate.count),
      latency: Math.round(aggregate.latency / aggregate.count),
      packetLoss: Math.round(aggregate.packetLoss / aggregate.count),
      jitter: Math.round(aggregate.jitter / aggregate.count),
    };

    const statusPriority: Record<ICallQualityMetrics['networkQuality'], number> = {
      excellent: 4,
      good: 3,
      fair: 2,
      poor: 1,
    };

    const status = aggregate.statuses.sort((a, b) => statusPriority[a] - statusPriority[b])[0] ?? 'good';

    return {
      networkQuality: status,
      ...avg,
    };
  }

  async addParticipants(callId: string, participantIds: string[], requestedBy: string): Promise<ICall> {
    let call = await this.ensureCall(callId);
    for (const participantId of participantIds) {
      const profile = await userService.getUserProfile(participantId);
      const participant: ICallParticipant = {
        id: profile.id,
        userId: participantId,
        displayName: profile.displayName || profile.username,
        avatarUrl: profile.avatar,
        role: 'participant',
        joinedAt: new Date().toISOString(),
      };
      call = addParticipant(call, participant);
    }

    call = await callRepository.upsert(call);

    for (const participantId of participantIds) {
    await realtimeEmitter.emitToUser(participantId, 'call:incoming', {
        callId: call.id,
        from: requestedBy,
        type: call.type,
        metadata: { reason: 'added-to-call' },
      });
    }

    await this.broadcastToParticipants(call, 'call:participant-joined', {
      callId: call.id,
      participants: participantIds,
    }, requestedBy);

    return call;
  }

  async removeParticipant(callId: string, participantId: string, requestedBy: string): Promise<ICall> {
    const call = await this.ensureCall(callId);
    const updated = await callRepository.upsert(removeParticipant(call, participantId));

    await this.broadcastToParticipants(updated, 'call:participant-left', {
      callId: updated.id,
      userId: participantId,
      removedBy: requestedBy,
    });

  await realtimeEmitter.emitToUser(participantId, 'call:ended', {
      callId: updated.id,
      reason: 'removed',
      by: requestedBy,
    });

    return updated;
  }

  async updateMuteState(callId: string, participantId: string, muted: boolean): Promise<ICall> {
    const call = await this.ensureCall(callId);
    const updated = await callRepository.upsert(setParticipantMuteState(call, participantId, muted));

    await this.broadcastToParticipants(updated, 'call:participant-muted', {
      callId: updated.id,
      userId: participantId,
      isMuted: muted,
    });

    return updated;
  }

  async updateSpeakingState(callId: string, participantId: string, isSpeaking: boolean): Promise<ICall> {
    const call = await this.ensureCall(callId);
    const updated = await callRepository.upsert(setParticipantSpeakingState(call, participantId, isSpeaking));

    await this.broadcastToParticipants(updated, 'call:participant-speaking', {
      callId: updated.id,
      userId: participantId,
      isSpeaking,
    }, participantId);

    return updated;
  }

  async relaySignal(callId: string, payload: { from: string; to?: string; type: string; signal: unknown }): Promise<void> {
    const call = await this.ensureCall(callId);
    if (payload.to) {
      await realtimeEmitter.emitToUser(payload.to, 'call:signal', {
        ...payload,
        callId,
      });
      return;
    }

    await this.broadcastToParticipants(call, 'call:signal', {
      ...payload,
      callId,
    }, payload.from);
  }

  private async ensureCall(callId: string): Promise<ICall> {
    const call = await callRepository.findById(callId);
    if (!call) {
      const fallback = await callRepository.findLatestByChat(callId);
      if (fallback) {
        return fallback;
      }
      throw new AppError('Call not found', 404);
    }
    return call;
  }

  private async broadcastToParticipants(call: ICall, event: string, payload: unknown, excludeUserId?: string): Promise<void> {
    const recipients = new Set<string>([
      call.initiatorId,
      ...call.targetUserIds,
      ...call.participants.map((p) => p.userId),
    ]);

    if (excludeUserId) {
      recipients.delete(excludeUserId);
    }

    await realtimeEmitter.emitToUsers(recipients, event, payload, excludeUserId);
  }

  private async broadcastToParticipantsForUser(userId: string, event: string, payload: unknown): Promise<void> {
    await realtimeEmitter.emitToUser(userId, event, payload);
  }
}

export const callService = new CallService();
