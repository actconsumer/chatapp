import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SearchInChatScreenProps {
  route: any;
  navigation: any;
}

interface SearchResult {
  id: string;
  text: string;
  timestamp: Date;
  isMine: boolean;
  senderName?: string;
  mediaType?: string;
}

export default function SearchInChatScreen({ route, navigation }: SearchInChatScreenProps) {
  const { theme } = useTheme();
  const { chatName, chatId } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: '1',
      text: 'Hey! How are you doing?',
      timestamp: new Date(Date.now() - 86400000),
      isMine: false,
      senderName: chatName,
    },
    {
      id: '2',
      text: "I'm doing great! Thanks for asking 😊",
      timestamp: new Date(Date.now() - 86300000),
      isMine: true,
    },
    {
      id: '3',
      text: 'Check out this cool photo I took!',
      timestamp: new Date(Date.now() - 7200000),
      isMine: false,
      senderName: chatName,
      mediaType: 'image',
    },
  ];

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      // Filter mock results
      const filtered = mockResults.filter((msg) =>
        msg.text.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: theme.surface }]}
      activeOpacity={0.7}
      onPress={() => {
        // Navigate back to ChatRoom and scroll to the specific message
        navigation.navigate('ChatRoom', {
          chatId,
          chatName,
          messageId: item.id,
          highlightMessage: true,
        });
      }}
    >
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Text style={[styles.senderName, { color: item.isMine ? theme.primary : theme.text }]}>
            {item.isMine ? <Text>You</Text> : <Text>{item.senderName}</Text>}
          </Text>
          <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
            <Text>{formatDate(item.timestamp)}</Text>
          </Text>
        </View>
        <View style={styles.messageRow}>
          {item.mediaType && (
            <Ionicons
              name={item.mediaType === 'image' ? 'image' : 'videocam'}
              size={16}
              color={theme.textSecondary}
              style={styles.mediaIcon}
            />
          )}
          <Text style={[styles.messageText, { color: theme.text }]} numberOfLines={2}>
            {item.text}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {searchQuery ? <Text>No messages found</Text> : <Text>Search in chat</Text>}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {searchQuery
          ? <Text>Try different keywords</Text>
          : <Text>Type to search for messages, photos, and more</Text>}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.chatName, { color: theme.text }]} numberOfLines={1}>
            <Text>{chatName}</Text>
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            <Text>{searchResults.length} {searchResults.length === 1 ? 'message' : 'messages'}</Text>
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search messages..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={searchResults}
        renderItem={renderResult}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 8,
  },
  chatName: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  resultsList: {
    padding: 16,
    flexGrow: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaIcon: {
    marginRight: 6,
  },
  messageText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
