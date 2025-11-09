import React, { useState, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Animated as RNAnimated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_REACTIONS_DISPLAY = 3;

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'file';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface Message {
  id: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: MessageType;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  durationSeconds?: number;
  timestamp: Date;
  status: MessageStatus;
  isMine: boolean;
  senderName?: string;
  senderAvatar?: string;
  reactions?: Reaction[];
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  isEdited?: boolean;
  isUnsent?: boolean;
}

interface ChatBubbleProps {
  message: Message;
  onLongPress?: () => void;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onDelete?: () => void;
  onUnsend?: () => void;
  onCopy?: () => void;
  onPressMedia?: (message: Message) => void;
  showSenderInfo?: boolean;
  enableSwipeToReply?: boolean;
  wallpaperGradient?: string[];
  wallpaperConfig?: {
    senderBubbleColor?: string;
    receiverBubbleColor?: string;
    senderTextColor?: string;
    receiverTextColor?: string;
    useGradientForSender?: boolean;
  };
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onLongPress,
  onReact,
  onReply,
  onDelete,
  onUnsend,
  onCopy,
  onPressMedia,
  showSenderInfo = false,
  enableSwipeToReply = true,
  wallpaperGradient,
  wallpaperConfig,
}) => {
  const { theme, isDark } = useTheme();
  const [imageLoading, setImageLoading] = useState(true);
  const swipeAnim = useRef(new RNAnimated.Value(0)).current;
  const replyIconOpacity = useRef(new RNAnimated.Value(0)).current;

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Swipe to reply gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enableSwipeToReply,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return enableSwipeToReply && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const maxSwipe = 60;
        let translateX = gestureState.dx;

        // Swipe direction based on message owner
        if (message.isMine) {
          translateX = Math.min(0, Math.max(-maxSwipe, translateX));
        } else {
          translateX = Math.max(0, Math.min(maxSwipe, translateX));
        }

        swipeAnim.setValue(translateX);
        const opacity = Math.min(Math.abs(translateX) / maxSwipe, 1);
        replyIconOpacity.setValue(opacity);
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 40;
        const shouldReply = Math.abs(gestureState.dx) > threshold;

        if (shouldReply && onReply) {
          // Trigger haptic feedback if available
          onReply();
        }

        // Animate back
        RNAnimated.parallel([
          RNAnimated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }),
          RNAnimated.timing(replyIconOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  const getStatusIcon = () => {
    if (!message.isMine) return null;
    
    switch (message.status) {
      case 'sending':
        return <Ionicons name="time-outline" size={14} color={theme.textSecondary} />;
      case 'sent':
        return <Ionicons name="checkmark" size={14} color={theme.textSecondary} />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color={theme.textSecondary} />;
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color={theme.primary} />;
      case 'failed':
        return <Ionicons name="alert-circle" size={14} color={theme.error} />;
      default:
        return null;
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    // Group reactions by emoji and get total count
    const reactionGroups: { [key: string]: number } = {};
    message.reactions.forEach(reaction => {
      reactionGroups[reaction.emoji] = (reactionGroups[reaction.emoji] || 0) + 1;
    });

    const entries = Object.entries(reactionGroups);
    const displayReactions = entries.slice(0, MAX_REACTIONS_DISPLAY);
    const totalReactions = message.reactions.length;

    return (
      <View style={[
        styles.reactionsContainer,
        message.isMine ? styles.reactionsRight : styles.reactionsLeft
      ]}>
        {displayReactions.map(([emoji, count]) => (
          <TouchableOpacity
            key={emoji}
            style={[
              styles.reactionBadge, 
              { 
                backgroundColor: wallpaperGradient 
                  ? `${wallpaperGradient[0]}30` 
                  : theme.surface 
              }
            ]}
            onPress={() => onReact?.(emoji)}
            activeOpacity={0.7}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            {count > 1 && <Text style={[styles.reactionCount, { color: theme.text }]}>{count}</Text>}
          </TouchableOpacity>
        ))}
        {totalReactions > MAX_REACTIONS_DISPLAY && (
          <TouchableOpacity
            style={[
              styles.reactionBadge, 
              { 
                backgroundColor: wallpaperGradient 
                  ? `${wallpaperGradient[0]}30` 
                  : theme.surface 
              }
            ]}
            onPress={onLongPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.reactionCount, { color: theme.textSecondary }]}>
              +{totalReactions - displayReactions.reduce((sum, [_, count]) => sum + count, 0)}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderReplyPreview = () => {
    if (!message.replyTo) return null;

    return (
      <View style={[
        styles.replyPreview,
        {
          backgroundColor: message.isMine 
            ? 'rgba(255, 255, 255, 0.2)' 
            : wallpaperGradient 
              ? `${wallpaperGradient[0]}15` 
              : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          borderLeftColor: message.isMine ? '#fff' : wallpaperGradient ? wallpaperGradient[0] : theme.primary,
        }
      ]}>
        <Text style={[
          styles.replySenderName, 
          { color: message.isMine ? '#fff' : wallpaperGradient ? wallpaperGradient[0] : theme.primary }
        ]} numberOfLines={1}>
          {message.replyTo.senderName}
        </Text>
        <Text style={[styles.replyText, { color: message.isMine ? 'rgba(255,255,255,0.8)' : theme.textSecondary }]} numberOfLines={2}>
          {message.replyTo.text}
        </Text>
      </View>
    );
  };

  const renderMediaContent = () => {
    if (message.mediaType === 'image' && message.mediaUrl) {
      return (
        <Pressable
          style={styles.mediaContainer}
          onPress={() => onPressMedia?.(message)}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          {imageLoading && (
            <View style={[styles.mediaPlaceholder, { backgroundColor: theme.surface }]}>
              <Ionicons name="image-outline" size={40} color={theme.textSecondary} />
            </View>
          )}
          <Image
            source={{ uri: message.mediaUrl }}
            style={styles.imageContent}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            resizeMode="cover"
          />
        </Pressable>
      );
    }

    if (message.mediaType === 'video' && message.mediaUrl) {
      return (
        <Pressable
          style={[styles.mediaContainer, styles.videoContainer]}
          onPress={() => onPressMedia?.(message)}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          {message.thumbnailUrl ? (
            <Image
              source={{ uri: message.thumbnailUrl }}
              style={styles.imageContent}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam" size={36} color="#fff" />
            </View>
          )}
          <View style={styles.videoOverlay}>
            <Ionicons name="play-circle" size={46} color="#fff" />
          </View>
        </Pressable>
      );
    }

    if (message.mediaType === 'voice') {
      return (
        <View style={styles.voiceContainer}>
          <Ionicons 
            name="play" 
            size={20} 
            color={message.isMine ? '#fff' : wallpaperGradient ? wallpaperGradient[0] : theme.primary} 
          />
          <View style={[
            styles.voiceWave, 
            { 
              backgroundColor: message.isMine 
                ? 'rgba(255,255,255,0.3)' 
                : wallpaperGradient 
                  ? `${wallpaperGradient[0]}20` 
                  : theme.surface 
            }
          ]}>
            {[...Array(20)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  { 
                    backgroundColor: message.isMine 
                      ? '#fff' 
                      : wallpaperGradient 
                        ? wallpaperGradient[0] 
                        : theme.primary 
                  }
                ]}
              />
            ))}
          </View>
          <Text style={[styles.voiceDuration, { color: message.isMine ? '#fff' : theme.textSecondary }]}>
            {message.durationSeconds
              ? `${Math.floor(message.durationSeconds / 60)}:${(message.durationSeconds % 60)
                  .toString()
                  .padStart(2, '0')}`
              : '0:45'}
          </Text>
        </View>
      );
    }

    if (message.mediaType === 'file') {
      return (
        <Pressable
          style={styles.fileContainer}
          onPress={() => onPressMedia?.(message)}
          android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        >
          <View style={[
            styles.fileIcon, 
            { 
              backgroundColor: message.isMine 
                ? 'rgba(255,255,255,0.2)' 
                : wallpaperGradient 
                  ? `${wallpaperGradient[0]}20` 
                  : theme.surface 
            }
          ]}>
            <Ionicons 
              name="document" 
              size={24} 
              color={message.isMine ? '#fff' : wallpaperGradient ? wallpaperGradient[0] : theme.primary} 
            />
          </View>
          <View style={styles.fileInfo}>
            <Text style={[styles.fileName, { color: message.isMine ? '#fff' : theme.text }]} numberOfLines={1}>
              {message.fileName || message.text || 'Attachment'}
            </Text>
            {!!message.fileSize && (
              <Text style={[styles.fileSize, { color: message.isMine ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
                {formatFileSize(message.fileSize)}
              </Text>
            )}
          </View>
        </Pressable>
      );
    }

    return null;
  };

  const BubbleContent = () => {
    if (message.isUnsent) {
      return (
        <View style={styles.bubbleInner}>
          <View style={styles.unsentContainer}>
            <Ionicons 
              name="ban-outline" 
              size={16} 
              color={message.isMine ? 'rgba(255,255,255,0.6)' : theme.textSecondary} 
            />
            <Text style={[
              styles.unsentText,
              { color: message.isMine ? 'rgba(255,255,255,0.6)' : theme.textSecondary }
            ]}>
              You unsent this message
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.bubbleInner}>
        {showSenderInfo && !message.isMine && (
          <Text style={[styles.senderName, { color: wallpaperGradient ? wallpaperGradient[0] : theme.primary }]}>
            {message.senderName}
          </Text>
        )}
        
        {renderReplyPreview()}
        {renderMediaContent()}
        
        {message.text && (
          <Text style={[
            styles.messageText,
            { 
              color: message.isMine 
                ? (wallpaperConfig?.senderTextColor || '#FFFFFF')
                : (wallpaperConfig?.receiverTextColor || (wallpaperGradient ? theme.text : theme.text))
            }
          ]}>
            {message.text}
          </Text>
        )}
        
        <View style={styles.metaContainer}>
          <Text style={[
            styles.timeText,
            { color: message.isMine ? 'rgba(255,255,255,0.7)' : theme.textSecondary }
          ]}>
            {formatTime(message.timestamp)}
          </Text>
          {message.isEdited && (
            <Text style={[
              styles.editedText,
              { color: message.isMine ? 'rgba(255,255,255,0.6)' : theme.textSecondary }
            ]}>
              • edited
            </Text>
          )}
          {getStatusIcon()}
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        message.isMine ? styles.containerMine : styles.containerOther
      ]}
    >
      {/* Reply Icon - Shows during swipe */}
      {enableSwipeToReply && (
        <RNAnimated.View
          style={[
            styles.replyIconContainer,
            message.isMine ? styles.replyIconRight : styles.replyIconLeft,
            {
              opacity: replyIconOpacity,
            },
          ]}
        >
          <Ionicons name="arrow-undo" size={20} color={theme.textSecondary} />
        </RNAnimated.View>
      )}

      <RNAnimated.View
        style={[
          styles.messageRow,
          {
            transform: [{ translateX: swipeAnim }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          onLongPress={onLongPress}
          style={[
            styles.messagePressable,
            message.isMine ? styles.messagePressableMine : styles.messagePressableOther
          ]}
        >
          {!message.isMine && showSenderInfo && message.senderAvatar && (
            <Image source={{ uri: message.senderAvatar }} style={styles.avatar} />
          )}
          
          <View style={styles.bubbleWrapper}>
            {message.isMine ? (
              wallpaperConfig?.useGradientForSender === false && wallpaperConfig?.senderBubbleColor ? (
                // Use solid color for sender if specified
                <View style={[styles.bubble, styles.bubbleMine, { backgroundColor: wallpaperConfig.senderBubbleColor }]}>
                  <BubbleContent />
                </View>
              ) : (
                // Use gradient for sender
                <LinearGradient
                  colors={wallpaperGradient || (theme.gradient as any)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.bubble, styles.bubbleMine]}
                >
                  <BubbleContent />
                </LinearGradient>
              )
            ) : (
              <View style={[
                styles.bubble, 
                styles.bubbleOther, 
                { 
                  backgroundColor: wallpaperConfig?.receiverBubbleColor 
                    ? wallpaperConfig.receiverBubbleColor
                    : wallpaperGradient 
                      ? `${wallpaperGradient[0]}20`
                      : isDark 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.05)'
                }
              ]}>
                <BubbleContent />
              </View>
            )}
            
            {renderReactions()}
          </View>
          
          {message.isMine && (
            <View style={styles.avatarPlaceholder} />
          )}
        </Pressable>
      </RNAnimated.View>
    </View>
  );
};

export default memo(ChatBubble);

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 12,
    position: 'relative',
  },
  containerMine: {
    alignItems: 'flex-end',
    paddingRight: 16, // More padding on the right for user's messages
  },
  containerOther: {
    alignItems: 'flex-start',
  },
  replyIconContainer: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -12 }],
    zIndex: 0,
  },
  replyIconLeft: {
    left: 8,
  },
  replyIconRight: {
    right: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  messagePressable: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messagePressableMine: {
    justifyContent: 'flex-end',
  },
  messagePressableOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
    marginLeft: 8,
  },
  bubbleWrapper: {
    maxWidth: SCREEN_WIDTH * 0.75,
    position: 'relative',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMine: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
  },
  bubbleInner: {
    gap: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    marginBottom: 4,
    borderRadius: 4,
  },
  replySenderName: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyText: {
    fontSize: 12,
    marginTop: 2,
  },
  mediaContainer: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  videoContainer: {
    backgroundColor: '#000',
    position: 'relative',
  },
  mediaPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContent: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 200,
  },
  voiceWave: {
    flex: 1,
    height: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
  },
  waveBar: {
    width: 2,
    height: 12,
    borderRadius: 1,
  },
  voiceDuration: {
    fontSize: 12,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 200,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  unsentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.7,
  },
  unsentText: {
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
  },
  editedText: {
    fontSize: 11,
  },
  reactionsContainer: {
    position: 'absolute',
    bottom: -12,
    flexDirection: 'row',
    gap: 4,
    zIndex: 1,
  },
  reactionsRight: {
    right: 8,
  },
  reactionsLeft: {
    left: 8,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 10,
    fontWeight: '600',
  },
});
