/**
 * Login Activity Screen
 * Shows active sessions with device metadata, location, and remote logout capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { authService, Session } from '../../services/auth.service';

interface LoginActivityScreenProps {
  navigation: any;
}

export default function LoginActivityScreen({ navigation }: LoginActivityScreenProps) {
  const { theme } = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await authService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      Alert.alert('Error', 'Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, []);

  const handleLogoutSession = (session: Session) => {
    Alert.alert(
      'Logout Device',
      `Are you sure you want to logout from ${session.deviceName || 'this device'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logoutSession(session.id);
              setSessions((prev) => prev.filter((s) => s.id !== session.id));
              Alert.alert('Success', 'Device logged out successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout device');
            }
          },
        },
      ]
    );
  };

  const handleLogoutAllOther = () => {
    Alert.alert(
      'Logout All Other Devices',
      'This will logout all devices except this one. You will need to login again on those devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout All',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logoutAllOtherSessions();
              await loadSessions();
              Alert.alert('Success', 'All other devices logged out');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout other devices');
            }
          },
        },
      ]
    );
  };

  const getDeviceIcon = (deviceType?: string): keyof typeof Ionicons.glyphMap => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
      case 'phone':
        return 'phone-portrait';
      case 'tablet':
        return 'tablet-portrait';
      case 'desktop':
      case 'computer':
        return 'desktop';
      case 'web':
        return 'globe';
      default:
        return 'hardware-chip';
    }
  };

  const getLocationText = (session: Session): string => {
    if (session.city && session.country) {
      return `${session.city}, ${session.country}`;
    }
    if (session.country) {
      return session.country;
    }
    if (session.ipAddress) {
      return `IP: ${session.ipAddress}`;
    }
    return 'Unknown location';
  };

  const formatLastActive = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderSessionCard = ({ item, index }: { item: Session; index: number }) => {
    const isCurrent = item.isCurrent;

    return (
      <View
        style={[styles.sessionCard, { backgroundColor: theme.card }]}
      >
        <View style={styles.sessionHeader}>
          <View style={[styles.deviceIconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name={getDeviceIcon(item.deviceType)} size={24} color={theme.primary} />
          </View>
          
          <View style={styles.sessionInfo}>
            <View style={styles.sessionTitleRow}>
              <Text style={[styles.deviceName, { color: theme.text }]}>
                {item.deviceName || 'Unknown Device'}
              </Text>
              {isCurrent && (
                <View style={[styles.currentBadge, { backgroundColor: theme.success }]}>
                  <Text style={styles.currentBadgeText}>Current</Text>
                </View>
              )}
            </View>
            
            <Text style={[styles.deviceDetails, { color: theme.textSecondary }]}>
              {item.browser || 'Unknown Browser'} • {item.os || 'Unknown OS'}
            </Text>
            
            <View style={styles.sessionMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="location" size={14} color={theme.textSecondary} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                  {getLocationText(item)}
                </Text>
              </View>
              
              <View style={styles.metaItem}>
                <Ionicons name="time" size={14} color={theme.textSecondary} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                  {formatLastActive(item.lastActiveAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {!isCurrent && (
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: theme.error + '15' }]}
            onPress={() => handleLogoutSession(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.error} />
            <Text style={[styles.logoutButtonText, { color: theme.error }]}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Login Activity</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Sessions List */}
      <FlatList
        data={sessions}
        renderItem={renderSessionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.infoSection}>
            <View style={[styles.infoCard, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                You're currently logged in on {sessions.length} {sessions.length === 1 ? 'device' : 'devices'}
              </Text>
            </View>
          </View>
        }
        ListFooterComponent={
          sessions.length > 1 ? (
            <TouchableOpacity
              style={[styles.logoutAllButton, { backgroundColor: theme.error + '15' }]}
              onPress={handleLogoutAllOther}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out" size={20} color={theme.error} />
              <Text style={[styles.logoutAllButtonText, { color: theme.error }]}>
                Logout All Other Devices
              </Text>
            </TouchableOpacity>
          ) : null
        }
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  sessionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  deviceDetails: {
    fontSize: 14,
    marginBottom: 8,
  },
  sessionMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutAllButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
