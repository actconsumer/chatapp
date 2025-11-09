import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SIZES } from '../../utils/constants';
import FriendsCircle from '../../components/FriendsCircle';
import StoryCircle from '../../components/StoryCircle';
import { chatService, ChatSummary } from '../../services/chat.service';
import { storyService, Story } from '../../services/story.service';
import { socketService } from '../../services/socket.service';
import { groupService } from '../../services/group.service';
import { userService, UserProfile } from '../../services/user.service';
import CreateGroupModal, { CreateGroupFormValues, ParticipantOption } from '../../components/CreateGroupModal';

interface Chat {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  isTyping?: boolean;
  type?: 'direct' | 'group';
  isPinned?: boolean;
  updatedAt?: string;
  lastMessageAt?: string;
  description?: string;
}

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  hasActiveStory: boolean;
  isOnline: boolean;
  stories?: Story[];
}

interface StoryGroup {
  userId: string;
  userName: string;
  userAvatar?: string;
  stories: Story[];
  hasUnviewed: boolean;
}

const mapSummaryToChat = (summary: ChatSummary): Chat => {
  const participants = summary.participants || [];
  const updatedAt = summary.updatedAt || summary.lastMessageAt || new Date().toISOString();

  return {
    id: summary.id,
    name: summary.name,
    avatar: summary.avatar,
    lastMessage: summary.lastMessageText || '',
    timestamp: formatTimestamp(summary.lastMessageAt || summary.updatedAt),
    unreadCount: summary.unreadCount,
    isOnline: participants.some((participant) => participant.isOnline),
    isTyping: false,
    type: summary.type,
    isPinned: summary.isPinned,
    updatedAt,
    lastMessageAt: summary.lastMessageAt,
    description: summary.description,
  };
};

const sortChatArray = (items: Chat[]): Chat[] => {
  return [...items].sort((a, b) => {
    const pinDelta = Number(!!b.isPinned) - Number(!!a.isPinned);
    if (pinDelta !== 0) {
      return pinDelta;
    }

    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });
};

const upsertChat = (items: Chat[], summary: ChatSummary): Chat[] => {
  const mapped = mapSummaryToChat(summary);
  const without = items.filter((chat) => chat.id !== mapped.id);
  return sortChatArray([...without, mapped]);
};

const mergeFriendsWithSummary = (
  friends: Friend[],
  summary: ChatSummary,
  currentUserId?: string
): Friend[] => {
  const map = new Map<string, Friend>();
  friends.forEach((friend) => map.set(friend.id, friend));

  (summary.participants || []).forEach((participant) => {
    const participantId = participant.id;
    if (!participantId || participantId === currentUserId) {
      return;
    }

    const existing = map.get(participantId);
    map.set(participantId, {
      id: participantId,
      name: participant.displayName || participant.username || existing?.name || 'User',
      avatar: participant.avatar || existing?.avatar,
      hasActiveStory: existing?.hasActiveStory ?? false,
      isOnline: !!participant.isOnline || existing?.isOnline || false,
    });
  });

  return Array.from(map.values());
};

// Formatter helpers
const formatTimestamp = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return date.toLocaleDateString();
};

// Mock friends data with story status
const MOCK_FRIENDS: Friend[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    hasActiveStory: true,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Michael Chen',
    hasActiveStory: true,
    isOnline: true,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    hasActiveStory: false,
    isOnline: true,
  },
  {
    id: '4',
    name: 'David Park',
    hasActiveStory: true,
    isOnline: false,
  },
  {
    id: '5',
    name: 'Jessica Lee',
    hasActiveStory: false,
    isOnline: true,
  },
  {
    id: '6',
    name: 'James Wilson',
    hasActiveStory: true,
    isOnline: false,
  },
  {
    id: '7',
    name: 'Lisa Anderson',
    hasActiveStory: false,
    isOnline: false,
  },
  {
    id: '8',
    name: 'Alex Turner',
    hasActiveStory: true,
    isOnline: true,
  },
];

export default function ChatListScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStories, setLoadingStories] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const filteredChats = useMemo(
    () =>
      chats.filter((chat) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [chats, searchQuery]
  );

  const handleNewChat = () => {
    setShowNewChatModal(true);
  };

  const handleCreateGroup = () => {
    setShowNewChatModal(false);
    setShowGroupModal(true);
  };

  const handleSelectContact = (contact: Friend) => {
    setShowNewChatModal(false);
    // Navigate to chat with selected contact
    navigation.navigate('ChatRoom', {
      chatId: contact.id,
      chatName: contact.name,
      chatAvatar: contact.avatar,
      isOnline: contact.isOnline,
    });
  };

  const handleFriendPress = (friend: Friend) => {
    if (friend.hasActiveStory) {
      // Navigate to story viewer
      navigation.navigate('StoryViewer', {
        userId: friend.id,
        userName: friend.name,
        userAvatar: friend.avatar,
      });
    } else {
      // Navigate to direct chat
      navigation.navigate('ChatRoom', {
        chatId: friend.id,
        chatName: friend.name,
        chatAvatar: friend.avatar,
        isOnline: friend.isOnline,
      });
    }
  };

  // Load friends from backend
  const loadFriends = async () => {
    try {
      setLoadingFriends(true);
      
      // Get all users we have conversations with
      const users = await userService.searchUsers({ query: '', limit: 100 });
      
      // Map to Friend format with presence
      const mappedFriends: Friend[] = users.map((u: UserProfile) => ({
        id: u.id,
        name: u.displayName || u.username,
        avatar: u.avatar,
        hasActiveStory: false, // Will be updated by loadStories
        isOnline: false, // Will be updated by socket events
      }));
      
      if (isMountedRef.current) {
        setFriends(mappedFriends);
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
      // Keep existing friends or empty array
    } finally {
      if (isMountedRef.current) {
        setLoadingFriends(false);
      }
    }
  };

  // Load stories and update friends
  const loadStories = async () => {
    try {
      setLoadingStories(true);
      
      // Load all stories
      const allStories = await storyService.list();
      
      // Load my stories
      const userStories = await storyService.myStories();
      
      if (isMountedRef.current) {
        setStories(allStories);
        setMyStories(userStories);
        
        // Group stories by user
        const storyMap = new Map<string, Story[]>();
        allStories.forEach(story => {
          const existing = storyMap.get(story.userId) || [];
          storyMap.set(story.userId, [...existing, story]);
        });
        
        // Create story groups
        const groups: StoryGroup[] = Array.from(storyMap.entries()).map(([userId, userStories]) => {
          const firstStory = userStories[0];
          return {
            userId,
            userName: firstStory.userName || 'User',
            userAvatar: firstStory.userAvatar,
            stories: userStories,
            hasUnviewed: userStories.some(s => !s.hasViewed),
          };
        });
        
        setStoryGroups(groups);
        
        // Update friends with story status
        const activeStoryUserIds = new Set(allStories.map(s => s.userId));
        setFriends(prev => prev.map(f => ({
          ...f,
          hasActiveStory: activeStoryUserIds.has(f.id),
          stories: storyMap.get(f.id),
        })));
      }
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      if (isMountedRef.current) {
        setLoadingStories(false);
      }
    }
  };

  const handleGroupCreation = async (values: CreateGroupFormValues) => {
    try {
      setCreatingGroup(true);
      const group = await groupService.create({
        name: values.name,
        participantIds: values.participantIds,
        avatarUri: values.photoUri,
      });
      
      // Close modal and navigate to new group chat
      setShowGroupModal(false);
      navigation.navigate('ChatRoom', {
        chatId: group.id,
        chatName: group.name,
        chatAvatar: group.avatar,
        isOnline: false,
      });
      
      // Refresh chat list - trigger a reload by toggling loading state
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 1000);
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert(
        t('common.error'),
        t('chat.failedToCreateGroup') || 'Failed to create group. Please try again.'
      );
    } finally {
      setCreatingGroup(false);
    }
  };

  // Load chats from API
  useEffect(() => {
    let mounted = true;
    
    const loadAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load chats
        const items = await chatService.list();
        if (!mounted) return;
        
        const mapped: Chat[] = items.map((c) => ({
          id: c.id,
          name: c.name,
          avatar: c.avatar,
          lastMessage: c.lastMessageText || '',
          timestamp: formatTimestamp(c.lastMessageAt),
          unreadCount: c.unreadCount || 0,
          isOnline: (c.participants || []).some(p => p.isOnline),
          isTyping: false,
          type: c.type,
          isPinned: c.isPinned,
          updatedAt: c.updatedAt || c.lastMessageAt,
          lastMessageAt: c.lastMessageAt,
          description: c.description,
        }));
        setChats(sortChatArray(mapped));
        
        // Load friends and stories in parallel
        await Promise.all([
          loadFriends(),
          loadStories(),
        ]);
        
        // Connect socket and subscribe to events
        try {
          if (!socketService.isConnected()) {
            await socketService.connect();
          }
          
          // Typing indicators
          socketService.on('typing:start', (data: any) => {
            const { conversationId, userId } = data;
            setChats(prev => prev.map(c => 
              c.id === conversationId ? { ...c, isTyping: true } : c
            ));
          });
          
          socketService.on('typing:stop', (data: any) => {
            const { conversationId } = data;
            setChats(prev => prev.map(c => 
              c.id === conversationId ? { ...c, isTyping: false } : c
            ));
          });
          
          // New messages
          socketService.on('message:new', (data: any) => {
            const { conversationId, content, senderId, createdAt } = data;
            setChats(prev => {
              const updated = prev.map(c => {
                if (c.id === conversationId) {
                  return {
                    ...c,
                    lastMessage: content || '',
                    timestamp: formatTimestamp(createdAt),
                    unreadCount: senderId !== user?.id ? (c.unreadCount || 0) + 1 : c.unreadCount,
                    updatedAt: createdAt,
                  };
                }
                return c;
              });
              return sortChatArray(updated);
            });
          });
          
          // Presence updates
          socketService.on('user:online', (data: any) => {
            setFriends(prev => 
              prev.map(f => f.id === data.userId ? { ...f, isOnline: true } : f)
            );
            setChats(prev => 
              prev.map(c => {
                const hasUser = c.id === data.userId;
                return hasUser ? { ...c, isOnline: true } : c;
              })
            );
          });
          
          socketService.on('user:offline', (data: any) => {
            setFriends(prev => 
              prev.map(f => f.id === data.userId ? { ...f, isOnline: false } : f)
            );
            setChats(prev => 
              prev.map(c => {
                const hasUser = c.id === data.userId;
                return hasUser ? { ...c, isOnline: false } : c;
              })
            );
          });
          
          // Story events
          socketService.on('story:new', (data: any) => {
            console.log('New story received:', data);
            // Reload stories to get fresh data
            loadStories();
          });
          
          socketService.on('story:deleted', (data: any) => {
            console.log('Story deleted:', data);
            // Remove from state
            setStories(prev => prev.filter(s => s.id !== data.storyId));
            loadStories();
          });
          
          // Chat updated
          socketService.on('chat:updated', async (data: any) => {
            try {
              const updated = await chatService.get(data.chatId);
              setChats(prev => upsertChat(prev, updated));
            } catch (error) {
              console.error('Failed to fetch updated chat:', error);
            }
          });
          
        } catch (socketError) {
          console.error('Socket connection error:', socketError);
          // Non-fatal, continue without real-time updates
        }
        
      } catch (e: any) {
        if (!mounted) return;
        console.error('Failed to load data:', e);
        setError(e.message || 'Failed to load chats');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    loadAllData();
    
    return () => {
      mounted = false;
      // Cleanup socket listeners
      socketService.off('typing:start');
      socketService.off('typing:stop');
      socketService.off('message:new');
      socketService.off('user:online');
      socketService.off('user:offline');
      socketService.off('story:new');
      socketService.off('story:deleted');
      socketService.off('chat:updated');
    };
  }, []);

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={[styles.chatItem, { backgroundColor: theme.background }]}
      onPress={() => navigation.navigate('ChatRoom', { 
        chatId: item.id, 
        chatName: item.name,
        chatAvatar: item.avatar,
        isOnline: item.isOnline 
      })}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
          <LinearGradient
            colors={theme.gradient}
            style={styles.avatarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        </View>
        {item.isOnline && (
          <View
            style={[
              styles.onlineIndicator,
              { backgroundColor: theme.success, borderColor: theme.background },
            ]}
          />
        )}
      </View>

      {/* Chat Info */}
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
            {item.timestamp}
          </Text>
        </View>
        <View style={styles.messageRow}>
          {item.isTyping ? (
            <View style={styles.typingContainer}>
              <Text style={[styles.typingText, { color: theme.primary }]}>{t('chat.typing')}</Text>
              <View style={styles.typingDots}>
                <View style={[styles.dot, { backgroundColor: theme.primary }]} />
                <View style={[styles.dot, { backgroundColor: theme.primary }]} />
                <View style={[styles.dot, { backgroundColor: theme.primary }]} />
              </View>
            </View>
          ) : (
            <Text
              style={[
                styles.lastMessage,
                { color: item.unreadCount > 0 ? theme.text : theme.textSecondary },
                item.unreadCount > 0 && { fontWeight: '600' },
              ]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <LinearGradient
                colors={theme.gradient}
                style={styles.unreadBadgeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </LinearGradient>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={theme.textSecondary} />
      {error ? (
        <>
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            {t('common.error')}
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
            {error}
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No chats yet</Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>Start a conversation with someone</Text>
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Chats</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleNewChat}
            >
              <Ionicons name="create-outline" size={24} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[styles.smallAvatar, { backgroundColor: theme.surface }]}>
                <LinearGradient
                  colors={theme.gradient}
                  style={styles.smallAvatarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.smallAvatarText}>
                    {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.inputBackground },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.placeholder}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={t('common.search')}
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.placeholder} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Friends Circle with Stories */}
      <View style={styles.storiesContainer}>
        {loadingStories ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesContent}
          >
            {/* My Story */}
            <StoryCircle
              userId={user?.id || ''}
              userName="Your Story"
              userAvatar={user?.avatar}
              hasStory={myStories.length > 0}
              hasUnviewed={false}
              isMyStory={true}
              showAddButton={myStories.length === 0}
              onPress={() => {
                if (myStories.length > 0) {
                  navigation.navigate('StoryViewer', {
                    stories: myStories,
                    initialIndex: 0,
                  });
                }
              }}
              onAddStory={() => {
                navigation.navigate('Stories');
              }}
            />
            
            {/* Friends' Stories */}
            {storyGroups.map((group) => (
              <StoryCircle
                key={group.userId}
                userId={group.userId}
                userName={group.userName}
                userAvatar={group.userAvatar}
                hasStory={true}
                hasUnviewed={group.hasUnviewed}
                isMyStory={false}
                onPress={() => {
                  navigation.navigate('StoryViewer', {
                    userId: group.userId,
                    userName: group.userName,
                    userAvatar: group.userAvatar,
                  });
                }}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filteredChats.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await Promise.all([
                  chatService.list().then(items => {
                    const mapped = items.map(c => mapSummaryToChat(c));
                    setChats(sortChatArray(mapped));
                  }),
                  loadFriends(),
                  loadStories(),
                ]);
              } catch (error) {
                console.error('Refresh failed:', error);
              } finally {
                setRefreshing(false);
              }
            }}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewChat}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={theme.gradient}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* New Chat Modal */}
      <Modal
        visible={showNewChatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('chat.newChat')}</Text>
              <TouchableOpacity onPress={() => setShowNewChatModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Create Group Button */}
            <TouchableOpacity
              style={[styles.createGroupButton, { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}
              onPress={handleCreateGroup}
            >
              <Ionicons name="people" size={24} color={theme.primary} />
              <Text style={[styles.createGroupText, { color: theme.primary }]}>{t('chat.createGroup')}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.primary} />
            </TouchableOpacity>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t('chat.directMessages')}</Text>
            
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.contactItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleSelectContact(item)}
                >
                  <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
                      <LinearGradient
                        colors={theme.gradient}
                        style={styles.avatarGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.avatarText}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                    </View>
                    {item.isOnline && (
                      <View
                        style={[
                          styles.onlineIndicator,
                          { backgroundColor: theme.success, borderColor: theme.card },
                        ]}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactName, { color: theme.text }]}>{item.name}</Text>
                    {item.isOnline && (
                      <Text style={[styles.friendTag, { color: theme.success }]}>Friend • Online</Text>
                    )}
                    {!item.isOnline && (
                      <Text style={[styles.friendTag, { color: theme.textSecondary }]}>Friend</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Group Chat Modal */}
      <CreateGroupModal
        visible={showGroupModal}
        contacts={friends.map(friend => ({
          id: friend.id,
          name: friend.name,
          avatar: friend.avatar,
          isOnline: friend.isOnline,
        }))}
        onClose={() => setShowGroupModal(false)}
        onBack={() => {
          setShowGroupModal(false);
          setShowNewChatModal(true);
        }}
        onSubmit={handleGroupCreation}
        loading={creatingGroup}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  smallAvatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.body,
  },
  chatItem: {
    flexDirection: 'row',
    padding: SIZES.padding,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    fontSize: SIZES.tiny,
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: SIZES.small,
    flex: 1,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: SIZES.small,
    fontWeight: '500',
    marginRight: 4,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  unreadBadge: {
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  unreadBadgeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: SIZES.tiny,
    fontWeight: 'bold',
  },
  emptyList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: SIZES.small,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  createGroupText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingVertical: 8,
    letterSpacing: 0.5,
  },
  friendTag: {
    fontSize: 12,
    marginTop: 2,
  },
  groupModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '90%',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  groupInfoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  groupPhotoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupPhotoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  groupNameInput: {
    width: '100%',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  selectedSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  selectedLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedList: {
    flexDirection: 'row',
  },
  selectedChip: {
    alignItems: 'center',
    marginRight: 12,
    width: 70,
  },
  selectedAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  selectedAvatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectedName: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  participantsList: {
    paddingTop: 8,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storiesContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  storiesContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
