import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getChatPreferences } from '../../utils/chatStorage';
import { getWallpaper, DEFAULT_WALLPAPER } from '../../utils/wallpapers';
import { chatService, ChatParticipant, ChatSummary } from '../../services/chat.service';
import { userService, UserProfile } from '../../services/user.service';
import { privacyService } from '../../services/privacy.service';
import { moderationService } from '../../services/moderation.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWITCH_TRACK_DEFAULT = '#767577';

interface DirectContactInfoScreenProps {
  navigation: any;
  route: any;
  initialSummary: ChatSummary;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  uri: string;
}

const FALLBACK_NAME = 'Chat';

const mediaItems: MediaItem[] = [
  { id: '1', type: 'image', uri: 'https://picsum.photos/200/200?random=1' },
  { id: '2', type: 'image', uri: 'https://picsum.photos/200/200?random=2' },
  { id: '3', type: 'video', uri: 'https://picsum.photos/200/200?random=3' },
  { id: '4', type: 'image', uri: 'https://picsum.photos/200/200?random=4' },
  { id: '5', type: 'image', uri: 'https://picsum.photos/200/200?random=5' },
  { id: '6', type: 'image', uri: 'https://picsum.photos/200/200?random=6' },
];

export default function DirectContactInfoScreen({ navigation, route, initialSummary }: DirectContactInfoScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [chatSummary, setChatSummary] = useState<ChatSummary>(initialSummary);
  const [contactProfile, setContactProfile] = useState<UserProfile | null>(null);
  const [currentWallpaper, setCurrentWallpaper] = useState(DEFAULT_WALLPAPER);
  const [quickEmoji, setQuickEmoji] = useState('👍');
  const [loading, setLoading] = useState(!initialSummary);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(Boolean(initialSummary.isMuted));
  const [isFavorite, setIsFavorite] = useState(Boolean(initialSummary.isPinned));
  const [isBlocked, setIsBlocked] = useState(false);
  const [processingMute, setProcessingMute] = useState(false);
  const [processingFavorite, setProcessingFavorite] = useState(false);
  const [processingBlock, setProcessingBlock] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const params = route.params || {};
  const chatId: string | undefined = params.chatId || initialSummary?.id;
  const fallbackAvatar = params.chatAvatar as string | undefined;
  const fallbackIsOnline = params.isOnline as boolean | undefined;
  const fallbackName = params.chatName as string | undefined;

  const currentUserId = user?.id || params.currentUserId || null;

  const otherParticipant = useMemo<ChatParticipant | undefined>(() => {
    if (!chatSummary || !currentUserId) {
      return chatSummary?.participants?.[0];
    }
    return chatSummary.participants.find((participant) => participant.id !== currentUserId);
  }, [chatSummary, currentUserId]);

  const resolvedChatName = useMemo(() => {
    return (
      contactProfile?.displayName ||
      otherParticipant?.displayName ||
      otherParticipant?.username ||
      fallbackName ||
      chatSummary?.name ||
      FALLBACK_NAME
    );
  }, [contactProfile, otherParticipant, fallbackName, chatSummary]);

  const resolvedAvatar = useMemo(() => {
    return contactProfile?.avatar || otherParticipant?.avatar || chatSummary?.avatar || fallbackAvatar;
  }, [contactProfile, otherParticipant, chatSummary, fallbackAvatar]);

  const resolvedOnlineStatus = useMemo(() => {
    return Boolean(otherParticipant?.isOnline ?? fallbackIsOnline ?? false);
  }, [otherParticipant, fallbackIsOnline]);

  const getInitials = (name: string): string => {
    if (!name) {
      return '?';
    }
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (name: string): string => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
  };

  const assignSummary = useCallback((summary: ChatSummary) => {
    setChatSummary(summary);
    setIsMuted(Boolean(summary.isMuted));
    setIsFavorite(Boolean(summary.isPinned));
  }, []);

  const refreshSummary = useCallback(async () => {
    if (!chatId) {
      return;
    }
    try {
      const refreshed = await chatService.get(chatId);
      assignSummary(refreshed);
      setErrorMessage(null);
    } catch (error: any) {
      console.error('DirectContactInfoScreen refreshSummary error:', error);
      setErrorMessage(error?.message || 'Failed to refresh conversation state');
    }
  }, [chatId, assignSummary]);

  const loadWallpaperPreferences = useCallback(async () => {
    if (!chatId) {
      return;
    }
    try {
      const preferences = await getChatPreferences(chatId);
      if (preferences) {
        setCurrentWallpaper(getWallpaper(preferences.wallpaperId));
        setQuickEmoji(preferences.customEmoji);
      } else {
        setCurrentWallpaper(DEFAULT_WALLPAPER);
        setQuickEmoji(DEFAULT_WALLPAPER.defaultEmoji);
      }
    } catch (error) {
      console.error('DirectContactInfoScreen wallpaper error:', error);
    }
  }, [chatId]);

  const loadContactProfile = useCallback(async () => {
    if (!otherParticipant?.id) {
      setContactProfile(null);
      setIsBlocked(false);
      return;
    }

    try {
      const [profile, blockedUsers] = await Promise.all([
        userService.getUser(otherParticipant.id),
        privacyService.getBlockedUsers(),
      ]);

      setContactProfile(profile);
      setIsBlocked(blockedUsers.some((blocked) => blocked.id === otherParticipant.id));
    } catch (error) {
      console.error('DirectContactInfoScreen profile load error:', error);
    }
  }, [otherParticipant]);

  useEffect(() => {
    assignSummary(initialSummary);
    setLoading(false);
  }, [initialSummary, assignSummary]);

  useEffect(() => {
    void loadWallpaperPreferences();
  }, [loadWallpaperPreferences]);

  useEffect(() => {
    void loadContactProfile();
  }, [loadContactProfile]);

  useFocusEffect(
    useCallback(() => {
      void refreshSummary();
      void loadWallpaperPreferences();
      return undefined;
    }, [refreshSummary, loadWallpaperPreferences])
  );

  const handleToggleMute = async () => {
    if (!chatId) {
      return;
    }

    try {
      setProcessingMute(true);
      const nextMutedState = !isMuted;
      await chatService.toggleMute(chatId);
      await refreshSummary();
      Alert.alert(
        nextMutedState ? 'Notifications Muted' : 'Notifications Enabled',
        nextMutedState
          ? `You won't receive notifications from ${resolvedChatName}.`
          : `You will now receive notifications from ${resolvedChatName}.`
      );
    } catch (error) {
      console.error('DirectContactInfoScreen toggle mute error:', error);
      Alert.alert('Error', 'Unable to update notification settings.');
    } finally {
      setProcessingMute(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!chatId) {
      return;
    }

    try {
      setProcessingFavorite(true);
      const updated = await chatService.togglePin(chatId);
      assignSummary(updated);
      Alert.alert(
        updated.isPinned ? 'Added to Favorites' : 'Removed from Favorites',
        updated.isPinned
          ? `${resolvedChatName} has been added to favorites.`
          : `${resolvedChatName} has been removed from favorites.`
      );
    } catch (error) {
      console.error('DirectContactInfoScreen toggle favorite error:', error);
      Alert.alert('Error', 'Unable to update favorite status.');
    } finally {
      setProcessingFavorite(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!otherParticipant?.id) {
      Alert.alert('Error', 'Unable to determine who to block.');
      return;
    }

    try {
      setProcessingBlock(true);
      if (isBlocked) {
        await privacyService.unblockUser(otherParticipant.id);
        setIsBlocked(false);
        Alert.alert('Unblocked', `${resolvedChatName} has been unblocked.`);
      } else {
        await privacyService.blockUser(otherParticipant.id);
        setIsBlocked(true);
        Alert.alert('Blocked', `${resolvedChatName} has been blocked.`);
      }
    } catch (error) {
      console.error('DirectContactInfoScreen block error:', error);
      Alert.alert('Error', 'Failed to update block status.');
    } finally {
      setProcessingBlock(false);
    }
  };

  const submitReport = async () => {
    if (!chatId || !otherParticipant?.id) {
      return;
    }

    try {
      setReporting(true);
      await moderationService.reportUser(otherParticipant.id, {
        reason: 'user_report',
        chatId,
      });
      Alert.alert('Report Submitted', 'Our moderation team will review this conversation.');
    } catch (error) {
      console.error('DirectContactInfoScreen report error:', error);
      Alert.alert('Error', 'Unable to submit report. Please try again later.');
    } finally {
      setReporting(false);
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report Contact',
      'Report this conversation to our moderation team?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => void submitReport() },
      ]
    );
  };

  const handleExportChat = () => {
    setShowOptionsModal(false);
    Alert.alert(
      'Export Chat',
      'Choose export format',
      [
        {
          text: 'Text File (.txt)',
          onPress: () => Alert.alert('Success', 'Chat exported as text file. Download will be available in production.'),
        },
        {
          text: 'PDF Document',
          onPress: () => Alert.alert('Success', 'Chat exported as PDF. Download will be available in production.'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleClearChat = () => {
    setShowOptionsModal(false);
    Alert.alert('Clear Chat', 'Are you sure you want to clear all messages?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => Alert.alert('Chat Cleared', 'Messages will be removed once server support is available.'),
      },
    ]);
  };

  const handleVoiceCall = () => {
    navigation.navigate('VoiceCall', {
      callId: Date.now().toString(),
      calleeId: chatId,
      calleeName: resolvedChatName,
      calleeAvatar: resolvedAvatar,
      isIncoming: false,
    });
  };

  const handleVideoCall = () => {
    navigation.navigate('VideoCall', {
      callId: Date.now().toString(),
      calleeId: chatId,
      calleeName: resolvedChatName,
      calleeAvatar: resolvedAvatar,
      isIncoming: false,
    });
  };

  if (!chatId) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <Text style={[styles.errorText, { color: theme.error }]}>Missing conversation identifier.</Text>
      </SafeAreaView>
    );
  }

  if (loading && !chatSummary) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  const wallpaperColors = (currentWallpaper.gradient ?? [theme.surface, theme.surface]) as string[];

  const renderInfoRow = (icon: any, label: string, value: string) => (
    <View style={styles.infoItem}>
      <View style={[styles.infoIconContainer, { backgroundColor: `${theme.primary}1A` }]}
      >
        <Ionicons name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('profile.contactInfo')}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigation.navigate('SearchInChat', { chatId, chatName: resolvedChatName })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="search" size={22} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setShowOptionsModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        {errorMessage ? (
          <View style={[styles.errorBanner, { backgroundColor: `${theme.error}22`, borderColor: theme.error }]}
          >
            <Ionicons name="warning" size={18} color={theme.error} style={styles.errorIcon} />
            <Text style={[styles.errorMessage, { color: theme.error }]}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {resolvedAvatar ? (
              <Image source={{ uri: resolvedAvatar }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: getAvatarColor(resolvedChatName) }]}
              >
                <Text style={styles.avatarInitials}>{getInitials(resolvedChatName)}</Text>
              </View>
            )}
            {resolvedOnlineStatus ? <View style={[styles.onlineStatus, { borderColor: theme.card }]} /> : null}
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{resolvedChatName}</Text>
          <Text style={[styles.status, { color: theme.textSecondary }]}>
            {resolvedOnlineStatus ? t('chat.online') : t('chat.offline')}
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primary }]} onPress={handleVoiceCall}>
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.actionLabel}>{t('chat.call')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primary }]} onPress={handleVideoCall}>
              <Ionicons name="videocam" size={20} color="#fff" />
              <Text style={styles.actionLabel}>{t('chat.videoCall')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.surface }]}
              onPress={() => navigation.navigate('SharedMedia', { chatName: resolvedChatName })}
            >
              <Ionicons name="images" size={20} color={theme.text} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>{t('chat.media')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('profile.about')}</Text>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Ionicons name="information-circle-outline" size={22} color={theme.textSecondary} />
            <Text style={[styles.cardText, { color: theme.text }]}>
              {contactProfile?.bio || "Hey there! I'm using this messenger app 🎉"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Chat Theme</Text>
          <TouchableOpacity
            style={[styles.wallpaperCard, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate('ChatWallpaper', { chatId, currentWallpaper: currentWallpaper.id })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={wallpaperColors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.wallpaperGradient}
            >
              <Ionicons name="chatbubbles" size={32} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
            <View style={styles.wallpaperDetails}>
              <Text style={[styles.wallpaperName, { color: theme.text }]}>{currentWallpaper.name}</Text>
              <Text style={[styles.wallpaperMeta, { color: theme.textSecondary }]}>Quick Reaction: {quickEmoji}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Information</Text>
          <View style={[styles.infoContainer, { backgroundColor: theme.surface }]}
          >
            {renderInfoRow('call-outline', 'Phone', contactProfile?.phoneNumber || 'Not available')}
            {renderInfoRow('mail-outline', 'Email', contactProfile?.email || 'Not available')}
            {renderInfoRow('location-outline', 'Location', contactProfile?.bio || 'Not available')}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Shared Media</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SharedMedia', { chatName: resolvedChatName })}>
              <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mediaGrid}>
            {mediaItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.mediaItem} activeOpacity={0.75}>
                <Image source={{ uri: item.uri }} style={styles.mediaImage} />
                {item.type === 'video' ? (
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play-circle" size={32} color="#fff" />
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Settings</Text>
          <View style={[styles.infoContainer, { backgroundColor: theme.surface }]}
          >
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => void handleToggleMute()}
              disabled={processingMute}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isMuted ? 'notifications-off-outline' : 'notifications-outline'}
                size={22}
                color={isMuted ? theme.error : theme.text}
              />
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
              </Text>
              <Switch
                value={isMuted}
                onValueChange={() => void handleToggleMute()}
                trackColor={{ false: SWITCH_TRACK_DEFAULT, true: theme.primary }}
                thumbColor={isMuted ? theme.primary : '#f4f3f4'}
                disabled={processingMute}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => void handleToggleFavorite()}
              disabled={processingFavorite}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={22}
                color={isFavorite ? '#FFD700' : theme.text}
              />
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Text>
              <Switch
                value={isFavorite}
                onValueChange={() => void handleToggleFavorite()}
                trackColor={{ false: SWITCH_TRACK_DEFAULT, true: '#FFD700' }}
                thumbColor={isFavorite ? '#FFD700' : '#f4f3f4'}
                disabled={processingFavorite}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <View style={[styles.infoContainer, { backgroundColor: theme.surface }]}
          >
            <TouchableOpacity
              style={styles.dangerRow}
              onPress={() => void handleBlockToggle()}
              disabled={processingBlock}
              activeOpacity={0.7}
            >
              <Ionicons name="person-remove-outline" size={22} color={theme.error} />
              <Text style={[styles.dangerLabel, { color: theme.error }]}>
                {isBlocked ? t('chat.unblock') : t('chat.block')}
              </Text>
              {processingBlock ? <ActivityIndicator size="small" color={theme.error} /> : null}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dangerRow}
              onPress={handleReport}
              disabled={reporting}
              activeOpacity={0.7}
            >
              <Ionicons name="ban-outline" size={22} color={theme.error} />
              <Text style={[styles.dangerLabel, { color: theme.error }]}>{t('chat.report')}</Text>
              {reporting ? <ActivityIndicator size="small" color={theme.error} /> : null}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('common.legal')}</Text>
          <View style={[styles.infoContainer, { backgroundColor: theme.surface }]}
          >
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('TermsOfService')}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={22} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t('auth.termsOfService')}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('PrivacyPolicy')}
              activeOpacity={0.7}
            >
              <Ionicons name="shield-checkmark-outline" size={22} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t('auth.privacyPolicy')}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowOptionsModal(false)}>
          <View style={[styles.optionsModal, { backgroundColor: theme.card }]}
          >
            <TouchableOpacity
              style={[styles.optionItem, { borderBottomColor: theme.border }]}
              onPress={handleExportChat}
              activeOpacity={0.7}
            >
              <Ionicons name="download-outline" size={22} color={theme.text} />
              <Text style={[styles.optionLabel, { color: theme.text }]}>Export Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, { borderBottomColor: theme.border }]}
              onPress={handleClearChat}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={22} color={theme.text} />
              <Text style={[styles.optionLabel, { color: theme.text }]}>Clear Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowOptionsModal(false);
                Alert.alert(
                  isBlocked ? 'Unblock Contact' : 'Block Contact',
                  isBlocked
                    ? 'Unblock this contact?'
                    : 'Are you sure you want to block this contact?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: isBlocked ? 'Unblock' : 'Block',
                      style: 'destructive',
                      onPress: () => void handleBlockToggle(),
                    },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="ban-outline" size={22} color={theme.error} />
              <Text style={[styles.optionLabel, { color: theme.error }]}>
                {isBlocked ? t('chat.unblock') : t('chat.block')}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorMessage: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 44,
    fontWeight: '700',
    color: '#fff',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22C55E',
    borderWidth: 3,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  status: {
    fontSize: 14,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  cardText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  wallpaperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  wallpaperGradient: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wallpaperDetails: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  wallpaperName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  wallpaperMeta: {
    fontSize: 14,
  },
  infoContainer: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 126, 255, 0.1)',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  mediaItem: {
    width: (SCREEN_WIDTH - 40) / 3,
    height: (SCREEN_WIDTH - 40) / 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 14,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 14,
  },
  dangerLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  optionsModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});
