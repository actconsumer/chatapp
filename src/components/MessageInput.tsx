import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Pressable,
  Modal,
  ScrollView,
  Text,
  Keyboard,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer, useAudioRecorder, RecordingPresets } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

interface AttachedFile {
  id: string;
  name: string;
  uri: string;
  type: 'image' | 'video' | 'file';
  size?: number;
}

interface MessageInputProps {
  onSendMessage: (text: string, files?: AttachedFile[]) => void;
  onSendImage?: () => void;
  onSendVideo?: () => void;
  onSendFile?: () => void;
  onSendVoice?: (audioUri: string, duration: number) => void;
  onTyping?: (isTyping: boolean) => void;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  } | null;
  onCancelReply?: () => void;
  defaultQuickEmoji?: string;
  wallpaperGradient?: string[];
}

// Recording state type
type RecordingState = 'idle' | 'recording' | 'paused' | 'recorded';

const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋'] },
  { name: 'Gestures', emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤝', '🙏'] },
  { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'] },
  { name: 'Objects', emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫', '🔥', '💯', '👑', '💎', '🎯', '🎮', '🎲', '🎭'] },
];

export default function MessageInput({
  onSendMessage,
  onSendImage,
  onSendVideo,
  onSendFile,
  onSendVoice,
  onTyping,
  replyTo,
  onCancelReply,
  defaultQuickEmoji = '👍',
  wallpaperGradient,
}: MessageInputProps) {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Voice recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  
  const attachmentAnim = useRef(new Animated.Value(0)).current;
  const recordAnim = useRef(new Animated.Value(1)).current;
  const recordPulseAnim = useRef(new Animated.Value(1)).current;
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioPlayer = useAudioPlayer(recordedUri || '');
  const typingSoundPlayer = useAudioPlayer(require('../../assets/sounds/writing.mp3'));
  const sendSoundPlayer = useAudioPlayer(require('../../assets/sounds/send.mp3'));

  useEffect(() => {
    // Set volume for sound players
    typingSoundPlayer.volume = 0.3;
    sendSoundPlayer.volume = 0.5;

    // Keyboard listeners for proper positioning
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const playTypingSound = () => {
    try {
      typingSoundPlayer.seekTo(0);
      typingSoundPlayer.play();
    } catch (error) {
      console.error('Failed to play typing sound', error);
    }
  };

  const playSendSound = () => {
    try {
      sendSoundPlayer.seekTo(0);
      sendSoundPlayer.play();
    } catch (error) {
      console.error('Failed to play send sound', error);
    }
  };

  const handleTextChange = (text: string) => {
    setMessage(text);
    
    // Play typing sound
    if (text.length > message.length) {
      playTypingSound();
    }
    
    // Typing indicator logic
    if (onTyping) {
      onTyping(true);
      
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      
      typingTimeout.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
  };

  const handleSend = () => {
    if (message.trim() || attachedFiles.length > 0) {
      playSendSound();
      onSendMessage(message.trim(), attachedFiles.length > 0 ? attachedFiles : undefined);
      setMessage('');
      setAttachedFiles([]);
      if (onTyping) onTyping(false);
      Keyboard.dismiss();
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library permission to send images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        const newFiles: AttachedFile[] = result.assets.map((asset, index) => ({
          id: `${Date.now()}-${index}`,
          name: asset.fileName || `Image_${index + 1}.jpg`,
          uri: asset.uri,
          type: 'image',
          size: asset.fileSize,
        }));
        
        setAttachedFiles(prev => [...prev, ...newFiles]);
        setShowAttachments(false);
        
        // If onSendImage callback is provided, call it
        if (onSendImage) {
          onSendImage();
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handlePickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library permission to send videos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 300, // 5 minutes
      });

      if (!result.canceled && result.assets) {
        const asset = result.assets[0];
        
        // Check file size (max 100MB)
        if (asset.fileSize && asset.fileSize > 100 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a video smaller than 100MB');
          return;
        }
        
        const newFile: AttachedFile = {
          id: Date.now().toString(),
          name: asset.fileName || 'Video.mp4',
          uri: asset.uri,
          type: 'video',
          size: asset.fileSize,
        };
        
        setAttachedFiles(prev => [...prev, newFile]);
        setShowAttachments(false);
        
        // If onSendVideo callback is provided, call it
        if (onSendVideo) {
          onSendVideo();
        }
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Check file size (max 50MB for general files)
        if (asset.size && asset.size > 50 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a file smaller than 50MB');
          return;
        }
        
        const newFile: AttachedFile = {
          id: Date.now().toString(),
          name: asset.name,
          uri: asset.uri,
          type: 'file',
          size: asset.size,
        };
        
        setAttachedFiles(prev => [...prev, newFile]);
        setShowAttachments(false);
        
        // If onSendFile callback is provided, call it
        if (onSendFile) {
          onSendFile();
        }
      }
    } catch (error: any) {
      if (!error || error.type !== 'cancel') {
        console.error('Error picking file:', error);
        Alert.alert('Error', 'Failed to pick file. Please try again.');
      }
    }
  };

  const removeAttachedFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== id));
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const toggleAttachments = () => {
    const toValue = showAttachments ? 0 : 1;
    setShowAttachments(!showAttachments);
    
    Animated.spring(attachmentAnim, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();
      setRecordingState('recording');
      setRecordingDuration(0);
      
      // Start timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordPulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(recordPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (uri) {
        setRecordedUri(uri);
        setRecordingState('recorded');
        
        // Auto-play the recording
        setTimeout(() => {
          playRecording();
        }, 300);
      }
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      recordPulseAnim.stopAnimation();
      recordPulseAnim.setValue(1);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const pauseRecording = async () => {
    try {
      await audioRecorder.pause();
      setRecordingState('paused');
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      recordPulseAnim.stopAnimation();
      recordPulseAnim.setValue(1);
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  };

  const resumeRecording = async () => {
    try {
      await audioRecorder.record();
      setRecordingState('recording');
      
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(recordPulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(recordPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (error) {
      console.error('Failed to resume recording:', error);
    }
  };

  const cancelRecording = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }
    recordPulseAnim.stopAnimation();
    recordPulseAnim.setValue(1);
    setRecordingState('idle');
    setRecordingDuration(0);
    setRecordedUri(null);
    setIsPlayingRecording(false);
  };

  const sendRecording = () => {
    if (recordedUri && onSendVoice) {
      playSendSound();
      onSendVoice(recordedUri, recordingDuration);
      cancelRecording();
    }
  };

  const playRecording = async () => {
    try {
      if (isPlayingRecording) {
        await audioPlayer.pause();
        setIsPlayingRecording(false);
      } else {
        await audioPlayer.play();
        setIsPlayingRecording(true);
      }
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      recordPulseAnim.stopAnimation();
    };
  }, []);

  const handleVoicePress = () => {
    if (recordingState === 'idle') {
      startRecording();
    } else if (recordingState === 'recording') {
      stopRecording();
    }
  };

  const insertEmoji = (emoji: string) => {
    const newMessage = message + emoji;
    setMessage(newMessage);
    handleTextChange(newMessage);
  };

  const attachmentButtons = [
    { icon: 'image', color: '#9B59B6', onPress: handlePickImage, label: 'Photo' },
    { icon: 'videocam', color: '#E74C3C', onPress: handlePickVideo, label: 'Video' },
    { icon: 'document', color: '#3498DB', onPress: handlePickFile, label: 'File' },
  ];

  // Handle keyboard dismissal on app state change
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setShowEmoji(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, []);

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: wallpaperGradient ? `${wallpaperGradient[0]}15` : theme.background, 
        borderTopColor: wallpaperGradient ? `${wallpaperGradient[0]}30` : theme.border 
      }
    ]}>
      {/* Reply Preview */}
      {replyTo && (
        <View style={[
          styles.replyPreview, 
          { 
            backgroundColor: wallpaperGradient ? `${wallpaperGradient[0]}10` : theme.surface, 
            borderLeftColor: wallpaperGradient ? wallpaperGradient[0] : theme.primary 
          }
        ]}>
          <View style={styles.replyContent}>
            <Text style={[styles.replyLabel, { color: theme.textSecondary }]}>Replying to</Text>
            <Text style={[styles.replySender, { color: wallpaperGradient ? wallpaperGradient[0] : theme.primary }]}>{replyTo.senderName}</Text>
            <Text style={[styles.replyText, { color: theme.textSecondary }]} numberOfLines={1}>
              {replyTo.text}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply}>
            <Ionicons name="close" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* File Preview */}
      {attachedFiles.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={[styles.filePreviewContainer, { backgroundColor: theme.surface }]}
          contentContainerStyle={styles.filePreviewContent}
        >
          {attachedFiles.map((file) => (
            <View key={file.id} style={[styles.filePreviewItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {/* File Icon/Thumbnail */}
              <View style={styles.filePreviewIconContainer}>
                {file.type === 'image' ? (
                  <Image source={{ uri: file.uri }} style={styles.filePreviewImage} />
                ) : file.type === 'video' ? (
                  <View style={styles.videoThumbnailContainer}>
                    <Image source={{ uri: file.uri }} style={styles.filePreviewImage} />
                    <View style={styles.videoPlayOverlay}>
                      <Ionicons name="play-circle" size={32} color="#fff" />
                    </View>
                  </View>
                ) : (
                  <View style={[styles.fileIconContainer, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons name="document-text" size={32} color={theme.primary} />
                  </View>
                )}
                
                {/* Remove Button */}
                <TouchableOpacity 
                  style={[styles.removeFileButton, { backgroundColor: theme.error }]}
                  onPress={() => removeAttachedFile(file.id)}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* File Info */}
              <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                {file.name}
              </Text>
              {file.size && (
                <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
                  {formatFileSize(file.size)}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}

        {/* Attachment Options */}
        {showAttachments && (
          <Animated.View
            style={[
              styles.attachmentsContainer,
              {
                opacity: attachmentAnim,
                transform: [{
                  translateY: attachmentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            {attachmentButtons.map((btn, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.attachmentButton, { backgroundColor: btn.color }]}
                onPress={() => {
                  btn.onPress?.();
                  toggleAttachments();
                }}
              >
                <Ionicons name={btn.icon as any} size={24} color="#fff" />
                <Text style={styles.attachmentLabel}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Input Row */}
        <View style={styles.inputRow}>
          {/* Attachment Button */}
          <TouchableOpacity
            style={[
              styles.iconButton, 
              { 
                backgroundColor: showAttachments 
                  ? (wallpaperGradient ? wallpaperGradient[0] : theme.primary) 
                  : (wallpaperGradient ? `${wallpaperGradient[0]}10` : theme.surface)
              }
            ]}
            onPress={toggleAttachments}
          >
            <Ionicons
              name={showAttachments ? 'close' : 'add'}
              size={24}
              color={showAttachments ? '#fff' : (wallpaperGradient ? wallpaperGradient[0] : theme.primary)}
            />
          </TouchableOpacity>

          {/* Text Input or Recording UI */}
          {recordingState !== 'idle' ? (
            // Inline Recording UI
            <View style={[
              styles.recordingContainer,
              {
                backgroundColor: '#FF3B30',
                borderColor: '#FF6B6B',
              }
            ]}>
              <Animated.View style={{ transform: [{ scale: recordPulseAnim }] }}>
                <Ionicons name="mic" size={24} color="#fff" />
              </Animated.View>
              
              <View style={styles.recordingInfo}>
                <Text style={styles.recordingText}>
                  {recordingState === 'recording' ? 'Recording...' : 
                   recordingState === 'paused' ? 'Paused' : 'Recorded'}
                </Text>
                <Text style={styles.recordingDuration}>
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </Text>
              </View>

              {recordingState === 'recorded' && (
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={playRecording}
                >
                  <Ionicons 
                    name={isPlayingRecording ? 'pause' : 'play'} 
                    size={20} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              )}

              {recordingState === 'recording' && (
                <TouchableOpacity
                  style={styles.pauseButton}
                  onPress={pauseRecording}
                >
                  <Ionicons name="pause" size={20} color="#fff" />
                </TouchableOpacity>
              )}

              {recordingState === 'paused' && (
                <TouchableOpacity
                  style={styles.resumeButton}
                  onPress={resumeRecording}
                >
                  <Ionicons name="play" size={20} color="#fff" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelRecordButton}
                onPress={cancelRecording}
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
              </TouchableOpacity>

              {recordingState === 'recorded' && (
                <TouchableOpacity
                  style={styles.sendRecordButton}
                  onPress={sendRecording}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // Normal Text Input with Gradient Background
            wallpaperGradient ? (
              <LinearGradient
                colors={wallpaperGradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.inputContainer, styles.gradientInputContainer]}
              >
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      color: '#FFFFFF',
                      backgroundColor: 'transparent',
                      borderRadius: 18,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }
                  ]}
                  placeholder="Type a message..."
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={message}
                  onChangeText={handleTextChange}
                  multiline
                  maxLength={1000}
                />
                
                {/* Quick Reaction Emoji Button */}
                {!message.trim() && attachedFiles.length === 0 && (
                  <TouchableOpacity
                    style={styles.quickEmojiButton}
                    onPress={() => {
                      setMessage(defaultQuickEmoji);
                      handleTextChange(defaultQuickEmoji);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickEmojiText}>{defaultQuickEmoji}</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.emojiButton}
                  onPress={() => setShowEmoji(!showEmoji)}
                >
                  <Ionicons
                    name={showEmoji ? 'close-circle' : 'happy-outline'}
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              // Non-gradient fallback
              <View style={[
                styles.inputContainer, 
                { 
                  backgroundColor: theme.surface,
                  borderWidth: 2,
                  borderColor: theme.border,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 2,
                }
              ]}>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      color: theme.text,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: 18,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }
                  ]}
                  placeholder="Type a message..."
                  placeholderTextColor={theme.textSecondary}
                  value={message}
                  onChangeText={handleTextChange}
                  multiline
                maxLength={1000}
              />
              
              {/* Quick Reaction Emoji Button */}
              {!message.trim() && attachedFiles.length === 0 && (
                <TouchableOpacity
                  style={styles.quickEmojiButton}
                  onPress={() => {
                    setMessage(defaultQuickEmoji);
                    handleTextChange(defaultQuickEmoji);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickEmojiText}>{defaultQuickEmoji}</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.emojiButton}
                onPress={() => setShowEmoji(!showEmoji)}
              >
                <Ionicons
                  name={showEmoji ? 'close-circle' : 'happy-outline'}
                  size={24}
                  color={theme.primary}
                />
              </TouchableOpacity>
            </View>
            )
          )}

          {/* Send/Voice Button */}
          {message.trim() || attachedFiles.length > 0 ? (
            <TouchableOpacity onPress={handleSend}>
              <LinearGradient
                colors={wallpaperGradient || (theme.gradient as any)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButton}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <Animated.View style={{ transform: [{ scale: recordAnim }] }}>
              {wallpaperGradient ? (
                <TouchableOpacity onPress={handleVoicePress}>
                  <LinearGradient
                    colors={wallpaperGradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.voiceButton}
                  >
                    <Ionicons
                      name="mic"
                      size={24}
                      color="#fff"
                    />
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.voiceButton,
                    { backgroundColor: theme.surface }
                  ]}
                  onPress={handleVoicePress}
                >
                  <Ionicons
                    name="mic"
                    size={24}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </View>

        {/* Emoji Picker Modal */}
        <Modal
          visible={showEmoji}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEmoji(false)}
        >
          <Pressable style={styles.emojiModalOverlay} onPress={() => setShowEmoji(false)}>
            <Pressable style={[styles.emojiPicker, { backgroundColor: theme.card }]}>
              <View style={[styles.emojiHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.emojiTitle, { color: theme.text }]}>Emoji</Text>
                <TouchableOpacity onPress={() => setShowEmoji(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.emojiScroll} showsVerticalScrollIndicator={false}>
                {EMOJI_CATEGORIES.map((category, catIndex) => (
                  <View key={catIndex} style={styles.emojiCategory}>
                    <Text style={[styles.categoryName, { color: theme.textSecondary }]}>
                      {category.name}
                    </Text>
                    <View style={styles.emojiGrid}>
                      {category.emojis.map((emoji, emojiIndex) => (
                        <TouchableOpacity
                          key={emojiIndex}
                          style={styles.emojiItem}
                          onPress={() => {
                            insertEmoji(emoji);
                          }}
                        >
                          <Text style={styles.emojiChar}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderLeftWidth: 3,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  replySender: {
    fontSize: 13,
    fontWeight: '600',
  },
  replyText: {
    fontSize: 13,
    marginTop: 2,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  attachmentButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    gap: 4,
  },
  attachmentLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
  },
  gradientInputContainer: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 80,
    paddingTop: Platform.OS === 'ios' ? 8 : 0,
  },
  emojiButton: {
    padding: 4,
    marginLeft: 4,
    marginBottom: 2,
  },
  quickEmojiButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 132, 255, 0.1)',
  },
  quickEmojiText: {
    fontSize: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  emojiPicker: {
    height: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  emojiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  emojiTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emojiScroll: {
    flex: 1,
  },
  emojiCategory: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiItem: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiChar: {
    fontSize: 28,
  },
  voiceRecorderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filePreviewContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filePreviewContent: {
    gap: 10,
  },
  filePreviewItem: {
    width: 90,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  filePreviewIconContainer: {
    position: 'relative',
    width: '100%',
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filePreviewImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  videoThumbnailContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  fileIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFileButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fileName: {
    fontSize: 11,
    fontWeight: '500',
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 2,
  },
  fileSize: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  // Recording UI styles
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
    gap: 10,
  },
  recordingInfo: {
    flex: 1,
    marginLeft: 4,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  recordingDuration: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelRecordButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendRecordButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

