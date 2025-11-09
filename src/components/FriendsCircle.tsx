import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  hasActiveStory: boolean;
  isOnline: boolean;
}

interface FriendsCircleProps {
  friends: Friend[];
  onFriendPress: (friend: Friend) => void;
}

export default function FriendsCircle({ friends, onFriendPress }: FriendsCircleProps) {
  const { theme } = useTheme();

  const renderFriendCircle = (friend: Friend) => (
    <TouchableOpacity
      key={friend.id}
      style={styles.friendItem}
      onPress={() => onFriendPress(friend)}
      activeOpacity={0.7}
    >
      {/* Story Border (if has active story) */}
      {friend.hasActiveStory && (
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53', '#FFA07A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.storyBorder}
        >
          <View style={[styles.storyBorderInner, { backgroundColor: theme.background }]} />
        </LinearGradient>
      )}

      {/* Avatar */}
      <View 
        style={[
          styles.avatar, 
          { backgroundColor: theme.surface },
          !friend.hasActiveStory && { borderWidth: 2, borderColor: theme.border }
        ]}
      >
        {friend.avatar ? (
          <View style={styles.avatarImage}>
            {/* TODO: Add Image component when actual avatar URLs are available */}
            <LinearGradient
              colors={theme.gradient}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>
                {friend.name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
        ) : (
          <LinearGradient
            colors={theme.gradient}
            style={styles.avatarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>
              {friend.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}
      </View>

      {/* Online Indicator */}
      {friend.isOnline && (
        <View
          style={[
            styles.onlineIndicator,
            { 
              backgroundColor: theme.success, 
              borderColor: theme.background 
            },
          ]}
        />
      )}

      {/* Story Indicator Icon (small camera icon overlay) */}
      {friend.hasActiveStory && (
        <View style={[styles.storyIcon, { backgroundColor: theme.primary }]}>
          <Ionicons name="eye" size={10} color="#fff" />
        </View>
      )}

      {/* Friend Name */}
      <Text 
        style={[styles.friendName, { color: theme.text }]} 
        numberOfLines={1}
      >
        {friend.name.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );

  if (friends.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {friends.map(renderFriendCircle)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  friendItem: {
    alignItems: 'center',
    width: 70,
  },
  storyBorder: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyBorderInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    top: 2,
    right: 9,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  storyIcon: {
    position: 'absolute',
    bottom: 20,
    right: 7,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
});
