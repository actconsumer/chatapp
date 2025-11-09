import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { chatService, ChatParticipant, ChatSummary } from '../../services/chat.service';
import { groupService } from '../../services/group.service';
import { userService, UserProfile } from '../../services/user.service';

interface GroupManagementScreenProps {
  route: any;
  navigation: any;
}

interface RouteParams {
  groupId?: string;
  chatId?: string;
  groupName?: string;
  groupPhoto?: string;
}

const MIN_SEARCH_LENGTH = 2;

export default function GroupManagementScreen({ route, navigation }: GroupManagementScreenProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const params: RouteParams = route.params || {};
  const targetGroupId = params.groupId || params.chatId;

  const [groupSummary, setGroupSummary] = useState<ChatSummary | null>(null);
  const [groupName, setGroupName] = useState(params.groupName || '');
  const [groupPhoto, setGroupPhoto] = useState<string | null>(params.groupPhoto || null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingName, setUpdatingName] = useState(false);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [participantActionUser, setParticipantActionUser] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentUserId = user?.id || null;

  const participants: ChatParticipant[] = useMemo(
    () => groupSummary?.participants || [],
    [groupSummary]
  );

  const isCurrentUserAdmin = useMemo(() => {
    if (!currentUserId) {
      return false;
    }
    return participants.some((participant) => participant.id === currentUserId && participant.role === 'admin');
  }, [participants, currentUserId]);

  const loadGroup = useCallback(async () => {
    if (!targetGroupId) {
      setErrorMessage('Missing group identifier');
      setLoading(false);
      return;
    }

    try {
      const summary = await chatService.get(targetGroupId);
      if (summary.type !== 'group') {
        setErrorMessage('This conversation is not a group chat');
      }
      setGroupSummary(summary);
      setGroupName(summary.name || '');
      setGroupPhoto(summary.avatar || null);
      setErrorMessage(null);
    } catch (error: any) {
      console.error('Failed to load group details:', error);
      setErrorMessage(error?.message || 'Failed to load group details');
      Alert.alert('Error', 'Unable to load group details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetGroupId]);

  useEffect(() => {
    setLoading(true);
    loadGroup();
  }, [loadGroup]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadGroup();
  }, [loadGroup]);

  useEffect(() => {
    if (!showAddParticipantModal) {
      setSearchQuery('');
      setSearchResults([]);
      setSearchingUsers(false);
    }
  }, [showAddParticipantModal]);

  useEffect(() => {
    if (!showAddParticipantModal) {
      return;
    }

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
      setSearchingUsers(false);
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    setSearchingUsers(true);

    const timeout = setTimeout(async () => {
      try {
        const users = await userService.searchUsers({ query: trimmedQuery, limit: 20 });
        if (cancelled) {
          return;
        }

        const filtered = users.filter(
          (candidate) =>
            candidate.id !== currentUserId &&
            !participants.some((participant) => participant.id === candidate.id)
        );

        setSearchResults(filtered);
      } catch (error) {
        console.error('Search users error:', error);
        if (!cancelled) {
          Alert.alert('Error', 'Unable to search users right now.');
        }
      } finally {
        if (!cancelled) {
          setSearchingUsers(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [searchQuery, participants, currentUserId, showAddParticipantModal]);

  const handleSaveGroupName = useCallback(async () => {
    if (!groupSummary) {
      return;
    }
    if (!isCurrentUserAdmin) {
      Alert.alert('Permission Denied', 'Only group admins can update the group name.');
      return;
    }
    if (!groupName.trim()) {
      Alert.alert('Validation Error', 'Group name cannot be empty.');
      return;
    }

    try {
      setUpdatingName(true);
      const updated = await groupService.update(groupSummary.id, { name: groupName.trim() });
      setGroupSummary(updated);
      setGroupName(updated.name || groupName.trim());
      setGroupPhoto(updated.avatar || groupPhoto);
      setIsEditingName(false);
      Alert.alert('Success', 'Group name updated successfully.');
    } catch (error) {
      console.error('Update group name error:', error);
      Alert.alert('Error', 'Failed to update group name. Please try again.');
    } finally {
      setUpdatingName(false);
    }
  }, [groupSummary, isCurrentUserAdmin, groupName, groupPhoto]);

  const getParticipantDisplayName = useCallback(
    (participant: ChatParticipant) => {
      if (participant.id === currentUserId) {
        return 'You';
      }
      return participant.displayName || participant.username || 'Member';
    },
    [currentUserId]
  );

  const handleRemoveParticipant = useCallback(
    async (participantId: string) => {
      if (!groupSummary) {
        return;
      }
      setParticipantActionUser(participantId);
      try {
        const updated = await groupService.removeMember(groupSummary.id, participantId);
        setGroupSummary(updated);
        setGroupName(updated.name || groupName);
        setGroupPhoto(updated.avatar || null);
        Alert.alert('Participant Removed', 'The member has been removed from the group.');
      } catch (error) {
        console.error('Remove participant error:', error);
        Alert.alert('Error', 'Failed to remove participant. Please try again.');
      } finally {
        setParticipantActionUser(null);
      }
    },
    [groupSummary, groupName]
  );

  const confirmRemoveParticipant = useCallback(
    (participant: ChatParticipant) => {
      if (!isCurrentUserAdmin) {
        Alert.alert('Permission Denied', 'Only group admins can remove participants.');
        return;
      }

      if (participant.role === 'admin') {
        Alert.alert('Action Blocked', 'You cannot remove another admin. Revoke their admin role first.');
        return;
      }

      Alert.alert(
        'Remove Participant',
        `Remove ${getParticipantDisplayName(participant)} from the group?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => handleRemoveParticipant(participant.id) },
        ]
      );
    },
    [isCurrentUserAdmin, getParticipantDisplayName, handleRemoveParticipant]
  );

  const handlePromoteToAdmin = useCallback(
    async (participantId: string) => {
      if (!groupSummary) {
        return;
      }
      if (!isCurrentUserAdmin) {
        Alert.alert('Permission Denied', 'Only group admins can promote another member.');
        return;
      }

      setParticipantActionUser(participantId);
      try {
        const updated = await chatService.updateParticipantRole(groupSummary.id, participantId, 'admin');
        setGroupSummary(updated);
        setGroupName(updated.name || groupName);
        setGroupPhoto(updated.avatar || null);
        Alert.alert('Success', 'Participant promoted to admin.');
      } catch (error) {
        console.error('Promote participant error:', error);
        Alert.alert('Error', 'Failed to update participant role. Please try again.');
      } finally {
        setParticipantActionUser(null);
      }
    },
    [groupSummary, isCurrentUserAdmin, groupName]
  );

  const handleAddParticipant = useCallback(
    async (profile: UserProfile) => {
      if (!groupSummary) {
        return;
      }
      if (!isCurrentUserAdmin) {
        Alert.alert('Permission Denied', 'Only group admins can add participants.');
        return;
      }

      setParticipantActionUser(profile.id);
      try {
        const updated = await groupService.addMembers(groupSummary.id, [profile.id]);
        setGroupSummary(updated);
        setGroupName(updated.name || groupName);
        setGroupPhoto(updated.avatar || null);
        setShowAddParticipantModal(false);
        setSearchQuery('');
        setSearchResults([]);
        const label = profile.displayName || profile.username || profile.email || 'User';
        Alert.alert('Participant Added', `${label} has been added to the group.`);
      } catch (error) {
        console.error('Add participant error:', error);
        Alert.alert('Error', 'Failed to add participant. Please try again.');
      } finally {
        setParticipantActionUser(null);
      }
    },
    [groupSummary, isCurrentUserAdmin, groupName]
  );

  const handlePickGroupPhoto = useCallback(async () => {
    if (!isCurrentUserAdmin) {
      Alert.alert('Permission Denied', 'Only group admins can update the group photo.');
      return;
    }
    if (!groupSummary) {
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library permission to continue.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      setUpdatingPhoto(true);

      await groupService.updateAvatar(groupSummary.id, asset.uri, asset.mimeType || undefined);
      const refreshed = await chatService.get(groupSummary.id);
      setGroupSummary(refreshed);
      setGroupPhoto(refreshed.avatar || asset.uri);
      Alert.alert('Success', 'Group photo updated successfully.');
    } catch (error) {
      console.error('Update group photo error:', error);
      Alert.alert('Error', 'Unable to update group photo. Please try again.');
    } finally {
      setUpdatingPhoto(false);
    }
  }, [isCurrentUserAdmin, groupSummary]);

  const handleLeaveGroup = useCallback(() => {
    if (!groupSummary) {
      return;
    }

    const currentParticipant = participants.find((participant) => participant.id === currentUserId);
    const adminCount = participants.filter((participant) => participant.role === 'admin').length;

    if (currentParticipant?.role === 'admin' && adminCount <= 1) {
      Alert.alert('Action Required', 'Assign another admin before leaving the group.');
      return;
    }

    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${groupName || groupSummary.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.leave(groupSummary.id);
              navigation.popToTop();
              Alert.alert('Left Group', 'You have left the group successfully.');
            } catch (error) {
              console.error('Leave group error:', error);
              Alert.alert('Error', 'Could not leave the group. Please try again.');
            }
          },
        },
      ]
    );
  }, [groupSummary, participants, currentUserId, groupName, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!groupSummary) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            {errorMessage || 'Group details are unavailable.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderParticipantActions = (participant: ChatParticipant) => {
    if (!isCurrentUserAdmin || participant.id === currentUserId) {
      return null;
    }

    const isBusy = participantActionUser === participant.id;

    return (
      <View style={styles.participantActions}>
        {isBusy ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <>
            {participant.role !== 'admin' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handlePromoteToAdmin(participant.id)}
              >
                <Ionicons name="star-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => confirmRemoveParticipant(participant)}
            >
              <Ionicons name="person-remove-outline" size={20} color={theme.error} />
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderSearchResult = (profile: UserProfile) => {
    const label = profile.displayName || profile.username || profile.email || 'User';
    const initials = label.slice(0, 2).toUpperCase();
    const isBusy = participantActionUser === profile.id;

    return (
      <TouchableOpacity
        key={profile.id}
        style={[styles.friendItem, { borderBottomColor: theme.border }]}
        onPress={() => handleAddParticipant(profile)}
        disabled={isBusy}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
            <LinearGradient
              colors={theme.gradient}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.friendName, { color: theme.text }]}>{label}</Text>
          {profile.email ? (
            <Text style={[styles.friendStatus, { color: theme.textSecondary }]}>{profile.email}</Text>
          ) : null}
        </View>
        {isBusy ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <Ionicons name="add-circle" size={28} color={theme.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Group Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      >
        <View style={[styles.groupInfoSection, { backgroundColor: theme.card }]}
        >
          <TouchableOpacity
            style={[styles.groupPhotoContainer, { backgroundColor: theme.surface }]}
            onPress={handlePickGroupPhoto}
            disabled={!isCurrentUserAdmin || updatingPhoto}
          >
            {groupPhoto ? (
              <Image source={{ uri: groupPhoto }} style={styles.groupPhotoImage} />
            ) : (
              <LinearGradient
                colors={theme.gradient}
                style={styles.groupPhotoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.groupPhotoText}>{(groupName || 'G').charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
            {isCurrentUserAdmin && (
              <View style={[styles.cameraIcon, { backgroundColor: theme.primary }]}
              >
                {updatingPhoto ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={16} color="#fff" />
                )}
              </View>
            )}
          </TouchableOpacity>

          {isEditingName && isCurrentUserAdmin ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                style={[styles.nameInput, { color: theme.text, borderBottomColor: theme.border }]}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Group Name"
                placeholderTextColor={theme.placeholder}
                autoFocus
                maxLength={50}
                editable={!updatingName}
              />
              <View style={styles.nameEditButtons}>
                <TouchableOpacity
                  style={[styles.nameEditButton, { backgroundColor: theme.surface }]}
                  onPress={() => {
                    setGroupName(groupSummary.name || '');
                    setIsEditingName(false);
                  }}
                  disabled={updatingName}
                >
                  <Text style={[styles.nameEditButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nameEditButton, { backgroundColor: theme.primary }]}
                  onPress={handleSaveGroupName}
                  disabled={updatingName}
                >
                  {updatingName ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.nameEditButtonText, { color: '#fff' }]}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.nameContainer}
              onPress={() => isCurrentUserAdmin && setIsEditingName(true)}
              disabled={!isCurrentUserAdmin}
            >
              <Text style={[styles.groupNameText, { color: theme.text }]}>{groupName || groupSummary.name}</Text>
              {isCurrentUserAdmin && (
                <Ionicons name="pencil" size={16} color={theme.textSecondary} style={{ marginLeft: 8 }} />
              )}
            </TouchableOpacity>
          )}

          <Text style={[styles.participantCount, { color: theme.textSecondary }]}>
            {participants.length} participants
          </Text>
          {errorMessage ? (
            <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Participants</Text>
            {isCurrentUserAdmin && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowAddParticipantModal(true)}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {participants.map((participant) => {
            const displayName = getParticipantDisplayName(participant);
            const fallback = displayName.charAt(0).toUpperCase();

            return (
              <View
                key={participant.id}
                style={[styles.participantItem, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
              >
                <View style={styles.participantLeft}>
                  <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
                      <LinearGradient
                        colors={theme.gradient}
                        style={styles.avatarGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.avatarText}>{fallback}</Text>
                      </LinearGradient>
                    </View>
                    {participant.isOnline && (
                      <View
                        style={[
                          styles.onlineIndicator,
                          { backgroundColor: theme.success, borderColor: theme.card },
                        ]}
                      />
                    )}
                  </View>
                  <View>
                    <Text style={[styles.participantName, { color: theme.text }]}>{displayName}</Text>
                    {participant.role === 'admin' && (
                      <Text style={[styles.adminBadge, { color: theme.primary }]}>Admin</Text>
                    )}
                  </View>
                </View>
                {renderParticipantActions(participant)}
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.dangerButton, { backgroundColor: `${theme.error}15` }]}
            onPress={handleLeaveGroup}
          >
            <Ionicons name="exit-outline" size={22} color={theme.error} />
            <Text style={[styles.dangerButtonText, { color: theme.error }]}>Leave Group</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showAddParticipantModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddParticipantModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Participants</Text>
              <TouchableOpacity onPress={() => setShowAddParticipantModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: theme.inputBackground }]}>
              <Ionicons name="search" size={20} color={theme.placeholder} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search users..."
                placeholderTextColor={theme.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={theme.placeholder} />
                </TouchableOpacity>
              ) : null}
            </View>

            {searchingUsers ? (
              <View style={styles.searchLoading}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.searchLoadingText, { color: theme.textSecondary }]}>Searching...</Text>
              </View>
            ) : null}

            <ScrollView>
              {searchResults.map(renderSearchResult)}

              {!searchResults.length && !searchingUsers ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    {searchQuery.length < MIN_SEARCH_LENGTH
                      ? 'Type at least two characters to search'
                      : 'No users found'}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  groupInfoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  groupPhotoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  groupPhotoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  groupPhotoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupPhotoText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupNameText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  participantCount: {
    fontSize: 14,
    marginTop: 4,
  },
  nameEditContainer: {
    width: '100%',
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  nameEditButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  nameEditButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  nameEditButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
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
  participantName: {
    fontSize: 16,
    fontWeight: '500',
  },
  adminBadge: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  participantActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
    maxHeight: '75%',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  searchLoadingText: {
    fontSize: 14,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
  },
  friendStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});
