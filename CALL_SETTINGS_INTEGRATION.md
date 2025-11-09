# Call Settings Integration Guide

## Current Implementation Status

### ✅ What's Working
- **UI Layer**: Complete call settings screen with toggles for echo cancellation, noise suppression, auto gain control, and resolution picker
- **API Layer**: Settings are saved to backend via `callService.updateCallSettings()`
- **Real-time Sync**: Settings changes propagate across devices via SignalR `settings:updated` events
- **State Management**: Settings are loaded on call start and updated in real-time during calls
- **Type Safety**: Full TypeScript interfaces for `CallSettings` with proper constraints

### ⚠️ What Needs Integration

The settings are **stored and synced** but need to be **applied to actual audio/video streams**. The code has placeholder comments showing where to integrate with real media APIs.

---

## Integration Options

### Option 1: Azure Communication Services (ACS) - Recommended
Azure Communication Services provides enterprise-grade calling with built-in audio/video processing.

#### Setup
```bash
npm install @azure/communication-calling @azure/communication-common
```

#### Implementation
```typescript
// In VideoCallScreen.tsx or VoiceCallScreen.tsx
import { CallClient, CallAgent, LocalVideoStream } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

const callClient = new CallClient();
let callAgent: CallAgent;
let currentCall: Call;

// Initialize with ACS token from backend
const initializeACS = async () => {
  const { token } = await callService.getACSToken();
  const tokenCredential = new AzureCommunicationTokenCredential(token);
  callAgent = await callClient.createCallAgent(tokenCredential);
};

// Apply settings to ACS call
const applyCallSettings = async (settings: CallSettings) => {
  if (!currentCall) return;

  // Get local audio stream
  const localAudioStream = currentCall.localAudioStreams[0];
  
  // Apply audio constraints (ACS supports these natively)
  const audioOptions = {
    echoCancellation: settings.echoCancellation,
    noiseSuppression: settings.noiseSuppression,
    autoGainControl: settings.autoGainControl,
  };

  // Update audio device with constraints
  await callAgent.setDeviceManager();
  const deviceManager = await callAgent.getDeviceManager();
  await deviceManager.selectMicrophone(deviceManager.getMicrophones()[0], audioOptions);

  // Apply video constraints
  if (settings.preferredResolution && currentCall.localVideoStreams.length > 0) {
    const localVideoStream = currentCall.localVideoStreams[0];
    const constraints = {
      width: getResolutionWidth(settings.preferredResolution),
      height: getResolutionHeight(settings.preferredResolution),
      frameRate: 30,
    };
    
    // Stop current stream and start new one with constraints
    await currentCall.stopVideo(localVideoStream);
    const newVideoStream = new LocalVideoStream(
      deviceManager.getCameras()[isFrontCamera ? 0 : 1],
      { constraints }
    );
    await currentCall.startVideo(newVideoStream);
  }

  console.log('Applied ACS call settings:', audioOptions);
};
```

**Benefits:**
- ✅ Native echo cancellation, noise suppression, auto gain control
- ✅ Adaptive bitrate and quality management
- ✅ TURN/STUN servers for NAT traversal
- ✅ Scalable group calls
- ✅ Call recording and PSTN integration

---

### Option 2: WebRTC with React Native WebRTC
For custom WebRTC implementation with full control.

#### Setup
```bash
npm install react-native-webrtc
```

#### Implementation
```typescript
// In VideoCallScreen.tsx
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';

let peerConnection: RTCPeerConnection;
let localStream: MediaStream;

const applyCallSettings = async (settings: CallSettings) => {
  // Get media stream with constraints
  const constraints = {
    audio: {
      echoCancellation: settings.echoCancellation,
      noiseSuppression: settings.noiseSuppression,
      autoGainControl: settings.autoGainControl,
    },
    video: {
      width: { ideal: getResolutionWidth(settings.preferredResolution) },
      height: { ideal: getResolutionHeight(settings.preferredResolution) },
      frameRate: { ideal: 30 },
      facingMode: isFrontCamera ? 'user' : 'environment',
    },
  };

  try {
    // Stop existing stream if any
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Get new stream with updated constraints
    localStream = await mediaDevices.getUserMedia(constraints);

    // Replace tracks in peer connection
    if (peerConnection) {
      const videoTrack = localStream.getVideoTracks()[0];
      const audioTrack = localStream.getAudioTracks()[0];
      
      const videoSender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
      const audioSender = peerConnection.getSenders().find(s => s.track?.kind === 'audio');
      
      if (videoSender && videoTrack) await videoSender.replaceTrack(videoTrack);
      if (audioSender && audioTrack) await audioSender.replaceTrack(audioTrack);
    }

    console.log('Applied WebRTC settings:', constraints);
  } catch (error) {
    console.error('Failed to apply WebRTC settings:', error);
  }
};

// Set encoding parameters for bitrate control
const setEncodingParameters = async () => {
  if (!peerConnection || !callSettings) return;
  
  const videoSender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
  if (videoSender) {
    const parameters = videoSender.getParameters();
    if (!parameters.encodings) {
      parameters.encodings = [{}];
    }
    
    // Set max bitrate in kbps
    parameters.encodings[0].maxBitrate = callSettings.videoBitrate * 1000;
    
    await videoSender.setParameters(parameters);
    console.log('Set video bitrate:', callSettings.videoBitrate);
  }
};
```

**Benefits:**
- ✅ Full control over media streams
- ✅ Custom audio/video processing
- ✅ No vendor lock-in
- ⚠️ More complex to implement
- ⚠️ Need to manage TURN/STUN servers

---

### Option 3: Expo AV (Limited Audio Only)
Basic audio recording with some constraints support.

#### Implementation
```typescript
import { Audio } from 'expo-av';

const applyAudioSettings = async (settings: CallSettings) => {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: !isSpeaker,
  });

  // Note: Expo AV has limited support for echo cancellation, noise suppression
  // For production calls, use ACS or WebRTC instead
  console.log('Applied basic audio settings');
};
```

**Benefits:**
- ✅ Simple to implement
- ✅ No additional dependencies
- ⚠️ Limited audio processing features
- ❌ No video support for calls
- ❌ No echo cancellation/noise suppression control

---

## Backend Integration Requirements

Your backend (`backend/src/routes/calls.ts`) needs these endpoints:

### 1. Get Call Settings
```typescript
// GET /api/calls/settings
router.get('/settings', async (req, res) => {
  const settings = await CallSettings.findOne({ userId: req.user.id });
  res.json(settings || {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    videoBitrate: 1500,
    preferredResolution: '720p',
  });
});
```

### 2. Update Call Settings
```typescript
// PUT /api/calls/settings
router.put('/settings', async (req, res) => {
  const { echoCancellation, noiseSuppression, autoGainControl, videoBitrate, preferredResolution } = req.body;
  
  const settings = await CallSettings.findOneAndUpdate(
    { userId: req.user.id },
    { echoCancellation, noiseSuppression, autoGainControl, videoBitrate, preferredResolution },
    { upsert: true, new: true }
  );

  // Broadcast to user's other devices
  io.to(`user:${req.user.id}`).emit('settings:updated', {
    type: 'call',
    settings: { echoCancellation, noiseSuppression, autoGainControl, videoBitrate, preferredResolution },
  });

  res.json(settings);
});
```

### 3. Get ACS Token (for Azure Communication Services)
```typescript
// GET /api/calls/acs-token
router.get('/acs-token', async (req, res) => {
  const { CommunicationIdentityClient } = require('@azure/communication-identity');
  
  const connectionString = process.env.ACS_CONNECTION_STRING;
  const identityClient = new CommunicationIdentityClient(connectionString);
  
  // Create or get existing user identity
  const user = await identityClient.createUser();
  
  // Get token with VoIP scope
  const tokenResponse = await identityClient.getToken(user, ['voip']);
  
  res.json({
    token: tokenResponse.token,
    userId: user.communicationUserId,
    expiresOn: tokenResponse.expiresOn,
  });
});
```

---

## Testing the Integration

### 1. Test Settings Persistence
```typescript
// In CallSettingsScreen.tsx, settings are automatically saved
// Verify by checking backend logs or database
```

### 2. Test Real-time Sync
```typescript
// Open app on two devices
// Change settings on device 1
// Settings should update on device 2 during active call
```

### 3. Test During Active Call
```typescript
// Start a call
// Navigate to settings (gear icon)
// Toggle echo cancellation
// Should hear difference immediately
```

---

## Environment Variables Needed

Add to `backend/.env`:
```bash
# For Azure Communication Services
ACS_CONNECTION_STRING=endpoint=https://...;accesskey=...

# For WebRTC TURN/STUN servers (if using WebRTC)
TURN_SERVER_URL=turn:turnserver.example.com:3478
TURN_USERNAME=your_username
TURN_CREDENTIAL=your_password
```

---

## Mobile Platform Considerations

### iOS
- Requires `NSMicrophoneUsageDescription` in Info.plist
- Requires `NSCameraUsageDescription` for video calls
- Echo cancellation works best with built-in mic
- Test with AirPods and wired headphones

### Android
- Requires `CAMERA`, `RECORD_AUDIO` permissions in AndroidManifest.xml
- Test on different API levels (echo cancellation support varies)
- Some devices have hardware echo cancellation

---

## Recommended Next Steps

1. **Choose Integration Path**: We recommend **Azure Communication Services** for production-grade calls
2. **Add ACS SDK**: `npm install @azure/communication-calling @azure/communication-common`
3. **Update VideoCallScreen.tsx**: Replace placeholder comments with actual ACS implementation
4. **Update VoiceCallScreen.tsx**: Apply audio constraints via ACS
5. **Backend Setup**: Implement ACS token endpoint
6. **Testing**: Test on real devices with various network conditions

---

## Current Code Status

✅ **UI**: Complete with smooth animations and theme support
✅ **API Integration**: Settings save/load from backend
✅ **Real-time Sync**: SignalR events propagate settings changes
✅ **Type Safety**: Full TypeScript interfaces
⏳ **Media Integration**: Ready for ACS/WebRTC integration (placeholder code in place)

The architecture is **production-ready** - you just need to choose your media stack (ACS recommended) and implement the actual stream manipulation using the patterns shown above.
