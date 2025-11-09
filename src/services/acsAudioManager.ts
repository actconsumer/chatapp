import { Platform } from 'react-native';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { callService, CallSettings } from './call.service';

const TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

let callingModulePromise: Promise<any> | null = null;
let callingModuleRef: any = null;
let callClient: any = null;
let callAgent: any = null;
let deviceManager: any = null;
let tokenExpiresAt: number | null = null;
let credential: AzureCommunicationTokenCredential | null = null;
let lastAppliedSettings: Pick<CallSettings, 'echoCancellation' | 'noiseSuppression' | 'autoGainControl'> | null = null;
let currentVideoStream: any = null;
let lastVideoPreferences:
  | {
      cameraId?: string;
      resolution?: CallSettings['preferredResolution'];
      bitrate?: number;
      enabled?: boolean;
      frameRate?: number;
    }
  | null = null;

const isSupportedPlatform = Platform.OS === 'ios' || Platform.OS === 'android';

async function loadCallingModule() {
  if (!callingModulePromise) {
    callingModulePromise = import('@azure/communication-calling').then((module) => {
      callingModuleRef = module;
      return module;
    });
  }
  await callingModulePromise;
  return callingModuleRef;
}

async function ensureToken(module: any) {
  const now = Date.now();
  const shouldRefresh = !credential || !tokenExpiresAt || now > tokenExpiresAt - TOKEN_REFRESH_BUFFER_MS;

  if (!shouldRefresh) {
    return;
  }

  const tokenResponse = await callService.getACSToken();
  tokenExpiresAt = tokenResponse.expiresOn ? new Date(tokenResponse.expiresOn).getTime() : null;

  if (credential && typeof (credential as any).dispose === 'function') {
    try {
      (credential as any).dispose();
    } catch (_) {
      // Ignore dispose failures
    }
  }

  if (callAgent && typeof callAgent.dispose === 'function') {
    try {
      await callAgent.dispose();
    } catch (_) {
      // Ignore dispose failures
    }
  }

  credential = new AzureCommunicationTokenCredential(tokenResponse.token);
  callAgent = await callClient.createCallAgent(credential, {
    displayName: tokenResponse.userId ?? 'Caller',
  });
}

export async function ensureAcsAudioPipeline() {
  if (!isSupportedPlatform) {
    return null;
  }

  if (typeof (global as any).MediaStream === 'undefined') {
    console.warn('[ACS] MediaStream is unavailable; ensure react-native-webrtc is installed and linked.');
    return null;
  }

  const module = await loadCallingModule();

  if (!callClient) {
    callClient = new module.CallClient();
  }

  if (!deviceManager) {
    deviceManager = await callClient.getDeviceManager();
    try {
      await deviceManager.askDevicePermission({ audio: true, video: true });
    } catch (_) {
      // Permission request failures are surfaced by the native layer already
    }
  }

  if (!callAgent) {
    await ensureToken(module);
  } else {
    await ensureToken(module);
  }

  return { module, callClient, callAgent, deviceManager };
}

async function selectPreferredMicrophone(options: any) {
  if (!deviceManager) {
    return;
  }

  let microphone = null;

  try {
    const microphones: any[] = await deviceManager.getMicrophones?.();
    microphone = deviceManager.selectedMicrophone ?? microphones?.find?.((mic) => mic?.isDefault) ?? microphones?.[0] ?? null;
  } catch (_) {
    microphone = null;
  }

  if (!microphone && deviceManager.selectedMicrophone) {
    microphone = deviceManager.selectedMicrophone;
  }

  if (!microphone) {
    return;
  }

  const selectFn = deviceManager.selectMicrophone;
  if (typeof selectFn === 'function') {
    try {
      if (selectFn.length >= 2) {
        await selectFn.call(deviceManager, microphone, options);
        return;
      }
      await selectFn.call(deviceManager, microphone);
    } catch (error) {
      console.warn('[ACS] Failed to select microphone with options', error);
    }
  }

  const processingFn = (deviceManager as any).setAudioDeviceProcessingOptions;
  if (typeof processingFn === 'function') {
    try {
      await processingFn.call(deviceManager, options);
    } catch (error) {
      console.warn('[ACS] Failed to set audio processing options', error);
    }
  }
}

function getResolutionDimensions(resolution: CallSettings['preferredResolution']) {
  switch (resolution) {
    case '360p':
      return { width: 640, height: 360 };
    case '1080p':
      return { width: 1920, height: 1080 };
    case '720p':
    default:
      return { width: 1280, height: 720 };
  }
}

async function selectPreferredCamera(frontCamera: boolean) {
  if (!deviceManager || typeof deviceManager.getCameras !== 'function') {
    return null;
  }

  try {
    const cameras: any[] = await deviceManager.getCameras();
    if (!cameras?.length) {
      return null;
    }

    const preferredFacing = frontCamera ? ['front', 'user'] : ['back', 'environment'];

    const match = cameras.find((camera) => {
      const facing = (camera?.cameraFacing || camera?.facing || camera?.type || '').toString().toLowerCase();
      return preferredFacing.some((keyword) => facing.includes(keyword));
    });

    return match ?? cameras[0];
  } catch (error) {
    console.warn('[ACS] Failed to enumerate cameras', error);
    return null;
  }
}

async function ensureVideoStream(camera: any) {
  const module = callingModuleRef ?? (await loadCallingModule());

  if (currentVideoStream) {
    const currentSource = currentVideoStream?.source ?? currentVideoStream?.device;
    const currentId = currentSource?.id ?? currentSource?.deviceId;
    const targetId = camera?.id ?? camera?.deviceId;

    if (currentId === targetId) {
      return currentVideoStream;
    }

    try {
      currentVideoStream.dispose?.();
    } catch (error) {
      console.warn('[ACS] Failed to dispose existing video stream', error);
    }
    currentVideoStream = null;
  }

  if (!camera) {
    return null;
  }

  try {
    currentVideoStream = new module.LocalVideoStream(camera);
    return currentVideoStream;
  } catch (error) {
    console.warn('[ACS] Failed to create local video stream', error);
    currentVideoStream = null;
    return null;
  }
}

function getEncodingFeature(stream: any) {
  try {
    const module = callingModuleRef;
    const features = module?.Features;
    if (!stream || !features || typeof stream.feature !== 'function') {
      return null;
    }

    const encodingFeatureKey =
      features?.VideoStreamEncoding ??
      features?.LocalVideoStream?.VideoStreamEncoding ??
      features?.LocalVideoStreamEncoding;

    if (!encodingFeatureKey) {
      return null;
    }

    return stream.feature(encodingFeatureKey);
  } catch (error) {
    console.warn('[ACS] Failed to access video encoding feature', error);
    return null;
  }
}

export async function applyAcsVideoSettings(
  settings: CallSettings,
  options?: { enableVideo?: boolean; frontCamera?: boolean }
) {
  if (!isSupportedPlatform) {
    return;
  }

  const enableVideo = options?.enableVideo ?? true;
  const frontCamera = options?.frontCamera ?? true;
  const frameRate = 30;

  const preferences = {
    cameraId: undefined as string | undefined,
    resolution: settings.preferredResolution,
    bitrate: settings.videoBitrate,
    enabled: enableVideo,
    frameRate,
  };

  const pipeline = await ensureAcsAudioPipeline();
  if (!pipeline) {
    return;
  }

  const camera = await selectPreferredCamera(frontCamera);
  preferences.cameraId = camera?.id ?? camera?.deviceId;

  if (!enableVideo || !camera) {
    if (currentVideoStream) {
      try {
        currentVideoStream.dispose?.();
      } catch (_) {
        // Ignore dispose failures
      }
    }
    currentVideoStream = null;
    lastVideoPreferences = preferences;
    return;
  }

  if (
    lastVideoPreferences &&
    lastVideoPreferences.enabled === preferences.enabled &&
    lastVideoPreferences.cameraId === preferences.cameraId &&
    lastVideoPreferences.resolution === preferences.resolution &&
    lastVideoPreferences.bitrate === preferences.bitrate
  ) {
    return;
  }

  const stream = await ensureVideoStream(camera);
  if (!stream) {
    return;
  }

  const { width, height } = getResolutionDimensions(settings.preferredResolution);

  const encodingFeature = getEncodingFeature(stream);
  if (encodingFeature && typeof encodingFeature.setEncodingParameters === 'function') {
    try {
      await encodingFeature.setEncodingParameters({
        maxBitrateKbps: settings.videoBitrate,
        maxFrameRate: frameRate,
        maxResolution: { width, height },
      });
    } catch (error) {
      console.warn('[ACS] Failed to set video encoding parameters', error);
    }
  }

  let mediaPropertiesController: any = null;
  if (encodingFeature && typeof encodingFeature.getProperties === 'function') {
    try {
      mediaPropertiesController = await encodingFeature.getProperties();
    } catch (error) {
      console.warn('[ACS] Failed to read video stream properties', error);
    }
  }

  if (mediaPropertiesController && typeof mediaPropertiesController.setMediaStreamProperties === 'function') {
    try {
      await mediaPropertiesController.setMediaStreamProperties({ width, height, frameRate });
    } catch (error) {
      console.warn('[ACS] Failed to set media stream properties', error);
    }
  }

  lastVideoPreferences = preferences;
}

export function getCurrentAcsVideoStream() {
  return currentVideoStream;
}

export async function applyAcsVoiceProcessing(settings: CallSettings) {
  if (!isSupportedPlatform) {
    return;
  }

  const reducedSettings = {
    echoCancellation: settings.echoCancellation,
    noiseSuppression: settings.noiseSuppression,
    autoGainControl: settings.autoGainControl,
  } as const;

  if (
    lastAppliedSettings &&
    lastAppliedSettings.echoCancellation === reducedSettings.echoCancellation &&
    lastAppliedSettings.noiseSuppression === reducedSettings.noiseSuppression &&
    lastAppliedSettings.autoGainControl === reducedSettings.autoGainControl
  ) {
    return;
  }

  try {
    const pipeline = await ensureAcsAudioPipeline();
    if (!pipeline) {
      return;
    }

    const processingOptions = {
      echoCancellation: reducedSettings.echoCancellation,
      noiseSuppression: reducedSettings.noiseSuppression,
      autoGainControl: reducedSettings.autoGainControl,
    };

    await selectPreferredMicrophone(processingOptions);
    lastAppliedSettings = reducedSettings;
  } catch (error) {
    console.warn('[ACS] Audio processing setup failed', error);
  }
}

export async function disposeAcsResources() {
  lastAppliedSettings = null;
  tokenExpiresAt = null;
  lastVideoPreferences = null;

  if (currentVideoStream) {
    try {
      currentVideoStream.dispose?.();
    } catch (_) {
      // Ignore dispose failures
    }
  }
  currentVideoStream = null;

  if (callAgent && typeof callAgent.dispose === 'function') {
    try {
      await callAgent.dispose();
    } catch (_) {
      // Ignore dispose failures
    }
  }

  if (credential && typeof (credential as any).dispose === 'function') {
    try {
      (credential as any).dispose();
    } catch (_) {
      // Ignore dispose failures
    }
  }

  callAgent = null;
  credential = null;
  deviceManager = null;
}
