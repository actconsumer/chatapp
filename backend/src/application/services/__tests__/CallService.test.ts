import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { callService } from '../CallService';
import { callRepository } from '../../../infrastructure/repositories/CallRepository';
import { realtimeEmitter } from '../../events/realtimeEmitter';
import { userService } from '../UserService';

describe('CallService', () => {
  const mockCall = {
    id: 'call-123',
    initiatorId: 'user-1',
    chatId: undefined,
    type: 'voice' as const,
    status: 'ringing' as const,
    participants: [],
    targetUserIds: ['user-2'],
    signalGroupName: 'call-group',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { offer: { sdp: 'test', type: 'offer' } },
  };

  beforeEach(() => {
    jest.spyOn(userService, 'getUserProfile').mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      username: 'user1',
      displayName: 'User One',
      avatar: 'http://example.com/avatar.png',
      bio: '',
      isOnline: true,
      lastSeen: new Date(),
    });

    jest.spyOn(callRepository, 'create').mockResolvedValue({
      ...mockCall,
      participants: [
        {
          id: 'user-1',
          userId: 'user-1',
          displayName: 'User One',
          role: 'host',
          joinedAt: new Date().toISOString(),
          muted: false,
        },
      ],
    });

    jest.spyOn(realtimeEmitter, 'emitToUser').mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initiates a call and notifies receiver', async () => {
    const result = await callService.initiateCall('user-1', {
      receiverId: 'user-2',
      type: 'voice',
      offer: { sdp: 'test', type: 'offer' },
    });

    expect(callRepository.create).toHaveBeenCalled();
    expect(realtimeEmitter.emitToUser).toHaveBeenCalledWith(
      'user-2',
      'call:incoming',
      expect.objectContaining({
        callId: result.id,
        from: 'user-1',
        type: 'voice',
      }),
    );
  });
});
