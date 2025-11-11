import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { 
  useAudioRecorder, 
  useAudioPlayer,
  AudioModule,
  RecordingPresets,
} from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';

// Removed service imports - will use Firebase

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VoiceRecorderProps {
  onSend: (uri: string, duration: number) => void;
  onCancel: () => void;
  chatId?: string; // Optional: for direct sending via service
  autoSend?: boolean; // If true, uploads and sends via service instead of callback
}

export default function VoiceRecorder({ 
  onSend, 
  onCancel,
  chatId,
  autoSend = false,
}: VoiceRecorderProps) {
  const { theme, isDark } = useTheme();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioPlayer = useAudioPlayer(audioRecorder.uri || '');
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(30).fill(0));
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef(Array(30).fill(0).map(() => new Animated.Value(0))).current;
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const levelCheckInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startRecording();
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (audioPlayer.playing) {
      setIsPlaying(true);
      const interval = setInterval(() => {
        setPlaybackPosition(audioPlayer.currentTime);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setIsPlaying(false);
    }
  }, [audioPlayer.playing]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      // Pulse animation for recording indicator
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Timer
      timerInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isRecording, isPaused]);

  const cleanup = () => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (levelCheckInterval.current) clearInterval(levelCheckInterval.current);
    setDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    setIsPlaying(false);
    setPlaybackPosition(0);
    setRecordingUri(null);
    setHasRecorded(false);
    setAudioLevels(Array(30).fill(0));
  };

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        console.error('Recording permission not granted');
        return;
      }

      await audioRecorder.record();
      setIsRecording(true);
      setHasRecorded(true);

      // Monitor audio levels (simulated)
      levelCheckInterval.current = setInterval(() => {
        const level = Math.random() * 0.8; // Simulated audio level
        updateAudioLevels(level);
      }, 100);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const updateAudioLevels = (level: number) => {
    setAudioLevels(prev => {
      const newLevels = [...prev.slice(1), level];
      
      // Animate wave bars
      newLevels.forEach((lvl, index) => {
        Animated.timing(waveAnims[index], {
          toValue: lvl,
          duration: 100,
          useNativeDriver: false,
        }).start();
      });

      return newLevels;
    });
  };

  const pauseRecording = async () => {
    if (audioRecorder.isRecording) {
      await audioRecorder.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = async () => {
    if (!audioRecorder.isRecording && !isRecording) {
      await audioRecorder.record();
      setIsPaused(false);
    }
  };

  const stopRecording = async () => {
    if (!audioRecorder.isRecording && !isPaused) return;

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setRecordingUri(uri || null);
      setIsRecording(false);
      setIsPaused(false);
      
      if (levelCheckInterval.current) {
        clearInterval(levelCheckInterval.current);
      }

      // The audio player will automatically use the recorded URI
      if (uri) {
        audioPlayer.replace(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  };

  const playPreview = async () => {
    if (!isPlaying && audioRecorder.uri) {
      audioPlayer.play();
      setIsPlaying(true);
    }
  };

  const pausePreview = async () => {
    if (isPlaying) {
      audioPlayer.pause();
      setIsPlaying(false);
    }
  };

  const stopPreview = async () => {
    audioPlayer.seekTo(0);
    audioPlayer.pause();
    setIsPlaying(false);
    setPlaybackPosition(0);
  };

  const handleReRecord = async () => {
    audioPlayer.pause();
    setRecordingUri(null);
    setDuration(0);
    setPlaybackPosition(0);
    setIsPlaying(false);
    setAudioLevels(Array(30).fill(0));
    await startRecording();
  };

  const handleSend = async () => {
    if (!recordingUri) return;

    try {
      if (autoSend && chatId) {
        // TODO: Connect to Firebase Storage and backend
        setIsUploading(true);

        console.log('Upload voice message:', recordingUri);
        console.log('Send voice message with duration:', duration);

        setIsUploading(false);
        onCancel();
      } else {
        // Use callback (legacy behavior)
        onSend(recordingUri, duration);
        onCancel();
      }
    } catch (error) {
      console.error('Failed to send voice message:', error);
      setIsUploading(false);
      Alert.alert(
        'Upload Failed',
        'Failed to send voice message. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancel = async () => {
    if (audioRecorder.isRecording) {
      await audioRecorder.stop();
    }
    cleanup();
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
      <View style={[styles.recorderCard, { backgroundColor: theme.card }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isRecording ? <Text>Recording...</Text> : <Text>Voice Message</Text>}
          </Text>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Waveform Visualization */}
        <View style={styles.waveformContainer}>
          {audioLevels.map((level, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveBar,
                {
                  height: waveAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, 60],
                  }),
                  backgroundColor: isRecording
                    ? theme.primary
                    : isDark
                    ? 'rgba(255,255,255,0.3)'
                    : 'rgba(0,0,0,0.2)',
                },
              ]}
            />
          ))}
        </View>

        {/* Duration Display */}
        <View style={styles.durationContainer}>
          <Animated.View
            style={[
              styles.recordingIndicator,
              {
                backgroundColor: theme.error,
                transform: [{ scale: isRecording && !isPaused ? pulseAnim : 1 }],
                opacity: isRecording && !isPaused ? 1 : 0,
              },
            ]}
          />
          <Text style={[styles.durationText, { color: theme.text }]}>
            {formatDuration(isRecording ? duration : playbackPosition || duration)}
          </Text>
        </View>

        {/* Preview Playback Controls (only show when not recording and has recording) */}
        {!isRecording && recordingUri && (
          <View style={styles.previewContainer}>
            <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>
              <Text>Preview Recording</Text>
            </Text>
            <View style={styles.previewControls}>
              <TouchableOpacity
                style={[styles.previewButton, { backgroundColor: theme.surface }]}
                onPress={isPlaying ? pausePreview : playPreview}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={20}
                  color={theme.primary}
                />
                <Text style={[styles.previewButtonText, { color: theme.text }]}>
                  {isPlaying ? <Text>Pause</Text> : <Text>Play</Text>}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewButton, { backgroundColor: theme.surface }]}
                onPress={stopPreview}
                disabled={!isPlaying && playbackPosition === 0}
              >
                <Ionicons
                  name="stop"
                  size={20}
                  color={!isPlaying && playbackPosition === 0 ? theme.textSecondary : theme.error}
                />
                <Text style={[styles.previewButtonText, { 
                  color: !isPlaying && playbackPosition === 0 ? theme.textSecondary : theme.text 
                }]}>
                  <Text>Stop</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {/* Delete/Re-record */}
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: theme.surface }]}
            onPress={handleReRecord}
            disabled={!hasRecorded}
          >
            <Ionicons
              name="refresh"
              size={24}
              color={hasRecorded ? theme.text : theme.textSecondary}
            />
            <Text
              style={[
                styles.controlLabel,
                { color: hasRecorded ? theme.text : theme.textSecondary },
              ]}
            >
              <Text>Re-record</Text>
            </Text>
          </TouchableOpacity>

          {/* Pause/Resume or Stop */}
          <TouchableOpacity
            style={[
              styles.mainControlButton,
              {
                backgroundColor: isRecording
                  ? isPaused
                    ? theme.primary
                    : theme.error
                  : theme.surface,
              },
            ]}
            onPress={
              isRecording
                ? isPaused
                  ? resumeRecording
                  : pauseRecording
                : stopRecording
            }
          >
            <Ionicons
              name={
                isRecording
                  ? isPaused
                    ? 'play'
                    : 'pause'
                  : 'mic'
              }
              size={32}
              color="#fff"
          />
          </TouchableOpacity>

          {/* Send */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                backgroundColor: hasRecorded && !isRecording ? theme.primary : theme.surface,
              },
            ]}
            onPress={handleSend}
            disabled={!hasRecorded || isRecording || isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="send"
                  size={24}
                  color={hasRecorded && !isRecording ? '#fff' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.controlLabel,
                    {
                      color: hasRecorded && !isRecording ? '#fff' : theme.textSecondary,
                    },
                  ]}
                >
                  Send
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        {isRecording && (
          <Text style={[styles.instruction, { color: theme.textSecondary }]}>
            {isPaused ? <Text>Tap play to resume</Text> : <Text>Tap pause to pause recording</Text>}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  recorderCard: {
    width: SCREEN_WIDTH - 40,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 80,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    minHeight: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 12,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  previewContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  mainControlButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  instruction: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 16,
    fontStyle: 'italic',
  },
});
