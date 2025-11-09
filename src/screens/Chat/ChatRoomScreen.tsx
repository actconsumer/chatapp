import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  LayoutAnimation,
  UIManager,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Linking,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { usePrivacy } from '../../context/PrivacyContext';
import { useFocusEffect } from '@react-navigation/native';
import ChatBubble, { Message, MessageStatus } from '../../components/ChatBubble';
import MessageInput from '../../components/MessageInput';
import TypingIndicator from '../../components/TypingIndicator';
import MessageReactions from '../../components/MessageReactions';
import DateSeparator from '../../components/DateSeparator';
import MessageActionsSheet, { MessageAction } from '../../components/MessageActionsSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWallpaper, WallpaperConfig, DEFAULT_WALLPAPER } from '../../utils/wallpapers';
import { getChatPreferences } from '../../utils/chatStorage';
import { chatService } from '../../services/chat.service';
import { messageService, SendMessageRequest } from '../../services/message.service';
import { socketService } from '../../services/socket.service';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 70;

interface AttachedFile {
  uri: string;
  type: 'image' | 'video' | 'file';
  name: string;
  size?: number;
}

interface ChatRoomScreenProps {
  route: any;
  navigation: any;
}

const VideoPreview = ({ uri, style }: { uri: string; style: StyleProp<ViewStyle> }) => {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = false;
  });

  useEffect(() => {
    const startPlayback = async () => {
      try {
        await player.play();
      } catch (error) {
        console.error('Failed to start video preview playback', error);
      }
    };

    startPlayback();

    return () => {
      try {
        player.pause();
      } catch (error) {
        console.error('Failed to pause video preview playback', error);
      }
    };
  }, [player]);

  return (
    <VideoView
      style={style}
      player={player}
      contentFit="contain"
      allowsFullscreen
      allowsPictureInPicture
      nativeControls
    />
  );
};

export default function ChatRoomScreen({ route, navigation }: ChatRoomScreenProps) {
  const { theme, isDark } = useTheme();
  const { settings: privacySettings } = usePrivacy();
  const { chatId, chatName, chatAvatar, isOnline } = route.params;
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  // Remote typing indicator
  const [isTyping, setIsTyping] = useState(false);
  // Pagination
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 40;
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [shouldScrollToEnd, setShouldScrollToEnd] = useState(false);
  const [currentWallpaper, setCurrentWallpaper] = useState<WallpaperConfig>(DEFAULT_WALLPAPER);
  const [quickReactionEmoji, setQuickReactionEmoji] = useState<string>('👍');
  const [mediaPreview, setMediaPreview] = useState<{ uri: string; type: 'image' | 'video' | 'file'; name?: string } | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCountBelowScroll, setUnreadCountBelowScroll] = useState(0);
  
  const flatListRef = useRef<FlatList>(null);
  const scrollOffsetRef = useRef(0);
  const lastReadMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const normalizeMediaType = useCallback(
    (value?: string): 'image' | 'video' | 'voice' | 'file' | undefined => {
    if (!value) return undefined;
    const normalized = value.toLowerCase();
    switch (normalized) {
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'audio':
      case 'voice':
        return 'voice';
      case 'file':
      case 'document':
        return 'file';
      default:
        return undefined;
    }
    },
    []
  );

  const mapAttachmentToMediaType = useCallback(
    (type: AttachedFile['type']): 'image' | 'video' | 'file' => {
    switch (type) {
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      default:
        return 'file';
    }
    },
    []
  );

  const guessMimeType = useCallback((file: AttachedFile): string => {
    if (file.type === 'image') return 'image/jpeg';
    if (file.type === 'video') return 'video/mp4';
    const extension = file.name?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'doc':
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'ppt':
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'txt':
        return 'text/plain';
      case 'zip':
        return 'application/zip';
      default:
        return 'application/octet-stream';
    }
  }, []);

  const mapBackendToMessage = useCallback((raw: any): Message => {
    return {
      id: raw?.id,
      text: raw?.text || raw?.content || '',
      timestamp: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
      status: (raw?.status as MessageStatus) || 'sent',
      isMine: user ? raw?.senderId === user.id : false,
      senderName: raw?.senderName || raw?.sender?.displayName || chatName,
      senderAvatar: raw?.senderAvatar || raw?.sender?.avatar,
      mediaUrl: raw?.mediaUrl,
      mediaType: normalizeMediaType(raw?.mediaType),
      thumbnailUrl: raw?.thumbnailUrl,
      fileName: raw?.fileName,
      fileSize: raw?.fileSize,
      mimeType: raw?.mimeType,
      durationSeconds: raw?.durationSeconds,
      reactions: Array.isArray(raw?.reactions)
        ? raw.reactions.map((reaction: any) => ({
            emoji: reaction.emoji,
            userId: reaction.userId,
            userName: reaction.userName || reaction.displayName,
          }))
        : undefined,
      replyTo: raw?.replyTo
        ? {
            id: raw.replyTo.id || raw.replyTo.messageId || '',
            text: raw.replyTo.text || '',
            senderName: raw.replyTo.senderName || raw.replyTo.sender?.displayName || '',
          }
        : undefined,
      isEdited: !!raw?.isEdited,
      isUnsent: !!raw?.isDeleted,
    };
  }, [chatName, normalizeMediaType, user]);

  const handleSocketNewMessage = useCallback(
    (data: any) => {
      const conversationId = data.conversationId || data.chatId;
      if (conversationId !== chatId) return;

      const mapped = mapBackendToMessage(data);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages(prev => [...prev, mapped]);
      setShouldScrollToEnd(true);

      if (!mapped.isMine) {
        chatService.markRead(chatId, data.id || mapped.id).catch(() => {});
      }
    },
    [chatId, mapBackendToMessage]
  );

  const handleTypingStart = useCallback(
    (data: any) => {
      if (data.conversationId === chatId) setIsTyping(true);
    },
    [chatId]
  );

  const handleTypingStop = useCallback(
    (data: any) => {
      if (data.conversationId === chatId) setIsTyping(false);
    },
    [chatId]
  );

  const handleMessageReadEvent = useCallback(
    (data: any) => {
      if (data.conversationId === chatId) {
        setMessages(prev =>
          prev.map(m => ({
            ...m,
            status: m.id === data.messageId ? 'read' : m.status,
          }))
        );
      }
    },
    [chatId]
  );

  const handleMessageDeleted = useCallback(
    (data: any) => {
      if (data.conversationId === chatId) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMessages(prev =>
          prev.map(m =>
            m.id === data.messageId
              ? { ...m, isUnsent: true, text: 'This message was deleted', mediaUrl: undefined }
              : m
          )
        );
      }
    },
    [chatId]
  );

  const handleMessageReaction = useCallback(
    (data: any) => {
      if (data.conversationId === chatId && user && data.userId !== user.id) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMessages(prev =>
          prev.map(msg => {
            if (msg.id === data.messageId) {
              const reactions = msg.reactions || [];
              const existingReaction = reactions.find(r => r.userId === data.userId);
              
              if (existingReaction) {
                return {
                  ...msg,
                  reactions: reactions.map(r =>
                    r.userId === data.userId ? { ...r, emoji: data.emoji } : r
                  ),
                };
              } else {
                return {
                  ...msg,
                  reactions: [...reactions, { 
                    emoji: data.emoji, 
                    userId: data.userId, 
                    userName: data.userName || 'User' 
                  }],
                };
              }
            }
            return msg;
          })
        );
      }
    },
    [chatId, user]
  );

  const fetchInitial = useCallback(async () => {
    try {
      setLoading(true);
      const list = await chatService.messages(chatId, { limit: PAGE_SIZE });
      const mapped: Message[] = list.map(mapBackendToMessage);
      setMessages(mapped.reverse());
      setHasMore(list.length === PAGE_SIZE);
    } catch (e) {
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [chatId, mapBackendToMessage]);

  // Load cached preferences on mount and when screen comes into focus
  useEffect(() => {
    loadChatPreferences();
  }, [chatId]);

  // Reload preferences when screen comes back into focus (e.g., from wallpaper screen)
  useFocusEffect(
    useCallback(() => {
      loadChatPreferences();
    }, [chatId])
  );

  const loadChatPreferences = async () => {
    try {
      const preferences = await getChatPreferences(chatId);
      if (preferences) {
        const wallpaper = getWallpaper(preferences.wallpaperId);
        setCurrentWallpaper(wallpaper);
        setQuickReactionEmoji(preferences.customEmoji);
      }
    } catch (error) {
      console.error('Error loading chat preferences:', error);
    }
  };

  // Configure header
  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <SafeAreaView 
          edges={['top', 'left', 'right']} 
          style={[styles.headerContainer, { backgroundColor: currentWallpaper.gradient ? currentWallpaper.gradient[0] : theme.card }]}
        >
          <LinearGradient
            colors={currentWallpaper.gradient as any || [theme.card, theme.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerTitle}
              onPress={() => {
                navigation.navigate('ContactProfile', { 
                  chatId, 
                  chatName, 
                  chatAvatar, 
                  isOnline 
                });
              }}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: chatAvatar || 'https://via.placeholder.com/40' }}
                style={styles.headerAvatar}
                resizeMode="cover"
              />
              <View style={styles.headerTitleText}>
                <Text 
                  style={[styles.headerName, { color: '#fff' }]} 
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {chatName}
                </Text>
                <Text 
                  style={[styles.headerStatus, { color: 'rgba(255, 255, 255, 0.8)' }]}
                  numberOfLines={1}
                >
                  {isTyping ? 'typing...' : isOnline ? 'Active now' : 'Offline'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.navigate('VoiceCall', { chatId, chatName, chatAvatar })}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="call" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.navigate('VideoCall', { chatId, chatName, chatAvatar })}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="videocam" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowOptionsModal(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          </LinearGradient>
        </SafeAreaView>
      ),
    });
  }, [navigation, theme, currentWallpaper, chatName, chatAvatar, isOnline, isTyping]);

  // Load messages & setup sockets
  useEffect(() => {
    const init = async () => {
      await fetchInitial();
      try {
        if (!socketService.isConnected()) {
          await socketService.connect();
        }
        socketService.joinConversation(chatId);
        socketService.on('message:new', handleSocketNewMessage);
        socketService.on('typing:start', handleTypingStart);
        socketService.on('typing:stop', handleTypingStop);
        socketService.on('message:read', handleMessageReadEvent);
        socketService.on('message:deleted', handleMessageDeleted);
        socketService.on('message:reaction', handleMessageReaction);
      } catch (e) {
        // Non-fatal
      }
    };
    init();

    // Mark all as read when entering
    chatService.markRead(chatId).catch(() => {});

    // Dismiss keyboard listener
    const subscription = Keyboard.addListener('keyboardDidHide', () => Keyboard.dismiss());
    return () => {
      subscription.remove();
      socketService.off('message:new', handleSocketNewMessage);
      socketService.off('typing:start', handleTypingStart);
      socketService.off('typing:stop', handleTypingStop);
      socketService.off('message:read', handleMessageReadEvent);
      socketService.off('message:deleted', handleMessageDeleted);
      socketService.off('message:reaction', handleMessageReaction);
      socketService.leaveConversation(chatId);
    };
  }, [chatId, fetchInitial, handleSocketNewMessage, handleTypingStart, handleTypingStop, handleMessageReadEvent, handleMessageDeleted, handleMessageReaction, mapBackendToMessage]);

  const fetchMore = useCallback(async () => {
    if (fetchingMore || !hasMore || messages.length === 0) return;
    try {
      setFetchingMore(true);
      const oldest = messages[0];
      const list = await chatService.messages(chatId, {
        limit: PAGE_SIZE,
        before: oldest.timestamp ? oldest.timestamp.toISOString() : undefined,
      });
      const mapped: Message[] = list.map(mapBackendToMessage);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages(prev => [...mapped.reverse(), ...prev]);
      if (list.length < PAGE_SIZE) setHasMore(false);
    } catch (e) {
      // silent
    } finally {
      setFetchingMore(false);
    }
  }, [chatId, fetchingMore, hasMore, mapBackendToMessage, messages]);

  const handleSendMessage = useCallback(
    async (text: string, files?: AttachedFile[]) => {
      const trimmedText = text.trim();

      if (files && files.length > 0) {
        files.forEach((file, index) => {
          const optimisticId = `${Date.now()}-${Math.random()}`;
          const caption = index === 0 ? trimmedText : '';
          const mediaType = mapAttachmentToMediaType(file.type);

          const optimisticMessage: Message = {
            id: optimisticId,
            text: caption || file.name,
            timestamp: new Date(),
            status: 'sending',
            isMine: true,
            mediaUrl: file.uri,
            mediaType,
            fileName: file.name,
            fileSize: file.size,
            replyTo: replyTo
              ? {
                  id: replyTo.id,
                  text: replyTo.text || '',
                  senderName: replyTo.senderName || '',
                }
              : undefined,
          };

          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setMessages(prev => [...prev, optimisticMessage]);
          setShouldScrollToEnd(true);

          (async () => {
            try {
              const upload = await messageService.uploadMedia({
                chatId,
                file: {
                  uri: file.uri,
                  name: file.name || `upload-${Date.now()}`,
                  type: guessMimeType(file),
                },
              });

              const payload: SendMessageRequest = {
                chatId,
                text: caption ? caption : undefined,
                mediaUrl: upload.mediaUrl,
                mediaType: normalizeMediaType(upload.mediaType) || mediaType,
                replyTo: replyTo?.id,
                metadata: {
                  fileName: file.name,
                  fileSize: file.size,
                },
              };

              const sent = await messageService.sendMessage(payload);
              const nextMessage = mapBackendToMessage(sent);
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setMessages(prev =>
                prev.map(m => (m.id === optimisticId ? nextMessage : m))
              );
              chatService.markRead(chatId, sent.id).catch(() => {});
            } catch (error) {
              setMessages(prev =>
                prev.map(m => (m.id === optimisticId ? { ...m, status: 'failed' } : m))
              );
            }
          })();
        });

        setReplyTo(null);
        return;
      }

      if (!trimmedText) {
        return;
      }

      const optimisticId = Date.now().toString();
      const newMessage: Message = {
        id: optimisticId,
        text: trimmedText,
        timestamp: new Date(),
        status: 'sending',
        isMine: true,
        replyTo: replyTo
          ? {
              id: replyTo.id,
              text: replyTo.text || '',
              senderName: replyTo.senderName || '',
            }
          : undefined,
      };

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages(prev => [...prev, newMessage]);
      setReplyTo(null);
      setShouldScrollToEnd(true);

      try {
        const payload: SendMessageRequest = {
          chatId,
          text: trimmedText,
          replyTo: replyTo?.id,
        };
        const sent = await messageService.sendMessage(payload);
        const nextMessage = mapBackendToMessage(sent);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMessages(prev => prev.map(m => (m.id === optimisticId ? nextMessage : m)));
        chatService.markRead(chatId, sent.id).catch(() => {});
      } catch (error) {
        setMessages(prev =>
          prev.map(m => (m.id === optimisticId ? { ...m, status: 'failed' } : m))
        );
      }
    },
    [chatId, guessMimeType, mapAttachmentToMediaType, mapBackendToMessage, normalizeMediaType, replyTo]
  );

  const handleSendVoice = useCallback((audioUri: string, duration: number) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      mediaUrl: audioUri,
      mediaType: 'voice',
      text: `Voice message (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
      timestamp: new Date(),
      status: 'sending',
      isMine: true,
    };

    setMessages(prev => [...prev, newMessage]);
    setShouldScrollToEnd(true);

    // Simulate message sending with status updates
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' as MessageStatus } : msg
        )
      );
    }, 500);

    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'delivered' as MessageStatus } : msg
        )
      );
    }, 1000);
  }, []);

  const handlePickImage = useCallback(() => {
    // Placeholder - actual implementation handled by MessageInput
    console.log('Image picker triggered');
  }, []);

  const handlePickVideo = useCallback(() => {
    // Placeholder - actual implementation handled by MessageInput
    console.log('Video picker triggered');
  }, []);

  const handlePickFile = useCallback(() => {
    // Placeholder - actual implementation handled by MessageInput
    console.log('File picker triggered');
  }, []);

  const openMediaPreview = useCallback((message: Message) => {
    if (message.mediaType === 'image' || message.mediaType === 'video') {
      if (!message.mediaUrl) return;
      setMediaPreview({
        uri: message.mediaUrl,
        type: message.mediaType,
        name: message.fileName || message.text,
      });
    } else if (message.mediaType === 'file' && message.mediaUrl) {
      setMediaPreview({
        uri: message.mediaUrl,
        type: 'file',
        name: message.fileName || message.text,
      });
    }
  }, []);

  const closeMediaPreview = useCallback(() => setMediaPreview(null), []);

  const openAttachmentLink = useCallback(async (uri: string) => {
    try {
      const canOpen = await Linking.canOpenURL(uri);
      if (!canOpen) {
        Alert.alert('Unavailable', 'Cannot open this attachment on your device.');
        return;
      }
      await Linking.openURL(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to open attachment');
      console.error('Failed to open attachment', error);
    }
  }, []);

  const handleLongPressMessage = useCallback((message: Message) => {
    setSelectedMessage(message);
    setShowActionsSheet(true);
  }, []);

  const handleMessageAction = (actionId: string) => {
    if (!selectedMessage) return;

    switch (actionId) {
      case 'reply':
        handleReply(selectedMessage);
        break;
      case 'copy':
        handleCopyMessage(selectedMessage);
        break;
      case 'react':
        setShowReactions(true);
        break;
      case 'forward':
        handleForwardMessage(selectedMessage);
        break;
      case 'delete':
        handleDeleteMessage(selectedMessage);
        break;
      case 'unsend':
        handleUnsendMessage(selectedMessage);
        break;
    }
  };

  const handleCopyMessage = useCallback((message: Message) => {
    if (message.text) {
      Clipboard.setStringAsync(message.text);
      Alert.alert('Copied', 'Message copied to clipboard');
    }
  }, []);

  const handleForwardMessage = (message: Message) => {
    Alert.alert('Forward', 'Forward message feature coming soon!');
  };

  const handleDeleteMessage = useCallback(async (message: Message) => {
    Alert.alert(
      'Delete Message',
      'Do you want to delete this message for yourself or for everyone?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete for Me',
          onPress: async () => {
            try {
              // Optimistically remove from UI
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setMessages(prev => prev.filter(msg => msg.id !== message.id));
              
              // Call backend API
              await messageService.deleteForMe(message.id);
            } catch (error) {
              // Revert on error
              Alert.alert('Error', 'Failed to delete message');
              await fetchInitial(); // Refresh to restore state
            }
          },
        },
        message.isMine ? {
          text: 'Delete for Everyone',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistically mark as deleted
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === message.id 
                    ? { ...msg, isUnsent: true, text: 'This message was deleted', mediaUrl: undefined }
                    : msg
                )
              );
              
              // Call backend API
              await messageService.deleteForEveryone(message.id);
              
              // Emit socket event for real-time sync
              socketService.send('message:deleted', { 
                conversationId: chatId, 
                messageId: message.id 
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
              await fetchInitial();
            }
          },
        } : null,
      ].filter(Boolean) as any
    );
  }, [chatId, fetchInitial]);

  const handleUnsendMessage = (message: Message) => {
    if (!message.isMine) {
      Alert.alert('Error', 'You can only unsend your own messages');
      return;
    }

    Alert.alert(
      'Unsend Message',
      'This message will be removed for everyone in this chat.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsend',
          style: 'destructive',
          onPress: () => {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === message.id 
                  ? { ...msg, isUnsent: true, text: undefined, mediaUrl: undefined }
                  : msg
              )
            );
            // In a real app, this would send a socket event to remove the message for everyone
          },
        },
      ]
    );
  };

  const getMessageActions = (message: Message): MessageAction[] => {
    const actions: MessageAction[] = [
      {
        id: 'reply',
        label: 'Reply',
        icon: 'arrow-undo',
      },
      {
        id: 'copy',
        label: 'Copy',
        icon: 'copy-outline',
      },
      {
        id: 'react',
        label: 'Add Reaction',
        icon: 'happy-outline',
      },
      {
        id: 'forward',
        label: 'Forward',
        icon: 'arrow-redo',
      },
    ];

    if (message.isMine) {
      actions.push({
        id: 'unsend',
        label: 'Unsend',
        icon: 'trash-outline',
        destructive: true,
      });
    }

    actions.push({
      id: 'delete',
      label: message.isMine ? 'Delete for Me' : 'Delete',
      icon: 'close-circle-outline',
      destructive: true,
    });

    return actions;
  };

  const handleReaction = useCallback(async (emoji: string) => {
    if (!selectedMessage || !user) return;

    const messageId = selectedMessage.id;
    const existingReactions = selectedMessage.reactions || [];
    const myReaction = existingReactions.find(r => r.userId === user.id);

    try {
      // Optimistically update UI
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === messageId) {
            const reactions = msg.reactions || [];
            
            if (myReaction) {
              // Update existing reaction
              return {
                ...msg,
                reactions: reactions.map(r =>
                  r.userId === user.id ? { ...r, emoji } : r
                ),
              };
            } else {
              // Add new reaction
              return {
                ...msg,
                reactions: [...reactions, { emoji, userId: user.id, userName: user.displayName || 'You' }],
              };
            }
          }
          return msg;
        })
      );

      // Call backend API
      if (myReaction && myReaction.emoji !== emoji) {
        // Remove old reaction first
        await messageService.removeReaction(messageId, myReaction.emoji);
      }
      
      // Add new reaction
      await messageService.reactToMessage(messageId, { emoji });
      
      // Emit socket event for real-time sync
      socketService.send('message:reaction', {
        conversationId: chatId,
        messageId,
        emoji,
        userId: user.id,
      });
    } catch (error) {
      // Revert on error
      Alert.alert('Error', 'Failed to add reaction');
      setMessages(prev =>
        prev.map(msg => (msg.id === messageId ? selectedMessage : msg))
      );
    }
  }, [selectedMessage, user, chatId]);

  const handleReply = useCallback((message: Message) => {
    setReplyTo(message);
    setShowActionsSheet(false);
  }, []);

  const scrollToMessage = useCallback((messageId: string) => {
    const index = messages.findIndex(msg => msg.id === messageId);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  }, [messages]);

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator =
      !prevMessage ||
      new Date(item.timestamp).toDateString() !==
        new Date(prevMessage.timestamp).toDateString();

    const showSenderInfo = !item.isMine && (!prevMessage || prevMessage.isMine);

    return (
      <>
        {showDateSeparator && (
          <DateSeparator 
            date={item.timestamp} 
            customDateColor={currentWallpaper.dateTextColor}
            hasGradientBackground={!currentWallpaper.customBackground}
          />
        )}
        <ChatBubble
          message={item}
          onLongPress={() => handleLongPressMessage(item)}
          onReact={handleReaction}
          onReply={() => handleReply(item)}
          onDelete={() => handleDeleteMessage(item)}
          onUnsend={() => handleUnsendMessage(item)}
          onCopy={() => handleCopyMessage(item)}
          onPressMedia={openMediaPreview}
          showSenderInfo={showSenderInfo}
          enableSwipeToReply={!item.isUnsent}
          wallpaperGradient={currentWallpaper.gradient}
          wallpaperConfig={{
            senderBubbleColor: currentWallpaper.senderBubbleColor,
            receiverBubbleColor: currentWallpaper.receiverBubbleColor,
            senderTextColor: currentWallpaper.senderTextColor,
            receiverTextColor: currentWallpaper.receiverTextColor,
            useGradientForSender: currentWallpaper.useGradientForSender,
          }}
        />
      </>
    );
  }, [messages, currentWallpaper, handleLongPressMessage, handleReply, handleCopyMessage]);

  const renderFooter = useCallback(() => {
    if (!isTyping) return null;
    return <TypingIndicator />;
  }, [isTyping]);

  const handleContentSizeChange = useCallback(() => {
    if (shouldScrollToEnd && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
      setShouldScrollToEnd(false);
    }
  }, [shouldScrollToEnd]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    scrollOffsetRef.current = contentOffset.y;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    const isAtBottomNow = distanceFromBottom < 120;
    setIsAtBottom(isAtBottomNow);
    setShowScrollButton(!isAtBottomNow && distanceFromBottom > 200);
    
    // Count unread messages below current scroll position
    if (!isAtBottomNow) {
      const unreadBelow = messages.filter((msg, idx) => {
        // Simple heuristic: if message is below visible area
        return !msg.isMine && msg.status !== 'read';
      }).length;
      setUnreadCountBelowScroll(unreadBelow);
    } else {
      setUnreadCountBelowScroll(0);
    }
  }, [messages]);

  const handleMomentumEnd = useCallback(() => {
    if (scrollOffsetRef.current <= 24 && !fetchingMore && hasMore && messages.length > 0) {
      fetchMore();
    }
  }, [fetchMore, fetchingMore, hasMore, messages.length]);

  useEffect(() => {
    if (!isAtBottom || messages.length === 0) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.isMine || lastReadMessageIdRef.current === lastMessage.id) {
      return;
    }

    lastReadMessageIdRef.current = lastMessage.id;
    chatService.markRead(chatId, lastMessage.id).catch(() => {});
    socketService.sendMessageRead(chatId, lastMessage.id);
  }, [chatId, isAtBottom, messages]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        No messages yet
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
        Start the conversation by sending a message
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]} edges={['bottom']}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentWallpaper.customBackground || theme.background }]} edges={['bottom']}>
      {currentWallpaper.backgroundImage ? (
        // Use photo background if backgroundImage is specified
        <ImageBackground
          source={{ uri: currentWallpaper.backgroundImage }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        >
          {/* Optional overlay for better text readability */}
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]} />
        </ImageBackground>
      ) : currentWallpaper.customBackground ? (
        // Use solid color if customBackground is specified
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: currentWallpaper.customBackground }]} />
      ) : (
        // Use gradient otherwise
        <LinearGradient
          colors={currentWallpaper.gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          ListHeaderComponent={fetchingMore ? (
            <View style={styles.historyLoader}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : null}
          onContentSizeChange={handleContentSizeChange}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleMomentumEnd}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
            });
          }}
        />

        <MessageInput
          onSendMessage={handleSendMessage}
          onSendImage={handlePickImage}
          onSendVideo={handlePickVideo}
          onSendFile={handlePickFile}
          onSendVoice={handleSendVoice}
          onTyping={(typing: boolean) => {
            // Emit typing events without overwriting remote typing state
            try {
              socketService.sendTyping(chatId, typing);
            } catch {}
          }}
          replyTo={replyTo ? {
            id: replyTo.id,
            text: replyTo.text || '',
            senderName: replyTo.senderName || chatName,
          } : null}
          onCancelReply={() => setReplyTo(null)}
          defaultQuickEmoji={quickReactionEmoji}
          wallpaperGradient={currentWallpaper.gradient}
        />

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <View
            style={[
              styles.scrollToBottomButton,
              { backgroundColor: theme.primary }
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                flatListRef.current?.scrollToEnd({ animated: true });
                setShowScrollButton(false);
                setUnreadCountBelowScroll(0);
              }}
              style={styles.scrollToBottomTouchable}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-down" size={24} color="#fff" />
              {unreadCountBelowScroll > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.error }]}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadCountBelowScroll > 99 ? '99+' : unreadCountBelowScroll}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal
        visible={!!mediaPreview}
        transparent
        animationType="fade"
        onRequestClose={closeMediaPreview}
      >
        <View style={styles.mediaPreviewOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMediaPreview} />
          <View style={[styles.mediaPreviewCard, { backgroundColor: theme.card }]}
          >
            <TouchableOpacity
              style={[styles.previewCloseButton, { backgroundColor: theme.surface }]}
              onPress={closeMediaPreview}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>

            {mediaPreview?.type === 'image' && mediaPreview.uri && (
              <Image
                source={{ uri: mediaPreview.uri }}
                style={styles.mediaPreviewImage}
                resizeMode="contain"
              />
            )}

            {mediaPreview?.type === 'video' && mediaPreview.uri && (
              <VideoPreview uri={mediaPreview.uri} style={styles.mediaPreviewVideo} />
            )}

            {mediaPreview?.type === 'file' && (
              <View style={styles.mediaPreviewFile}>
                <Ionicons name="document-text-outline" size={48} color={theme.primary} />
                <Text style={[styles.mediaPreviewFileName, { color: theme.text }]}
                  numberOfLines={2}
                >
                  {mediaPreview?.name || 'Attachment'}
                </Text>
                {mediaPreview?.uri && (
                  <TouchableOpacity
                    style={[styles.mediaPreviewAction, { backgroundColor: theme.primary }]}
                    onPress={() => openAttachmentLink(mediaPreview.uri)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="open-outline" size={18} color="#fff" />
                    <Text style={styles.mediaPreviewActionText}>Open</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      <MessageReactions
        visible={showReactions}
        onClose={() => setShowReactions(false)}
        onSelectReaction={handleReaction}
        defaultEmoji={currentWallpaper.defaultEmoji}
      />

      {/* Message Actions Sheet */}
      <MessageActionsSheet
        visible={showActionsSheet}
        onClose={() => {
          setShowActionsSheet(false);
          setSelectedMessage(null);
        }}
        actions={selectedMessage ? getMessageActions(selectedMessage) : []}
        onSelectAction={handleMessageAction}
        messagePreview={
          selectedMessage
            ? {
                text: selectedMessage.text || 'Media message',
                isMine: selectedMessage.isMine,
              }
            : undefined
        }
      />

      {/* Chat Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => setShowOptionsModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.optionsModal, { backgroundColor: theme.card }]}>
            <TouchableOpacity
              style={[styles.optionItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowOptionsModal(false);
                navigation.navigate('ChatWallpaper', { 
                  chatId,
                  currentWallpaper: currentWallpaper.id,
                  onSelectWallpaper: (wallpaperId: string, customEmoji: string) => {
                    setCurrentWallpaper(getWallpaper(wallpaperId));
                    setQuickReactionEmoji(customEmoji);
                  }
                });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="color-palette-outline" size={22} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>Change Wallpaper</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowOptionsModal(false);
                navigation.navigate('ContactProfile', { 
                  chatId, 
                  chatName, 
                  chatAvatar, 
                  isOnline 
                });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={22} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowOptionsModal(false);
                navigation.navigate('SearchInChat', { chatName });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={22} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>Search in Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowOptionsModal(false);
                // Mute notifications
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-off-outline" size={22} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>Mute Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowOptionsModal(false);
                navigation.navigate('SharedMedia', { chatName, chatId });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="images-outline" size={22} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>Shared Media</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsModal(false);
                Alert.alert('Delete Chat', 'Are you sure you want to delete this chat?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive' },
                ]);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={22} color={theme.error} />
              <Text style={[styles.optionText, { color: theme.error }]}>Delete Chat</Text>
            </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerGradient: {
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 8,
  },
  headerTitleText: {
    flex: 1,
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    width: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  historyLoader: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  mediaPreviewCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 16,
  },
  previewCloseButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaPreviewImage: {
    width: '100%',
    height: 320,
    borderRadius: 12,
  },
  mediaPreviewVideo: {
    width: '100%',
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaPreviewFile: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 32,
  },
  mediaPreviewFileName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  mediaPreviewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 8,
  },
  mediaPreviewActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollToBottomTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
