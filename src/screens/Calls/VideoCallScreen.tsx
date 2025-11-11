import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer } from 'expo-audio';
import { callService, CallSettings } from '../../services/call.service';
// Removed Azure ACS audio/video manager import
import { socketService } from '../../services/socket.service';
import CallQualityIndicator from '../../components/CallQualityIndicator';

const { width, height } = Dimensions.get('window');
const DEFAULT_CALL_SETTINGS: CallSettings = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  videoBitrate: 1500,
  preferredResolution: '720p',
};

interface VideoCallScreenProps {
  route: any;
  navigation: any;
}

export default function VideoCallScreen({ route, navigation }: VideoCallScreenProps) {
  const { theme } = useTheme();
  const { chatId, chatName, chatAvatar } = route.params;
  
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [showControls, setShowControls] = useState(true);
  const [hasVideoPermission, setHasVideoPermission] = useState(false);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callSettings, setCallSettings] = useState<CallSettings | null>(null);
  const [showQualityIndicator, setShowQualityIndicator] = useState(true);
  
  const ringtonePlayer = useAudioPlayer(require('../../../assets/sounds/call.mp3'));
  const unavailablePlayer = useAudioPlayer(require('../../../assets/sounds/unavailable.mp3'));
  const callStartTime = useRef<number>(Date.now());

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    // Check and request permissions
    checkPermissions();
    
    // Load call settings
    loadCallSettings();
    
    // Set volumes
    ringtonePlayer.volume = 0.5;
    unavailablePlayer.volume = 0.7;
  }, []);

  const loadCallSettings = async () => {
    try {
      // TODO: Connect to Firebase backend
      // Temporary mock settings for frontend state
      const mockSettings: CallSettings = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        videoBitrate: 1500,
        preferredResolution: '720p'
      };
      setCallSettings(mockSettings);
      
      // Apply settings to the call stream
      await applyCallSettings(mockSettings, {
        enableVideo: isVideoOn,
        frontCamera: isFrontCamera,
      });
    } catch (error) {
      console.error('Failed to load call settings:', error);
    }
  };

  const applyCallSettings = async (
    settings: CallSettings,
    overrides?: { enableVideo?: boolean; frontCamera?: boolean }
  ) => {
    if (!settings) return;

    // Apply audio constraints
    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: settings.echoCancellation,
      noiseSuppression: settings.noiseSuppression,
      autoGainControl: settings.autoGainControl,
    };

    try {
      // TODO: Apply audio processing with WebRTC directly after Firebase setup
      console.log('Audio processing will be implemented with WebRTC');
    } catch (error) {
      console.warn('Failed to apply voice processing for video call', error);
    }

    try {
      // TODO: Apply video settings with WebRTC directly after Firebase setup
      console.log('Video settings will be implemented with WebRTC');
    } catch (error) {
      console.warn('Failed to apply video settings', error);
    }

    // Apply video constraints based on resolution
    const videoConstraints: MediaTrackConstraints = {
      width: getResolutionWidth(settings.preferredResolution),
      height: getResolutionHeight(settings.preferredResolution),
      frameRate: { ideal: 30, max: 30 },
    };

    // In a real implementation with WebRTC:
    // navigator.mediaDevices.getUserMedia({
    //   audio: audioConstraints,
    //   video: videoConstraints
    // }).then(stream => {
    //   // Apply the stream to your call
    // });

    console.log('Applied call settings:', {
      audio: audioConstraints,
      video: videoConstraints,
      videoBitrate: settings.videoBitrate,
    });
  };

  const getResolutionWidth = (resolution: string): number => {
    switch (resolution) {
      case '360p': return 640;
      case '720p': return 1280;
      case '1080p': return 1920;
      default: return 1280;
    }
  };

  const getResolutionHeight = (resolution: string): number => {
    switch (resolution) {
      case '360p': return 360;
      case '720p': return 720;
      case '1080p': return 1080;
      default: return 720;
    }
  };

  const checkPermissions = async () => {
    // In a real app, you would use expo-camera or expo-av for permissions
    // For now, we'll simulate permission check
    const videoGranted = true; // Replace with actual permission check
    const audioGranted = true; // Replace with actual permission check
    
    setHasVideoPermission(videoGranted);
    setHasAudioPermission(audioGranted);
    
    if (!videoGranted || !audioGranted) {
      Alert.alert(
        'Permissions Required',
        'Camera and microphone permissions are required for video calls.',
        [
          {
            text: 'Grant Permissions',
            onPress: () => {
              // Request permissions here
              setHasVideoPermission(true);
              setHasAudioPermission(true);
            },
          },
          {
            text: 'Cancel',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    }
  };

  useEffect(() => {
    // Set status bar to light content for better visibility
    StatusBar.setBarStyle('light-content');
    let canceled = false;
    const init = async () => {
      try {
        if (!socketService.isConnected()) await socketService.connect();
        const offer = { sdp: 'placeholder', type: 'offer' };
        // TODO: Connect to Firebase backend
        const mockCallData = { id: 'mock-call-id' };
        console.log('Initiate call:', { receiverId: chatId, type: 'video', offer });
        if (canceled) return;
        
        setActiveCallId(mockCallData.id);
        setCallStatus('ringing');
        callStartTime.current = Date.now();
        
        socketService.on('call:signal', (data: any) => {
          if (data.type === 'answer' && data.from === chatId) {
            setCallStatus('connected');
          }
        });
        socketService.on('call:ended', () => {
          setCallStatus('ended');
          handleEndCall();
        });
        
        // Listen for real-time settings updates
        socketService.on('settings:updated', (data: any) => {
          if (data.type === 'call' && data.settings) {
            const base = callSettings ?? DEFAULT_CALL_SETTINGS;
            const newSettings = { ...base, ...data.settings } as CallSettings;
            setCallSettings(newSettings);
            applyCallSettings(newSettings, {
              enableVideo: isVideoOn,
              frontCamera: isFrontCamera,
            }).catch((error) =>
              console.warn('[ACS] Failed to apply updated settings', error)
            );
          }
        });
      } catch (error) {
        console.error('Failed to initiate call:', error);
        setCallStatus('ended');
      }
    };
    init();

    return () => {
      canceled = true;
      StatusBar.setBarStyle('default');
      socketService.off('settings:updated');

      // TODO: Cleanup WebRTC resources after Firebase setup
      console.log('Cleanup will be implemented with WebRTC');
      
      // Send telemetry on cleanup
      if (activeCallId && callStatus === 'connected') {
        const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
        // TODO: Connect to Firebase backend
        console.log('Send telemetry:', {
          callId: activeCallId,
          duration,
          quality: {
            networkQuality: 'good',
            bandwidth: 0,
            latency: 0,
            packetLoss: 0,
            jitter: 0,
          },
          issues: [],
          timestamp: new Date().toISOString(),
        });
      }
    };
  }, [chatId]);

  useEffect(() => {
    if (!callSettings) {
      return;
    }

    applyCallSettings(callSettings, {
      enableVideo: isVideoOn,
      frontCamera: isFrontCamera,
    }).catch((error) => console.warn('[ACS] Failed to reapply call settings', error));
  }, [callSettings, isVideoOn, isFrontCamera]);

  // Play/stop ringtone based on call status
  useEffect(() => {
    if (callStatus === 'ringing') {
      ringtonePlayer.loop = true;
      ringtonePlayer.play();
    } else if (callStatus === 'connected') {
      ringtonePlayer.pause();
    }
  }, [callStatus]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [callStatus]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    let hideTimer: NodeJS.Timeout;
    
    if (showControls && callStatus === 'connected') {
      hideTimer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => clearTimeout(hideTimer);
  }, [showControls, callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'ringing':
        return 'Ringing...';
      case 'connected':
        return formatDuration(callDuration);
      default:
        return '';
    }
  };

  const handleEndCall = async () => {
    // Stop ringtone if still playing
    ringtonePlayer.pause();
    
    // Play unavailable sound if call wasn't connected (failed/rejected)
    if (callStatus !== 'connected') {
      try {
        unavailablePlayer.play();
        // Wait a bit for sound to play before going back
        setTimeout(() => {
          // TODO: Cleanup WebRTC resources after Firebase setup
          navigation.goBack();
        }, 1500);
      } catch (error) {
        console.error('Failed to play unavailable sound', error);
        // TODO: Cleanup WebRTC resources after Firebase setup
        navigation.goBack();
      }
    } else {
      try { 
        // TODO: Connect to Firebase backend
        console.log('End call:', chatId); 
      } catch {}
      try { 
        // TODO: Cleanup WebRTC resources after Firebase setup
        console.log('Cleanup will be implemented with WebRTC');
      } catch {}
      navigation.goBack();
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Remote Video View */}
      <TouchableOpacity
        style={styles.remoteVideoContainer}
        activeOpacity={1}
        onPress={toggleControls}
      >
        {callStatus === 'connected' ? (
          <Image
            source={{ uri: chatAvatar || 'https://via.placeholder.com/400' }}
            style={styles.remoteVideo}
            blurRadius={20}
          />
        ) : (
          <View style={styles.waitingView}>
            {chatAvatar ? (
              <Image
                source={{ uri: chatAvatar }}
                style={styles.waitingAvatar}
              />
            ) : (
              <View style={[styles.waitingAvatar, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarInitials}>
                  {chatName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <Text style={styles.waitingName}>{chatName}</Text>
            <Text style={styles.waitingStatus}>{getStatusText()}</Text>
          </View>
        )}

        {/* Overlay gradient for better text visibility */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
          pointerEvents="none"
        />
      </TouchableOpacity>

      {/* Local Video Preview (Picture-in-Picture) */}
      {isVideoOn && hasVideoPermission && (
        <View style={styles.localVideoContainer}>
          <View style={styles.localVideo}>
            {/* In production, this would be actual camera feed */}
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.localVideoPlaceholder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="videocam" size={32} color="#fff" />
              <Text style={styles.localVideoText}>Your Camera</Text>
            </LinearGradient>
          </View>
          <TouchableOpacity
            style={styles.flipCameraButton}
            onPress={() => setIsFrontCamera(!isFrontCamera)}
          >
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Permission Warning */}
      {!hasVideoPermission && (
        <View style={styles.permissionWarning}>
          <View style={[styles.permissionCard, { backgroundColor: theme.error + '20' }]}>
            <Ionicons name="videocam-off" size={32} color={theme.error} />
            <Text style={[styles.permissionTitle, { color: theme.error }]}>
              Camera Permission Required
            </Text>
            <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
              Enable camera access in settings to use video
            </Text>
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: theme.primary }]}
              onPress={checkPermissions}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header */}
      {showControls && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.callerName}>{chatName}</Text>
            {callStatus === 'connected' && (
              <View style={styles.durationBadge}>
                <View style={styles.recordingDot} />
                <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
              </View>
            )}
          </View>
          
          {/* Call Quality Indicator */}
          {callStatus === 'connected' && activeCallId && showQualityIndicator && (
            <View
              style={styles.qualityContainer}
            >
              <CallQualityIndicator callId={activeCallId} visible={showQualityIndicator} />
            </View>
          )}
        </View>
      )}

      {/* Call Controls */}
      {showControls && (
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                !isVideoOn && styles.controlButtonActive,
              ]}
              onPress={() => setIsVideoOn(!isVideoOn)}
            >
              <Ionicons
                name={isVideoOn ? 'videocam' : 'videocam-off'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.endCallButton}
              onPress={handleEndCall}
            >
              <Ionicons name="call" size={32} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                isMuted && styles.controlButtonActive,
              ]}
              onPress={() => setIsMuted(!isMuted)}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.secondaryControls}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('CallParticipants', { callType: 'video' })}
            >
              <Ionicons name="people" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('AddParticipants', { callType: 'video' })}
            >
              <Ionicons name="person-add" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('CallSettings')}
            >
              <Ionicons name="settings" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Encryption Badge */}
      {callStatus === 'connected' && showControls && (
        <View style={styles.encryptionContainer}>
          <TouchableOpacity 
            style={styles.encryptionBadge}
            onPress={() => navigation.navigate('CallSettings')}
          >
            <Ionicons name="lock-closed" size={14} color="#4CAF50" />
            <Text style={styles.encryptionText}>End-to-end encrypted</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  waitingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  waitingAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  waitingName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  waitingStatus: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  localVideo: {
    flex: 1,
  },
  localVideoImage: {
    width: '100%',
    height: '100%',
  },
  localVideoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  localVideoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  flipCameraButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionWarning: {
    position: 'absolute',
    top: 220,
    left: 20,
    right: 20,
  },
  permissionCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  qualityContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  callerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F02849',
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 60,
    marginBottom: 24,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(240, 40, 73, 0.8)',
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F02849',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F02849',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  encryptionContainer: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
  },
  encryptionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
});
