import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
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
import { moderationService } from '../../services/moderation.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWITCH_TRACK_DEFAULT = '#767577';

interface GroupContactInfoScreenProps {
  navigation: any;
  route: any;
  initialSummary: ChatSummary;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  uri: string;
}

const mediaItems: MediaItem[] = [
  { id: '1', type: 'image', uri: 'https://picsum.photos/200/200?random=11' },
  { id: '2', type: 'image', uri: 'https://picsum.photos/200/200?random=12' },
  { id: '3', type: 'video', uri: 'https://picsum.photos/200/200?random=13' },
  { id: '4', type: 'image', uri: 'https://picsum.photos/200/200?random=14' },
  { id: '5', type: 'image', uri: 'https://picsum.photos/200/200?random=15' },
  { id: '6', type: 'image', uri: 'https://picsum.photos/200/200?random=16' },
];

const getInitials = (name: string): string => {
  if (!name) {
    return 'GR';
  }
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const getAvatarColor = (name: string): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#045de9', '#A29BFE', '#FDCB6E', '#00B894'];
  const charCode = name ? name.charCodeAt(0) : 0;
  return colors[charCode % colors.length];
};

export default function GroupContactInfoScreen({ navigation, route, initialSummary }: GroupContactInfoScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [groupSummary, setGroupSummary] = useState<ChatSummary>(initialSummary);
  const [currentWallpaper, setCurrentWallpaper] = useState(DEFAULT_WALLPAPER);
  const [quickEmoji, setQuickEmoji] = useState('👍');
  const [loading, setLoading] = useState(!initialSummary);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingMute, setProcessingMute] = useState(false);
  const [processingFavorite, setProcessingFavorite] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const params = route.params || {};
  const chatId: string | undefined = params.chatId || initialSummary?.id;
  const fallbackName = params.chatName as string | undefined;
  const fallbackAvatar = params.chatAvatar as string | undefined;
  const currentUserId = user?.id || params.currentUserId || null;

  const participants = useMemo<ChatParticipant[]>(() => groupSummary?.participants || [], [groupSummary]);
  const totalParticipants = participants.length;

  const isCurrentUserAdmin = useMemo(() => {
    if (!currentUserId) {
      return false;
    }
    return participants.some((participant) => participant.id === currentUserId && participant.role === 'admin');
  }, [participants, currentUserId]);

  const assignSummary = useCallback((summary: ChatSummary) => {
    setGroupSummary(summary);
  }, []);

  const resolvedGroupName = groupSummary?.name || fallbackName || 'Group';
  const resolvedGroupAvatar = groupSummary?.avatar || fallbackAvatar;

  const refreshGroupSummary = useCallback(async () => {
    if (!chatId) {
      return;
    }

    try {
      const refreshed = await chatService.get(chatId);
      assignSummary(refreshed);
      setErrorMessage(null);
    } catch (error: any) {
      console.error('GroupContactInfoScreen refresh error:', error);
      setErrorMessage(error?.message || 'Failed to refresh group data');
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
      console.error('GroupContactInfoScreen wallpaper error:', error);
    }
  }, [chatId]);

  useEffect(() => {
    assignSummary(initialSummary);
    setLoading(false);
  }, [initialSummary, assignSummary]);

  useEffect(() => {
    void loadWallpaperPreferences();
  }, [loadWallpaperPreferences]);

  useFocusEffect(
    useCallback(() => {
      void refreshGroupSummary();
      void loadWallpaperPreferences();
      return undefined;
    }, [refreshGroupSummary, loadWallpaperPreferences])
  );

  const handleToggleMute = async () => {
    if (!chatId) {
      return;
    }

    try {
      setProcessingMute(true);
      const nextMutedState = !Boolean(groupSummary?.isMuted);
      await chatService.toggleMute(chatId);
      await refreshGroupSummary();
      Alert.alert(
        nextMutedState ? 'Notifications Muted' : 'Notifications Enabled',
        nextMutedState
          ? `You won't receive notifications from ${resolvedGroupName}.`
          : `You will now receive notifications from ${resolvedGroupName}.`
      );
    } catch (error) {
      console.error('GroupContactInfoScreen mute error:', error);
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
          ? `${resolvedGroupName} has been added to favorites.`
          : `${resolvedGroupName} has been removed from favorites.`
      );
    } catch (error) {
      console.error('GroupContactInfoScreen favorite error:', error);
      Alert.alert('Error', 'Unable to update favorite status.');
    } finally {
      setProcessingFavorite(false);
    }
  };

  const submitReport = async () => {
    if (!chatId) {
      return;
    }

    try {
      setReporting(true);
      await moderationService.reportChat(chatId, { reason: 'group_report' });
      Alert.alert('Report Submitted', 'Our moderation team will review this group conversation.');
    } catch (error) {
      console.error('GroupContactInfoScreen report error:', error);
      Alert.alert('Error', 'Unable to submit report right now.');
    } finally {
      setReporting(false);
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report Group',
      'Report this group conversation to our moderation team?',
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

  const handleOpenGroupManagement = () => {
    if (!chatId) {
      return;
    }

    navigation.navigate('GroupManagement', {
      groupId: chatId,
      groupName: resolvedGroupName,
      groupPhoto: resolvedGroupAvatar,
      participants,
      isAdmin: isCurrentUserAdmin,
      currentUserId,
    });
  };

  const handleVoiceCall = () => {
    navigation.navigate('VoiceCall', {
      callId: Date.now().toString(),
      calleeId: chatId,
      calleeName: resolvedGroupName,
      calleeAvatar: resolvedGroupAvatar,
      isIncoming: false,
    });
  };

  const handleVideoCall = () => {
    navigation.navigate('VideoCall', {
      callId: Date.now().toString(),
      calleeId: chatId,
      calleeName: resolvedGroupName,
      calleeAvatar: resolvedGroupAvatar,
      isIncoming: false,
    });
  };

  if (!chatId) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <Text style={[styles.errorText, { color: theme.error }]}>Missing group identifier.</Text>
      </SafeAreaView>
    );
  }

  if (loading && !groupSummary) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  const wallpaperColors = (currentWallpaper.gradient ?? [theme.surface, theme.surface]) as string[];

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
              onPress={() => navigation.navigate('SearchInChat', { chatId, chatName: resolvedGroupName })}
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
            {resolvedGroupAvatar ? (
              <Image source={{ uri: resolvedGroupAvatar }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: getAvatarColor(resolvedGroupName) }]}
              >
                <Text style={styles.avatarInitials}>{getInitials(resolvedGroupName)}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{resolvedGroupName}</Text>
          <Text style={[styles.status, { color: theme.textSecondary }]}>{`${totalParticipants} participants`}</Text>
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
              onPress={handleOpenGroupManagement}
            >
              <Ionicons name="people" size={20} color={theme.text} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Members</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('profile.about')}</Text>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Ionicons name="information-circle-outline" size={22} color={theme.textSecondary} />
            <Text style={[styles.cardText, { color: theme.text }]}>
              {groupSummary?.description || 'No group description has been added yet.'}
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
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Group Details</Text>
          <View style={[styles.infoContainer, { backgroundColor: theme.surface }]}>
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={20} color={theme.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>{`${totalParticipants} members`}</Text>
              {isCurrentUserAdmin ? (
                <TouchableOpacity style={styles.manageButton} onPress={handleOpenGroupManagement}>
                  <Text style={[styles.manageLabel, { color: theme.primary }]}>Manage</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                {isCurrentUserAdmin ? 'You are an admin' : 'Member'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Shared Media</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SharedMedia', { chatName: resolvedGroupName })}>
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
          <View style={[styles.infoContainer, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => void handleToggleMute()}
              disabled={processingMute}
              activeOpacity={0.7}
            >
              <Ionicons
                name={groupSummary?.isMuted ? 'notifications-off-outline' : 'notifications-outline'}
                size={22}
                color={groupSummary?.isMuted ? theme.error : theme.text}
              />
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                {groupSummary?.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
              </Text>
              <Switch
                value={Boolean(groupSummary?.isMuted)}
                onValueChange={() => void handleToggleMute()}
                trackColor={{ false: SWITCH_TRACK_DEFAULT, true: theme.primary }}
                thumbColor={groupSummary?.isMuted ? theme.primary : '#f4f3f4'}
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
                name={groupSummary?.isPinned ? 'star' : 'star-outline'}
                size={22}
                color={groupSummary?.isPinned ? '#FFD700' : theme.text}
              />
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                {groupSummary?.isPinned ? 'Remove from Favorites' : 'Add to Favorites'}
              </Text>
              <Switch
                value={Boolean(groupSummary?.isPinned)}
                onValueChange={() => void handleToggleFavorite()}
                trackColor={{ false: SWITCH_TRACK_DEFAULT, true: '#FFD700' }}
                thumbColor={groupSummary?.isPinned ? '#FFD700' : '#f4f3f4'}
                disabled={processingFavorite}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <View style={[styles.infoContainer, { backgroundColor: theme.surface }]}>
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
          <View style={[styles.infoContainer, { backgroundColor: theme.surface }]}>
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
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsModal(false);
                handleReport();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="ban-outline" size={22} color={theme.error} />
              <Text style={[styles.optionLabel, { color: theme.error }]}>{t('chat.report')}</Text>
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
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  manageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 126, 255, 0.12)',
  },
  manageLabel: {
    fontSize: 13,
    fontWeight: '600',
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
