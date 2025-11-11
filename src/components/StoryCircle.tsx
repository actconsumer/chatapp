import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { storyService } from '../services/story.service';
import { socketService } from '../services/socket.service';

export interface StoryCircleProps {
  userId: string;
  userName: string;
  userAvatar?: string;
  hasStory?: boolean;
  hasUnviewed?: boolean;
  isMyStory?: boolean;
  onPress: () => void;
  onAddStory?: () => void;
  showAddButton?: boolean;
}

export default function StoryCircle({
  userId,
  userName,
  userAvatar,
  hasStory = false,
  hasUnviewed = false,
  isMyStory = false,
  onPress,
  onAddStory,
  showAddButton = false,
}: StoryCircleProps) {
  const { theme } = useTheme();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserStories();
    subscribeToStoryEvents();

    return () => {
      unsubscribeFromStoryEvents();
    };
  }, [userId]);

  const loadUserStories = async () => {
    try {
      setLoading(true);
      // TODO: Connect to Firebase backend
      const mockStories: any[] = [];
      setStories(mockStories);
    } catch (error) {
      console.error('Failed to load user stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToStoryEvents = () => {
    // Listen for new stories from this user
    socketService.on('story:new', (data: any) => {
      if (data.userId === userId) {
        loadUserStories();
      }
    });

    // Listen for story deletions
    socketService.on('story:deleted', (data: any) => {
      if (data.userId === userId) {
        loadUserStories();
      }
    });

    // Listen for story views (if viewing own story)
    if (isMyStory) {
      socketService.on('story:viewed', (data: any) => {
        if (data.storyId && stories.some(s => s.id === data.storyId)) {
          loadUserStories();
        }
      });
    }
  };

  const unsubscribeFromStoryEvents = () => {
    socketService.off('story:new');
    socketService.off('story:deleted');
    socketService.off('story:viewed');
  };

  const handlePress = () => {
    if (showAddButton && isMyStory) {
      onAddStory?.();
    } else {
      onPress();
    }
  };

  const getDisplayName = () => {
    if (isMyStory) return 'Your Story';
    return userName.split(' ')[0]; // First name only
  };

  const renderAvatar = () => {
    if (userAvatar) {
      return (
        <Image
          source={{ uri: userAvatar }}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      );
    }

    // Fallback to initials with gradient
    const initials = userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <LinearGradient
        colors={theme.gradient}
        style={styles.avatarGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.initialsText}>{initials}</Text>
      </LinearGradient>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={styles.touchable}
        disabled={loading}
      >
        <View style={styles.avatarContainer}>
          {/* Story ring gradient */}
          {hasStory && (
            <LinearGradient
              colors={
                hasUnviewed
                  ? ['#F58529', '#DD2A7B', '#8134AF', '#515BD4']
                  : [theme.border, theme.border]
              }
              style={styles.storyRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.storyRingInner, { backgroundColor: theme.background }]}>
                {renderAvatar()}
              </View>
            </LinearGradient>
          )}

          {/* No story ring */}
          {!hasStory && (
            <View style={[styles.noStoryContainer, { borderColor: theme.border }]}>
              {renderAvatar()}
            </View>
          )}

          {/* Add button for own story */}
          {showAddButton && isMyStory && (
            <View style={[styles.addButton, { backgroundColor: theme.primary }]}>
              <Ionicons name="add" size={16} color="#fff" />
            </View>
          )}

          {/* Story count badge */}
          {hasStory && stories.length > 1 && (
            <View style={[styles.countBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.countText}>{stories.length}</Text>
            </View>
          )}
        </View>

        {/* User name */}
        <Text
          style={[styles.userName, { color: theme.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {getDisplayName()}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
  },
  touchable: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    width: 70,
    height: 70,
    marginBottom: 6,
  },
  storyRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 3,
  },
  storyRingInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    padding: 2,
    overflow: 'hidden',
  },
  noStoryContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  countText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 70,
  },
});
