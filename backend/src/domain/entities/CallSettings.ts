export type PreferredResolution = '360p' | '720p' | '1080p';

export interface ICallSettings {
  id: string;
  userId: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  videoBitrate: number;
  preferredResolution: PreferredResolution;
  audioDeviceId?: string;
  videoDeviceId?: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CALL_SETTINGS: Omit<ICallSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  videoBitrate: 1500,
  preferredResolution: '720p',
};

export function createDefaultCallSettings(userId: string): ICallSettings {
  const now = new Date().toISOString();
  return {
    id: `settings-${userId}`,
    userId,
    ...DEFAULT_CALL_SETTINGS,
    createdAt: now,
    updatedAt: now,
  };
}
