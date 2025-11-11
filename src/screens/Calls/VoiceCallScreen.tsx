import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer } from 'expo-audio';
import { callService, CallSettings } from '../../services/call.service';
// Removed Azure ACS audio manager import
import { socketService } from '../../services/socket.service';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

interface VoiceCallScreenProps {
  route: any;
  navigation: any;
}

export default function VoiceCallScreen({ route, navigation }: VoiceCallScreenProps) {
  const { theme, isDark } = useTheme();
  const { chatId, chatName, chatAvatar } = route.params;
  const { user } = useAuth();
  
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  // Extend state locally to include 'ended' for graceful teardown without changing core union in service layer
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [callSettings, setCallSettings] = useState<CallSettings | null>(null);
  
  const pulseAnim = new Animated.Value(1);
  const ringtonePlayer = useAudioPlayer(require('../../../assets/sounds/call.mp3'));
  const unavailablePlayer = useAudioPlayer(require('../../../assets/sounds/unavailable.mp3'));

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    // Set volumes
    ringtonePlayer.volume = 0.5;
    unavailablePlayer.volume = 0.7;
    
    // Load call settings
    loadCallSettings();
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
      await applyAudioSettings(mockSettings);
    } catch (error) {
      console.error('Failed to load call settings:', error);
    }
  };

  const applyAudioSettings = async (settings: CallSettings) => {
    if (!settings) return;

    // Apply audio constraints for voice calls
    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: settings.echoCancellation,
      noiseSuppression: settings.noiseSuppression,
      autoGainControl: settings.autoGainControl,
    };

    try {
      // TODO: Apply audio processing with WebRTC directly after Firebase setup
      console.log('Audio processing will be implemented with WebRTC');
    } catch (error) {
      console.warn('Failed to apply audio processing', error);
    }

    // In a real implementation with WebRTC:
    // navigator.mediaDevices.getUserMedia({
    //   audio: audioConstraints,
    //   video: false
    // }).then(stream => {
    //   // Apply the audio stream to your call
    // });

    console.log('Applied voice call settings:', audioConstraints);
  };

  useEffect(() => {
    let canceled = false;
    const initiate = async () => {
      try {
        setCallStatus('connecting');
        // Connect socket if needed
        if (!socketService.isConnected()) await socketService.connect();
        // TODO: Connect to Firebase backend
        // Initiate via API (placeholder offer object)
        const offer = { sdp: 'placeholder', type: 'offer' };
        console.log('Initiate call:', { receiverId: chatId, type: 'voice', offer });
        if (canceled) return;
        setCallStatus('ringing');
        // Listen for answer signal
        socketService.on('call:signal', (data: any) => {
          if (data.type === 'answer' && data.from === chatId) {
            setCallStatus('connected');
          }
        });
        socketService.on('call:ended', (data: any) => {
          setCallStatus('ended');
          handleEndCall();
        });
        
        // Listen for real-time settings updates
        socketService.on('settings:updated', (data: any) => {
          if (data.type === 'call' && data.settings) {
            const newSettings = { ...callSettings, ...data.settings };
            setCallSettings(newSettings);
            applyAudioSettings(newSettings).catch((error) =>
              console.warn('Failed to apply updated call settings', error)
            );
          }
        });
      } catch (e) {
        setCallStatus('ended');
      }
    };
    initiate();
    return () => { 
      canceled = true;
      socketService.off('settings:updated');
    };
  }, [chatId]);

  useEffect(() => {
    return () => {
      // TODO: Cleanup WebRTC resources after Firebase setup
      console.log('Cleanup will be implemented with WebRTC');
    };
  }, []);

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
    // Pulse animation for avatar
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    if (callStatus === 'ringing') {
      pulse.start();
    }

    return () => pulse.stop();
  }, [callStatus]);

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

  return (
    <LinearGradient
      colors={isDark ? ['#000000', '#1a1a1a'] : ['#0084FF', '#00C6FF']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Caller Info */}
      <View style={styles.callerInfo}>
        <Animated.View
          style={[
            styles.avatarContainer,
            callStatus === 'ringing' && {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Image
            source={{ uri: chatAvatar || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          {callStatus === 'ringing' && (
            <View style={styles.pulseRing}>
              <View style={styles.pulseRingInner} />
            </View>
          )}
        </Animated.View>

        <Text style={styles.callerName}>{chatName}</Text>
        <Text style={styles.callStatus}>{getStatusText()}</Text>
      </View>

      {/* Call Controls */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <View style={styles.controlButton}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                isSpeaker && styles.iconButtonActive,
                { backgroundColor: 'rgba(255,255,255,0.2)' },
              ]}
              onPress={() => setIsSpeaker(!isSpeaker)}
            >
              <Ionicons
                name={isSpeaker ? 'volume-high' : 'volume-medium'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>Speaker</Text>
          </View>

          <View style={styles.controlButton}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                isMuted && styles.iconButtonActive,
                { backgroundColor: 'rgba(255,255,255,0.2)' },
              ]}
              onPress={() => setIsMuted(!isMuted)}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>
              {isMuted ? 'Unmute' : 'Mute'}
            </Text>
          </View>

          <View style={styles.controlButton}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: 'rgba(255,255,255,0.2)' },
              ]}
              onPress={() => navigation.navigate('AddParticipants', { callType: 'voice' })}
            >
              <Ionicons name="person-add" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>Add</Text>
          </View>
        </View>

        {/* Secondary Controls */}
        <View style={[styles.controlRow, { marginBottom: 40 }]}>
          <View style={styles.controlButton}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: 'rgba(255,255,255,0.2)' },
              ]}
              onPress={() => navigation.navigate('CallParticipants', { callType: 'voice' })}
            >
              <Ionicons name="people" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>Participants</Text>
          </View>

          <View style={styles.controlButton}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: 'rgba(255,255,255,0.2)' },
              ]}
              onPress={() => navigation.navigate('CallSettings')}
            >
              <Ionicons name="settings" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>Settings</Text>
          </View>

          <View style={styles.controlButton}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: 'rgba(255,255,255,0.2)' },
              ]}
            >
              <Ionicons name="ellipsis-horizontal" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>More</Text>
          </View>
        </View>

        {/* End Call Button */}
        <TouchableOpacity
          style={styles.endCallButton}
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={32} color="#fff" />
        </TouchableOpacity>
        
        {/* Encryption Badge */}
        <TouchableOpacity 
          style={styles.encryptionBadge}
          onPress={() => navigation.navigate('CallSettings')}
        >
          <Ionicons name="lock-closed" size={14} color="#4CAF50" />
          <Text style={styles.encryptionText}>End-to-end encrypted</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  callerInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pulseRing: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pulseRingInner: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  callerName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  controls: {
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  controlButton: {
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  controlLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F02849',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    marginTop: 24,
    alignSelf: 'center',
  },
  encryptionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
