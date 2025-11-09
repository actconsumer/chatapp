// Minimal WebRTC polyfills to satisfy Azure Communication Services expectations on React Native.
// Requires react-native-webrtc to be installed and native modules linked.

let registerAttempted = false;

function registerGlobalsSafely() {
  if (registerAttempted) {
    return;
  }
  registerAttempted = true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const webrtc = require('react-native-webrtc');
    const globals: Record<string, unknown> = {
      RTCPeerConnection: webrtc.RTCPeerConnection,
      RTCIceCandidate: webrtc.RTCIceCandidate,
      RTCSessionDescription: webrtc.RTCSessionDescription,
      mediaDevices: webrtc.mediaDevices,
      MediaStream: webrtc.MediaStream,
      MediaStreamTrack: webrtc.MediaStreamTrack,
      RTCView: webrtc.RTCView,
      RTCDataChannel: webrtc.RTCDataChannel,
      RTCTrackEvent: webrtc.RTCTrackEvent,
    };

    const globalObject: any = global;

    Object.entries(globals).forEach(([key, value]) => {
      if (typeof value !== 'undefined' && typeof globalObject[key] === 'undefined') {
        globalObject[key] = value;
      }
    });
  } catch (error) {
    console.warn('[WebRTC Polyfill] react-native-webrtc is not available; ACS media features may not work.', error);
  }
}

registerGlobalsSafely();

export {};