import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SIZES } from '../../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { storyService, Story as ApiStory } from '../../services/story.service';
import { socketService } from '../../services/socket.service';

const { width } = Dimensions.get('window');
const STORY_SIZE = (width - 48) / 3;

interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  media: string;
  type: 'image' | 'video';
  timestamp: number;
  viewed: boolean;
}

interface StoryListScreenProps {
  navigation: any;
}

export default function StoryListScreen({ navigation }: StoryListScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [myStories, setMyStories] = useState<Story[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ userName: string; userAvatar?: string } | null>(null);
  const notificationOpacity = useState(new Animated.Value(0))[0];
  const notificationTranslateY = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    let mounted = true;
    const mapStory = (s: ApiStory): Story => ({
      id: s.id,
      userId: s.userId,
      userName: s.userName || 'User',
      userAvatar: s.userAvatar,
      media: s.media.type === 'text' ? '' : s.media.url,
      type: s.media.type === 'video' ? 'video' : 'image',
      timestamp: new Date(s.createdAt).getTime(),
      viewed: !!s.hasViewed,
    });
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [mine, list] = await Promise.all([
          storyService.myStories().catch(() => []),
          storyService.list().catch(() => []),
        ]);
        if (!mounted) return;
        setMyStories(mine.map(mapStory));
        setStories(list.map(mapStory));
        try {
          if (!socketService.isConnected()) await socketService.connect();
          socketService.on('story:new', (data: any) => {
            const s = mapStory({
              id: data.id,
              userId: data.userId,
              userName: data.userName,
              userAvatar: data.userAvatar,
              media: { url: data.mediaUrl, type: data.type },
              createdAt: data.createdAt,
              expiresAt: data.expiresAt,
              viewsCount: 0,
              hasViewed: false,
            } as any);
            setStories(prev => [s, ...prev]);
            
            // Show in-app notification
            showStoryNotification(data.userName, data.userAvatar);
          });
        } catch {}
      } catch (e: any) {
        if (!mounted) return;
        setError(e.message || 'Failed to load stories');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const showStoryNotification = (userName: string, userAvatar?: string) => {
    setNotification({ userName, userAvatar });
    
    // Animate in
    Animated.parallel([
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(notificationTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      hideNotification();
    }, 3000);
  };

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(notificationOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(notificationTranslateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setNotification(null);
    });
  };

  const navigateToCreateStory = () => {
    navigation.navigate('CreateStory');
  };

  const renderStoryItem = ({ item }: { item: Story }) => (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={() => navigation.navigate('StoryViewer', { storyId: item.id })}
    >
      <View style={styles.storyImageContainer}>
        <Image source={{ uri: item.media }} style={styles.storyImage} />
        {item.type === 'video' && (
          <View style={styles.videoIndicator}>
            <Ionicons name="play-circle" size={32} color="#fff" />
          </View>
        )}
        {!item.viewed && (
          <LinearGradient
            colors={theme.gradient}
            style={styles.storyBorder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        {item.viewed && <View style={[styles.viewedBorder, { borderColor: theme.border }]} />}
      </View>
      <View style={styles.storyUserContainer}>
        {item.userAvatar ? (
          <Image source={{ uri: item.userAvatar }} style={styles.storyAvatar} />
        ) : (
          <View style={[styles.storyAvatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{item.userName.charAt(0)}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.storyUserName, { color: theme.text }]} numberOfLines={1}>
        {item.userName}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* In-App Story Notification Banner */}
      {notification && (
        <Animated.View
          style={[
            styles.notificationBanner,
            {
              backgroundColor: theme.surface,
              opacity: notificationOpacity,
              transform: [{ translateY: notificationTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.notificationContent}
            onPress={hideNotification}
            activeOpacity={0.9}
          >
            {notification.userAvatar ? (
              <Image
                source={{ uri: notification.userAvatar }}
                style={styles.notificationAvatar}
              />
            ) : (
              <View style={[styles.notificationAvatar, { backgroundColor: theme.primary }]}>
                <Text style={styles.notificationAvatarText}>
                  {notification.userName.charAt(0)}
                </Text>
              </View>
            )}
            <View style={styles.notificationTextContainer}>
              <Text style={[styles.notificationTitle, { color: theme.text }]} numberOfLines={1}>
                {notification.userName}
              </Text>
              <Text style={[styles.notificationBody, { color: theme.textSecondary }]}>
                {t('story.postedNewStory')}
              </Text>
            </View>
            <Ionicons name="camera" size={20} color={theme.primary} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('story.viewStory')}</Text>
        <TouchableOpacity onPress={navigateToCreateStory}>
          <Ionicons name="camera-outline" size={28} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {error && (
          <Text style={{ color: theme.error, paddingHorizontal: SIZES.padding, paddingTop: 12 }}>
            {error}
          </Text>
        )}
        {/* My Story Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('story.yourStory')}</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.myStoryScroll}>
            {/* Create Story Button */}
            <TouchableOpacity style={styles.createStoryItem} onPress={navigateToCreateStory}>
              <View style={[styles.createStoryImageContainer, { backgroundColor: theme.surface }]}>
                <LinearGradient
                  colors={theme.gradient}
                  style={styles.createStoryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="add" size={32} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={[styles.createStoryText, { color: theme.text }]}>{t('story.createStory')}</Text>
            </TouchableOpacity>

            {/* My Stories */}
            {myStories.map((story) => (
              <TouchableOpacity
                key={story.id}
                style={styles.myStoryItem}
                onPress={() => navigation.navigate('StoryViewer', { storyId: story.id })}
              >
                <Image source={{ uri: story.media }} style={styles.myStoryImage} />
                <View style={styles.myStoryOverlay}>
                  <View style={[styles.myStoryBadge, { backgroundColor: theme.primary }]}>
                    <Ionicons name="eye" size={14} color="#fff" />
                    <Text style={styles.myStoryViewCount}>24</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Friends Stories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('story.recentUpdates')}</Text>
            <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>
              {stories.filter((s) => !s.viewed).length} {t('common.new')}
            </Text>
          </View>

          <FlatList
            data={stories}
            renderItem={renderStoryItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={styles.storyRow}
            contentContainerStyle={styles.storiesGrid}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
  },
  sectionCount: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  myStoryScroll: {
    paddingLeft: SIZES.padding,
  },
  createStoryItem: {
    marginRight: 12,
    alignItems: 'center',
  },
  createStoryImageContainer: {
    width: 100,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  createStoryGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createStoryText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  myStoryItem: {
    width: 100,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  myStoryImage: {
    width: '100%',
    height: '100%',
  },
  myStoryOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  myStoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  myStoryViewCount: {
    color: '#fff',
    fontSize: SIZES.tiny,
    fontWeight: 'bold',
  },
  storiesGrid: {
    paddingHorizontal: SIZES.padding - 6,
  },
  storyRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  storyItem: {
    width: STORY_SIZE,
    alignItems: 'center',
  },
  storyImageContainer: {
    width: STORY_SIZE,
    height: STORY_SIZE * 1.3,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  storyBorder: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 19,
    zIndex: -1,
  },
  viewedBorder: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 19,
    borderWidth: 3,
    zIndex: -1,
  },
  storyUserContainer: {
    position: 'absolute',
    bottom: 32,
    left: 8,
  },
  storyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: SIZES.tiny,
    fontWeight: 'bold',
  },
  storyUserName: {
    fontSize: SIZES.small,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Notification Banner Styles
  notificationBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    left: SIZES.padding,
    right: SIZES.padding,
    zIndex: 1000,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  notificationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  notificationBody: {
    fontSize: SIZES.small,
  },
});
