import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export interface ParticipantOption {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface CreateGroupFormValues {
  name: string;
  participantIds: string[];
  photoUri?: string | null;
}

interface CreateGroupModalProps {
  visible: boolean;
  contacts: ParticipantOption[];
  onClose: () => void;
  onBack?: () => void;
  onSubmit: (values: CreateGroupFormValues) => Promise<void> | void;
  loading?: boolean;
  minimumParticipants?: number;
}

const MIN_PARTICIPANTS_DEFAULT = 2;

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  contacts,
  onClose,
  onBack,
  onSubmit,
  loading = false,
  minimumParticipants = MIN_PARTICIPANTS_DEFAULT,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [groupName, setGroupName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) {
      setGroupName('');
      setPhotoUri(null);
      setSearchQuery('');
      setSelectedIds([]);
    }
  }, [visible]);

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) => contact.name.toLowerCase().includes(query));
  }, [contacts, searchQuery]);

  const toggleParticipant = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const handlePhotoSelection = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('CreateGroupModal handlePhotoSelection error:', error);
    }
  };

  const handleSubmit = () => {
    if (loading) return;
    if (!groupName.trim() || selectedIds.length < minimumParticipants) return;
    onSubmit({
      name: groupName.trim(),
      participantIds: selectedIds,
      photoUri,
    });
  };

  const canSubmit = groupName.trim().length > 0 && selectedIds.length >= minimumParticipants;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.card }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} disabled={loading}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>{t('chat.newGroup')}</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={!canSubmit || loading}>
              {loading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text
                  style={[
                    styles.createAction,
                    { color: canSubmit ? theme.primary : theme.textSecondary },
                  ]}
                >
                  {t('chat.createGroup')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.groupInfoSection}>
              <TouchableOpacity
                style={[styles.photoPicker, { backgroundColor: theme.surface }]}
                onPress={handlePhotoSelection}
                disabled={loading}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoImage} />
                ) : (
                  <Ionicons name="camera" size={32} color={theme.textSecondary} />
                )}
              </TouchableOpacity>

              <TextInput
                style={[
                  styles.groupNameInput,
                  { color: theme.text, borderBottomColor: theme.border },
                ]}
                placeholder={t('chat.groupNamePlaceholder')}
                placeholderTextColor={theme.placeholder}
                value={groupName}
                onChangeText={setGroupName}
                editable={!loading}
                maxLength={50}
              />
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                {t('chat.participantsRequired', { count: minimumParticipants })}
              </Text>
            </View>

            {selectedIds.length > 0 && (
              <View style={styles.selectedContainer}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  {t('chat.participants')} ({selectedIds.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.selectedList}
                >
                  {selectedIds.map((participantId) => {
                    const participant = contacts.find((item) => item.id === participantId);
                    if (!participant) return null;

                    return (
                      <View key={participant.id} style={styles.selectedChip}>
                        <View style={[styles.selectedAvatar, { backgroundColor: theme.surface }]}>
                          <LinearGradient
                            colors={theme.gradient}
                            style={styles.selectedAvatarGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <Text style={styles.selectedAvatarText}>
                              {participant.name.charAt(0).toUpperCase()}
                            </Text>
                          </LinearGradient>
                        </View>
                        <Text
                          style={[styles.selectedName, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {participant.name.split(' ')[0]}
                        </Text>
                        <TouchableOpacity
                          style={[styles.removeButton, { backgroundColor: theme.error }]}
                          onPress={() => toggleParticipant(participant.id)}
                          disabled={loading}
                        >
                          <Ionicons name="close" size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.searchSection}>
              <View
                style={[styles.searchContainer, { backgroundColor: theme.inputBackground }]}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={theme.placeholder}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder={t('chat.selectParticipants')}
                  placeholderTextColor={theme.placeholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  editable={!loading}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} disabled={loading}>
                    <Ionicons name="close-circle" size={20} color={theme.placeholder} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.participantList}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                {t('chat.friends')}
              </Text>
              {filteredContacts.map((contact) => {
                const isSelected = selectedIds.includes(contact.id);
                return (
                  <TouchableOpacity
                    key={contact.id}
                    style={[styles.participantItem, { borderBottomColor: theme.border }]}
                    onPress={() => toggleParticipant(contact.id)}
                    disabled={loading}
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
                            <Text style={styles.avatarText}>
                              {contact.name.charAt(0).toUpperCase()}
                            </Text>
                          </LinearGradient>
                        </View>
                        {contact.isOnline && (
                          <View
                            style={[
                              styles.onlineIndicator,
                              { backgroundColor: theme.success, borderColor: theme.card },
                            ]}
                          />
                        )}
                      </View>
                      <View>
                        <Text style={[styles.participantName, { color: theme.text }]}>
                          {contact.name}
                        </Text>
                        <Text style={[styles.participantTag, { color: theme.textSecondary }]}>
                          {contact.isOnline ? t('chat.friendOnline') : t('chat.friendOffline')}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: isSelected ? theme.primary : theme.border },
                        isSelected && { backgroundColor: theme.primary },
                      ]}
                    >
                      {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  createAction: {
    fontSize: 16,
    fontWeight: '600',
  },
  groupInfoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  photoPicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoImage: {
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
  helperText: {
    fontSize: 12,
    marginTop: 6,
  },
  selectedContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingBottom: 8,
    letterSpacing: 0.5,
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
    fontSize: 14,
  },
  participantList: {
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
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
  },
  participantTag: {
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CreateGroupModal;
