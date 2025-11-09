import React, { useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/user.service';
import { socketService } from '../services/socket.service';

export interface AvatarProps {
  userId?: string;
  uri?: string;
  name?: string;
  size?: number;
  showOnlineIndicator?: boolean;
  showVerifiedBadge?: boolean;
  style?: ViewStyle;
  borderWidth?: number;
  borderColor?: string;
}

export default function Avatar({
  userId,
  uri,
  name = '',
  size = 50,
  showOnlineIndicator = false,
  showVerifiedBadge = false,
  style,
  borderWidth = 0,
  borderColor = '#fff',
}: AvatarProps) {
  const { theme } = useTheme();
  const [avatarUri, setAvatarUri] = useState<string | undefined>(uri);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && !uri) {
      loadUserAvatar();
    }
  }, [userId]);

  useEffect(() => {
    if (showOnlineIndicator && userId) {
      subscribeToPresence();
      checkOnlineStatus();
    }

    return () => {
      unsubscribeFromPresence();
    };
  }, [userId, showOnlineIndicator]);

  const loadUserAvatar = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const user = await userService.getUser(userId);
      if (user.avatar) {
        setAvatarUri(user.avatar);
      }
    } catch (error) {
      console.error('Failed to load user avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkOnlineStatus = async () => {
    if (!userId) return;

    try {
      // Check if user is online via presence system
      // For now, assume offline - will be updated via socket events
      setIsOnline(false);
    } catch (error) {
      console.error('Failed to check online status:', error);
    }
  };

  const subscribeToPresence = () => {
    if (!userId) return;

    socketService.on('user:online', (data: any) => {
      if (data.userId === userId) {
        setIsOnline(true);
      }
    });

    socketService.on('user:offline', (data: any) => {
      if (data.userId === userId) {
        setIsOnline(false);
      }
    });
  };

  const unsubscribeFromPresence = () => {
    socketService.off('user:online');
    socketService.off('user:offline');
  };

  const getInitials = () => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const indicatorSize = size * 0.25;
  const badgeSize = size * 0.3;

  return (
    <View style={[styles.container, style, { width: size, height: size }]}>
      <View
        style={[
          styles.avatarContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor,
          },
        ]}
      >
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={[
              styles.avatarImage,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={theme.gradient}
            style={[
              styles.gradientAvatar,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text
              style={[
                styles.initialsText,
                {
                  fontSize: size * 0.4,
                },
              ]}
            >
              {getInitials()}
            </Text>
          </LinearGradient>
        )}
      </View>

      {/* Online indicator */}
      {showOnlineIndicator && isOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              backgroundColor: theme.success,
              borderColor: theme.background,
              borderWidth: size > 40 ? 2 : 1,
            },
          ]}
        />
      )}

      {/* Verified badge */}
      {showVerifiedBadge && (
        <View
          style={[
            styles.verifiedBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: theme.primary,
              borderColor: theme.background,
              borderWidth: size > 40 ? 2 : 1,
            },
          ]}
        >
          <Ionicons
            name="checkmark"
            size={badgeSize * 0.6}
            color="#fff"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatarContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  gradientAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
