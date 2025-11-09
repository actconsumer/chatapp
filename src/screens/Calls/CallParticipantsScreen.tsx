import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { socketService } from '../../services/socket.service';
import { callService, CallParticipant as ServiceCallParticipant } from '../../services/call.service';
import { useAuth } from '../../context/AuthContext';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isMuted?: boolean;
  isSpeaking?: boolean;
  isSelf?: boolean;
}

interface CallParticipantsScreenProps {
  route: any;
  navigation: any;
}

export default function CallParticipantsScreen({ route, navigation }: CallParticipantsScreenProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { callType = 'voice', callId } = route.params || {};

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapParticipants = useCallback(
    (callParticipants: ServiceCallParticipant[] = []): Participant[] => {
      const participantMap = new Map<string, Participant>();

      callParticipants.forEach((participant) => {
        const participantId = participant.userId || participant.id;
        if (!participantId) {
          return;
        }

        participantMap.set(participantId, {
          id: participantId,
          name: participant.displayName || 'Unknown Participant',
          avatar: participant.avatarUrl,
          isMuted: participant.muted,
          isSpeaking: participant.isSpeaking,
          isSelf: participantId === user?.id,
        });
      });

      return Array.from(participantMap.values());
    },
    [user?.id]
  );

  const fetchParticipants = useCallback(async () => {
    if (!callId) {
      return;
    }

    try {
      setIsLoading(true);
      const call = await callService.getCall(callId);
      const mappedParticipants = mapParticipants(call.participants);
      setParticipants(mappedParticipants);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch call participants:', err);
      setError('Unable to load participants right now');
    } finally {
      setIsLoading(false);
    }
  }, [callId, mapParticipants]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchParticipants();
    });

    return unsubscribeFocus;
  }, [navigation, fetchParticipants]);

  useEffect(() => {
    if (!callId) {
      return;
    }

    const handleParticipantEvent = (data: any) => {
      if (data?.callId !== callId) {
        return;
      }
      fetchParticipants();
    };

    socketService.on('call:participant-joined', handleParticipantEvent);
    socketService.on('call:participant-left', handleParticipantEvent);
    socketService.on('call:participant-muted', handleParticipantEvent);
    socketService.on('call:participant-speaking', handleParticipantEvent);

    return () => {
      socketService.off('call:participant-joined', handleParticipantEvent);
      socketService.off('call:participant-left', handleParticipantEvent);
      socketService.off('call:participant-muted', handleParticipantEvent);
      socketService.off('call:participant-speaking', handleParticipantEvent);
    };
  }, [callId, fetchParticipants]);

  const handleRemoveParticipant = (participantId: string) => {
    if (participantId === user?.id) {
      Alert.alert('Action not allowed', 'You cannot remove yourself from the call.');
      return;
    }

    if (!callId) {
      Alert.alert('Missing call details', 'Unable to remove participant because this call is no longer active.');
      return;
    }

    Alert.alert(
      'Remove Participant',
      'Are you sure you want to remove this participant from the call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await callService.removeParticipant(callId, participantId);
              await fetchParticipants();
            } catch (err: any) {
              console.error('Failed to remove participant:', err);
              const message = err?.message || 'Could not remove the participant. Please try again.';
              Alert.alert('Remove failed', message);
            }
          },
        },
      ]
    );
  };

  const renderParticipant = ({ item }: { item: Participant }) => (
    <View style={[styles.participantItem, { backgroundColor: theme.background }]}>
      <View style={styles.participantLeft}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: theme.surface },
            item.isSpeaking && { borderWidth: 2, borderColor: theme.success },
          ]}
        >
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

        <View style={styles.participantInfo}>
          <Text style={[styles.participantName, { color: theme.text }]}>
            {item.name}
          </Text>
          {item.isSpeaking && (
            <View style={styles.speakingIndicator}>
              <View style={[styles.speakingDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.speakingText, { color: theme.success }]}>Speaking</Text>
            </View>
          )}
          {item.isMuted && (
            <View style={styles.mutedIndicator}>
              <Ionicons name="mic-off" size={12} color={theme.textSecondary} />
              <Text style={[styles.mutedText, { color: theme.textSecondary }]}>Muted</Text>
            </View>
          )}
        </View>
      </View>

      {!item.isSelf && (
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => handleRemoveParticipant(item.id)}
        >
          <Ionicons name="close-circle" size={24} color={theme.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          Participants ({participants.length})
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Add Participant Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.surface }]}
        onPress={() => navigation.navigate('AddParticipants', { 
          callType, 
          callId,
          currentParticipants: participants 
        })}
      >
        <View style={[styles.addIconContainer, { backgroundColor: theme.primary }]}>
          <Ionicons name="person-add" size={20} color="#fff" />
        </View>
        <Text style={[styles.addButtonText, { color: theme.text }]}>Add People</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </TouchableOpacity>

      {/* Participants List */}
      <FlatList
        data={participants}
        renderItem={renderParticipant}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.participantsList,
          participants.length === 0 && styles.participantsListEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <>
                <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  {error || 'No participants in this call yet'}
                </Text>
              </>
            )}
          </View>
        }
      />
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
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 36,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    borderRadius: 12,
  },
  addIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  participantsList: {
    paddingVertical: 8,
  },
  participantsListEmpty: {
    flexGrow: 1,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  participantLeft: {
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
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  speakingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  speakingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mutedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mutedText: {
    fontSize: 12,
  },
  moreButton: {
    padding: 8,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
