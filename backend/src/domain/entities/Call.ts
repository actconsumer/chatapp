import { v4 as uuid } from 'uuid';

export type CallType = 'voice' | 'video';
export type CallStatus = 'ringing' | 'ongoing' | 'ended' | 'rejected' | 'missed' | 'failed';

export interface ICallParticipant {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: 'host' | 'participant';
  joinedAt?: string;
  leftAt?: string;
  muted?: boolean;
  isSpeaking?: boolean;
  deviceId?: string;
}

export interface ICall {
  id: string;
  initiatorId: string;
  chatId?: string;
  type: CallType;
  status: CallStatus;
  participants: ICallParticipant[];
  targetUserIds: string[];
  signalGroupName: string;
  acsCallConnectionId?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export function createCallEntity(params: {
  initiatorId: string;
  type: CallType;
  targetUserIds: string[];
  chatId?: string;
  metadata?: Record<string, any>;
}): ICall {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    initiatorId: params.initiatorId,
    chatId: params.chatId,
    type: params.type,
    status: 'ringing',
    participants: [],
    targetUserIds: params.targetUserIds,
    signalGroupName: `call-${uuid()}`,
    createdAt: now,
    updatedAt: now,
    metadata: params.metadata ?? {},
  };
}

export function updateCallStatus(call: ICall, status: CallStatus): ICall {
  const updated: ICall = {
    ...call,
    status,
    updatedAt: new Date().toISOString(),
  };

  if (status === 'ongoing' && !updated.startedAt) {
    updated.startedAt = updated.updatedAt;
  }

  if (['ended', 'rejected', 'missed', 'failed'].includes(status)) {
    updated.endedAt = updated.updatedAt;
    if (updated.startedAt) {
      const durationSeconds = Math.max(
        0,
        Math.round(
          (new Date(updated.updatedAt).getTime() - new Date(updated.startedAt).getTime()) /
            1000,
        ),
      );
      updated.durationSeconds = durationSeconds;
    }
  }

  return updated;
}

export function addParticipant(call: ICall, participant: ICallParticipant): ICall {
  const existing = call.participants.find((p) => p.userId === participant.userId);
  const now = new Date().toISOString();
  const updatedParticipant: ICallParticipant = {
    ...participant,
    joinedAt: participant.joinedAt ?? now,
    muted: participant.muted ?? false,
  };

  const participants = existing
    ? call.participants.map((p) => (p.userId === participant.userId ? { ...p, ...updatedParticipant } : p))
    : [...call.participants, updatedParticipant];

  return {
    ...call,
    participants,
    updatedAt: now,
  };
}

export function removeParticipant(call: ICall, userId: string): ICall {
  const now = new Date().toISOString();
  const participants = call.participants.map((participant) =>
    participant.userId === userId
      ? {
          ...participant,
          leftAt: participant.leftAt ?? now,
        }
      : participant,
  );

  return {
    ...call,
    participants,
    updatedAt: now,
  };
}

export function setParticipantMuteState(call: ICall, userId: string, muted: boolean): ICall {
  const now = new Date().toISOString();
  const participants = call.participants.map((participant) =>
    participant.userId === userId
      ? {
          ...participant,
          muted,
          updatedAt: now,
        }
      : participant,
  );

  return {
    ...call,
    participants,
    updatedAt: now,
  };
}

export function setParticipantSpeakingState(call: ICall, userId: string, isSpeaking: boolean): ICall {
  const now = new Date().toISOString();
  const participants = call.participants.map((participant) =>
    participant.userId === userId
      ? {
          ...participant,
          isSpeaking,
          updatedAt: now,
        }
      : participant,
  );

  return {
    ...call,
    participants,
    updatedAt: now,
  };
}
