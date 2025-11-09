/**
 * Developer Navigation Screen
 * Temporary screen to test all app screens without backend
 * Remove this before production deployment
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

interface DevNavigationScreenProps {
  navigation: any;
}

interface ScreenRoute {
  name: string;
  screen: string;
  params?: any;
  icon: string;
  category: string;
  description: string;
}

const SCREEN_ROUTES: ScreenRoute[] = [
  // Auth & Main
  {
    name: 'Chat List',
    screen: 'Main',
    icon: 'chatbubbles',
    category: 'Main Navigation',
    description: 'Main chat list screen with conversations',
  },
  
  // Chat Screens
  {
    name: 'Chat Room',
    screen: 'ChatRoom',
    params: { 
      chatId: 'demo-chat-1',
      chatName: 'John Doe',
      chatAvatar: 'https://i.pravatar.cc/150?img=1',
    },
    icon: 'chatbubble',
    category: 'Chat',
    description: 'Individual chat conversation',
  },
  {
    name: 'Group Chat',
    screen: 'ChatRoom',
    params: { 
      chatId: 'demo-group-1',
      chatName: 'Project Team',
      chatAvatar: 'https://i.pravatar.cc/150?img=10',
      isGroup: true,
    },
    icon: 'people',
    category: 'Chat',
    description: 'Group chat conversation',
  },
  {
    name: 'Chat Wallpaper',
    screen: 'ChatWallpaper',
    icon: 'image',
    category: 'Chat',
    description: 'Change chat background',
  },
  {
    name: 'Group Management',
    screen: 'GroupManagement',
    params: {
      groupId: 'demo-group-1',
      groupName: 'Project Team',
    },
    icon: 'settings',
    category: 'Chat',
    description: 'Manage group settings',
  },

  // Call Screens
  {
    name: 'Voice Call',
    screen: 'VoiceCall',
    params: {
      chatId: 'demo-chat-1',
      chatName: 'John Doe',
      chatAvatar: 'https://i.pravatar.cc/150?img=1',
    },
    icon: 'call',
    category: 'Calls',
    description: 'Voice call interface',
  },
  {
    name: 'Video Call',
    screen: 'VideoCall',
    params: {
      chatId: 'demo-chat-1',
      chatName: 'John Doe',
      chatAvatar: 'https://i.pravatar.cc/150?img=1',
    },
    icon: 'videocam',
    category: 'Calls',
    description: 'Video call interface',
  },
  {
    name: 'Call Settings',
    screen: 'CallSettings',
    icon: 'settings-outline',
    category: 'Calls',
    description: 'Adjust call quality settings',
  },

  // Stories
  {
    name: 'Story List',
    screen: 'Main',
    icon: 'play-circle',
    category: 'Stories',
    description: 'View all stories',
  },
  {
    name: 'Create Story',
    screen: 'MediaPicker',
    icon: 'add-circle',
    category: 'Stories',
    description: 'Create new story',
  },
  {
    name: 'Story Viewer',
    screen: 'StoryViewer',
    params: {
      userId: 'demo-user-1',
      userName: 'John Doe',
    },
    icon: 'eye',
    category: 'Stories',
    description: 'View user story',
  },

  // Profile & Settings
  {
    name: 'My Profile',
    screen: 'Main',
    icon: 'person',
    category: 'Profile',
    description: 'Your profile screen',
  },
  {
    name: 'Edit Profile',
    screen: 'EditProfile',
    icon: 'create',
    category: 'Profile',
    description: 'Edit profile information',
  },
  {
    name: 'Contact Profile',
    screen: 'ContactProfile',
    params: {
      userId: 'demo-user-1',
      userName: 'John Doe',
      userAvatar: 'https://i.pravatar.cc/150?img=1',
    },
    icon: 'person-circle',
    category: 'Profile',
    description: 'View contact profile',
  },
  {
    name: 'Notifications',
    screen: 'Notifications',
    icon: 'notifications',
    category: 'Settings',
    description: 'Notification preferences',
  },
  {
    name: 'Privacy',
    screen: 'Privacy',
    icon: 'shield-checkmark',
    category: 'Settings',
    description: 'Privacy settings',
  },
  {
    name: 'Two-Factor Auth',
    screen: 'TwoFactorAuth',
    icon: 'lock-closed',
    category: 'Security',
    description: 'Enable 2FA',
  },
  {
    name: 'Login Activity',
    screen: 'LoginActivity',
    icon: 'phone-portrait',
    category: 'Security',
    description: 'Active sessions',
  },
  {
    name: 'Call Settings Profile',
    screen: 'CallSettingsProfile',
    icon: 'call-outline',
    category: 'Settings',
    description: 'Default call settings',
  },
  {
    name: 'Language',
    screen: 'Language',
    icon: 'language',
    category: 'Settings',
    description: 'Change app language',
  },

  // Help & Support
  {
    name: 'Help & Support',
    screen: 'HelpSupport',
    icon: 'help-circle',
    category: 'Support',
    description: 'Help center',
  },
  {
    name: 'Live Chat Support',
    screen: 'LiveChat',
    icon: 'chatbubble-ellipses',
    category: 'Support',
    description: 'AI support bot',
  },
  {
    name: 'About',
    screen: 'About',
    icon: 'information-circle',
    category: 'Support',
    description: 'App information',
  },
];

export default function DevNavigationScreen({ navigation }: DevNavigationScreenProps) {
  const { theme } = useTheme();
  const { user, loginDev } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const categories = ['All', ...Array.from(new Set(SCREEN_ROUTES.map(r => r.category)))];

  const filteredRoutes = SCREEN_ROUTES.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         route.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || route.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleNavigate = async (route: ScreenRoute) => {
    try {
      // If user is not logged in and trying to access protected screens, auto-login with demo account
      if (!user && route.screen !== 'Auth') {
        Alert.alert(
          'Authentication Required',
          'You need to be logged in to access this screen. Login with a demo account?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Demo Login',
              onPress: async () => {
                setIsLoggingIn(true);
                try {
                  // Use dev login bypass (no backend needed)
                  await loginDev();
                  // If successful, navigate
                  setTimeout(() => {
                    navigation.navigate(route.screen, route.params);
                    setIsLoggingIn(false);
                  }, 500);
                } catch (error) {
                  setIsLoggingIn(false);
                  Alert.alert(
                    'Login Failed',
                    'Could not login with dev account.',
                  );
                }
              },
            },
          ]
        );
        return;
      }

      navigation.navigate(route.screen, route.params);
    } catch (error) {
      Alert.alert(
        'Navigation Error',
        `Could not navigate to ${route.name}. ${!user ? 'Try logging in first.' : 'This screen may not be available yet.'}`,
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Ionicons name="bug" size={32} color="#fff" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Dev Navigation</Text>
            <View style={styles.headerStatus}>
              <Text style={styles.headerSubtitle}>
                {user ? `Logged in as ${user.username}` : 'Not logged in - limited access'}
              </Text>
              {user ? (
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: '#FFC107' }]}>
                  <Ionicons name="warning" size={14} color="#fff" />
                </View>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Info Banner */}
      {!user && (
        <View style={[styles.infoBanner, { backgroundColor: '#FFC107' + '20', borderColor: '#FFC107' }]}>
          <Ionicons name="information-circle" size={20} color="#FFC107" />
          <Text style={[styles.infoBannerText, { color: '#F57C00' }]}>
            Most screens require login. You'll be prompted to login when needed.
          </Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search screens..."
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === category ? theme.primary : theme.surface,
                borderColor: selectedCategory === category ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                { color: selectedCategory === category ? '#fff' : theme.text },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Screen List */}
      <ScrollView style={styles.screenList} contentContainerStyle={styles.screenListContent}>
        <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
          {filteredRoutes.length} screen{filteredRoutes.length !== 1 ? 's' : ''} found
        </Text>

        {filteredRoutes.map((route, index) => (
          <View
            key={index}
          >
            <TouchableOpacity
              style={[styles.screenCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => handleNavigate(route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name={route.icon as any} size={24} color={theme.primary} />
              </View>
              <View style={styles.screenInfo}>
                <Text style={[styles.screenName, { color: theme.text }]}>{route.name}</Text>
                <Text style={[styles.screenDescription, { color: theme.textSecondary }]}>
                  {route.description}
                </Text>
                <View style={[styles.categoryBadge, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>
                    {route.category}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}

        {filteredRoutes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No screens found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.placeholder }]}>
              Try a different search term
            </Text>
          </View>
        )}

        {/* Warning Notice */}
        <View style={[styles.warningCard, { backgroundColor: theme.error + '15', borderColor: theme.error + '30' }]}>
          <Ionicons name="warning" size={24} color={theme.error} />
          <View style={styles.warningText}>
            <Text style={[styles.warningTitle, { color: theme.error }]}>
              Development Only
            </Text>
            <Text style={[styles.warningSubtitle, { color: theme.text }]}>
              Remove this screen before production deployment. Some features may not work without backend.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  infoBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoryScroll: {
    maxHeight: 50,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  screenList: {
    flex: 1,
  },
  screenListContent: {
    padding: 16,
  },
  resultCount: {
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '500',
  },
  screenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenInfo: {
    flex: 1,
  },
  screenName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  screenDescription: {
    fontSize: 13,
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  warningCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 32,
    borderWidth: 1,
    gap: 12,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  warningSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
