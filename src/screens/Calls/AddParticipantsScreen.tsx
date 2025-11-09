import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { userService, UserProfile } from '../../services/user.service';
import { callService } from '../../services/call.service';
import { socketService } from '../../services/socket.service';

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
}

const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Sarah Johnson', isOnline: true },
  { id: '2', name: 'Michael Chen', isOnline: true },
  { id: '3', name: 'Emily Rodriguez', isOnline: false },
  { id: '4', name: 'David Park', isOnline: false },
  { id: '5', name: 'Jessica Williams', isOnline: true },
  { id: '6', name: 'Robert Brown', isOnline: false },
  { id: '7', name: 'Maria Garcia', isOnline: true },
  { id: '8', name: 'James Miller', isOnline: false },
];

interface AddParticipantsScreenProps {
  route: any;
  navigation: any;
}

export default function AddParticipantsScreen({ route, navigation }: AddParticipantsScreenProps) {
  const { theme } = useTheme();
  const { currentParticipants = [], callId } = route.params || {};
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const users = await userService.searchUsers({ query: '', limit: 100 });
      
      // Map to Contact format
      const mappedContacts = users.map((user: UserProfile) => ({
        id: user.id,
        name: user.displayName || user.username,
        avatar: user.avatar,
        isOnline: false, // Will be updated via socket
      }));
      
      setContacts(mappedContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      // Fall back to mock data
      setContacts(MOCK_CONTACTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const handleUserOnline = (data: any) => {
      setContacts(prev =>
        prev.map(contact =>
          contact.id === data.userId ? { ...contact, isOnline: true } : contact
        )
      );
    };

    const handleUserOffline = (data: any) => {
      setContacts(prev =>
        prev.map(contact =>
          contact.id === data.userId ? { ...contact, isOnline: false } : contact
        )
      );
    };

    socketService.on('user:online', handleUserOnline);
    socketService.on('user:offline', handleUserOffline);

    return () => {
      socketService.off('user:online', handleUserOnline);
      socketService.off('user:offline', handleUserOffline);
    };
  }, []);

  const currentParticipantIds = useMemo(
    () => currentParticipants.map((p: any) => p.id || p.userId).filter(Boolean),
    [currentParticipants]
  );

  const availableContacts = contacts.filter(
    contact => !currentParticipantIds.includes(contact.id)
  );

  const filteredContacts = availableContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleContact = (contact: Contact) => {
    if (selectedContacts.some(c => c.id === contact.id)) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleAddParticipants = async () => {
    if (selectedContacts.length === 0) return;

    if (!callId) {
      Alert.alert('Missing call', 'Unable to add people because the call is not active.');
      return;
    }

    try {
      setAdding(true);

      await callService.addParticipants(callId, selectedContacts.map(c => c.id));

      setSelectedContacts([]);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to add participants:', error);
      const message = (error as any)?.message || 'Could not add participants. Please try again.';
      Alert.alert('Add participants failed', message);
    } finally {
      setAdding(false);
    }
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const isSelected = selectedContacts.some(c => c.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.contactItem, { backgroundColor: theme.background }]}
        onPress={() => toggleContact(item)}
      >
        <View style={styles.contactLeft}>
          <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
            <LinearGradient
              colors={theme.gradient as any}
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
          <Text style={[styles.contactName, { color: theme.text }]}>{item.name}</Text>
        </View>

        <View
          style={[
            styles.checkbox,
            { borderColor: isSelected ? theme.primary : theme.border },
            isSelected && { backgroundColor: theme.primary },
          ]}
        >
          {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Add to Call</Text>
        <TouchableOpacity
          style={[
            styles.addButton,
            selectedContacts.length === 0 && styles.addButtonDisabled,
          ]}
          onPress={handleAddParticipants}
          disabled={selectedContacts.length === 0 || adding}
        >
          {adding ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text
              style={[
                styles.addButtonText,
                { color: selectedContacts.length > 0 ? theme.primary : theme.textSecondary },
              ]}
            >
              Add ({selectedContacts.length})
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search contacts..."
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
      </View>

      {/* Selected Contacts */}
      {selectedContacts.length > 0 && (
        <View style={styles.selectedContainer}>
          <FlatList
            horizontal
            data={selectedContacts}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.selectedContact}>
                <View style={[styles.smallAvatar, { backgroundColor: theme.surface }]}>
                  <LinearGradient
                    colors={theme.gradient as any}
                    style={styles.smallAvatarGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.smallAvatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                </View>
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: theme.error }]}
                  onPress={() => toggleContact(item)}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
                <Text
                  style={[styles.selectedName, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {item.name.split(' ')[0]}
                </Text>
              </View>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedList}
          />
        </View>
      )}

      {/* Contacts List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading contacts...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.contactsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {searchQuery ? 'No contacts found' : 'No contacts available'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    padding: 4,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  selectedContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
  },
  selectedList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  selectedContact: {
    alignItems: 'center',
    width: 64,
  },
  smallAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  smallAvatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedName: {
    fontSize: 12,
    marginTop: 4,
  },
  contactsList: {
    paddingVertical: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    left: 36,
    top: 34,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});
