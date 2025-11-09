import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { usePrivacy } from '../../context/PrivacyContext';
import { SIZES } from '../../utils/constants';
import { privacyService } from '../../services/privacy.service';
import type { PrivacySettings } from '../../services/privacy.service';
import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';

interface PrivacyScreenProps {
  navigation: any;
}

export default function PrivacyScreen({ navigation }: PrivacyScreenProps) {
  const { theme } = useTheme();
  const { settings, loading: privacyLoading, refresh, updateSettings } = usePrivacy();

  const [blockedCount, setBlockedCount] = useState(0);
  const [screenLoading, setScreenLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [microphonePermission, setMicrophonePermission] = useState<boolean | null>(null);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<boolean | null>(null);

  useEffect(() => {
    loadPrivacySettings();
    checkPermissions();
  }, [refresh]);

  const loadPrivacySettings = async () => {
    try {
      setScreenLoading(true);
      const [, blockedUsers] = await Promise.all([
        refresh(),
        privacyService.getBlockedUsers(),
      ]);

      setBlockedCount(blockedUsers.length);
    } catch (error) {
      console.error('Load privacy settings error:', error);
      Alert.alert('Error', 'Failed to load privacy settings');
    } finally {
      setScreenLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      const [cameraStatus, audioStatus, mediaStatus] = await Promise.all([
        Camera.Camera.getCameraPermissionsAsync(),
        Audio.getPermissionsAsync(),
        MediaLibrary.getPermissionsAsync(),
      ]);

      setCameraPermission(cameraStatus.granted);
      setMicrophonePermission(audioStatus.granted);
      setMediaLibraryPermission(mediaStatus.granted);
    } catch (error) {
      console.error('Check permissions error:', error);
    }
  };

  const toggleSetting = async (key: keyof PrivacySettings) => {
    const currentValue = settings[key];
    const newValue = typeof currentValue === 'boolean' ? !currentValue : currentValue;

    try {
      setUpdating(true);
      await updateSettings({ [key]: newValue } as Partial<PrivacySettings>);
    } catch (error: any) {
      console.error('Toggle setting error:', error);
      Alert.alert('Error', error?.message || 'Failed to update setting');
    } finally {
      setUpdating(false);
    }
  };

  const updateVisibilitySetting = async (
    key: 'profilePhotoVisibility' | 'lastSeenVisibility' | 'statusVisibility',
    value: 'everyone' | 'contacts' | 'nobody'
  ) => {
    try {
      setUpdating(true);
      await updateSettings({ [key]: value } as Partial<PrivacySettings>);
    } catch (error: any) {
      console.error('Update visibility error:', error);
      Alert.alert('Error', error?.message || 'Failed to update visibility setting');
    } finally {
      setUpdating(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
      
      if (status === 'granted') {
        Alert.alert('Success', 'Camera permission granted');
      } else {
        Alert.alert('Permission Denied', 'Camera permission is required for video calls');
      }
    } catch (error) {
      console.error('Request camera permission error:', error);
      Alert.alert('Error', 'Failed to request camera permission');
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setMicrophonePermission(status === 'granted');
      
      if (status === 'granted') {
        Alert.alert('Success', 'Microphone permission granted');
      } else {
        Alert.alert('Permission Denied', 'Microphone permission is required for calls');
      }
    } catch (error) {
      console.error('Request microphone permission error:', error);
      Alert.alert('Error', 'Failed to request microphone permission');
    }
  };

  const requestMediaLibraryPermission = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaLibraryPermission(status === 'granted');
      
      if (status === 'granted') {
        Alert.alert('Success', 'Media library permission granted');
      } else {
        Alert.alert('Permission Denied', 'Media library permission is required for sharing photos');
      }
    } catch (error) {
      console.error('Request media library permission error:', error);
      Alert.alert('Error', 'Failed to request media library permission');
    }
  };

  const showVisibilityOptions = (
    title: string,
    currentValue: string,
    onSelect: (value: 'everyone' | 'contacts' | 'nobody') => void
  ) => {
    Alert.alert(
      title,
      'Choose who can see this information',
      [
        {
          text: 'Everyone',
          onPress: () => onSelect('everyone'),
          style: currentValue === 'everyone' ? 'default' : 'cancel',
        },
        {
          text: 'My Contacts',
          onPress: () => onSelect('contacts'),
          style: currentValue === 'contacts' ? 'default' : 'cancel',
        },
        {
          text: 'Nobody',
          onPress: () => onSelect('nobody'),
          style: currentValue === 'nobody' ? 'default' : 'cancel',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const formatVisibilityValue = (value: string): string => {
    switch (value) {
      case 'everyone':
        return 'Everyone';
      case 'contacts':
        return 'My Contacts';
      case 'nobody':
        return 'Nobody';
      default:
        return value;
    }
  };

  const PrivacyOption = ({
    icon,
    title,
    description,
    value,
    onPress,
  }: {
    icon: string;
    title: string;
    description: string;
    value?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
          <Ionicons name={icon as any} size={22} color={theme.primary} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            {description}
          </Text>
        </View>
      </View>
      {value ? (
        <View style={styles.valueContainer}>
          <Text style={[styles.valueText, { color: theme.textSecondary }]}>{value}</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );

  const PrivacyToggle = ({
    icon,
    title,
    description,
    settingKey,
  }: {
    icon: string;
    title: string;
    description: string;
    settingKey: keyof typeof settings;
  }) => (
    <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
          <Ionicons name={icon as any} size={22} color={theme.primary} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={settings[settingKey] as boolean}
        onValueChange={() => toggleSetting(settingKey)}
        trackColor={{ false: theme.border, true: theme.primary + '40' }}
        thumbColor={settings[settingKey] ? theme.primary : theme.textSecondary}
        ios_backgroundColor={theme.border}
        disabled={updating}
      />
    </View>
  );

  const requestVideoPermission = async () => {
    await requestCameraPermission();
  };

  const requestAudioPermission = async () => {
    await requestMicrophonePermission();
  };

  if (screenLoading || privacyLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy & Security</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading privacy settings...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy & Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Permissions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            PERMISSIONS
          </Text>
          
          <TouchableOpacity
            style={[styles.permissionCard, { 
              backgroundColor: cameraPermission ? theme.surface : theme.card, 
              borderColor: cameraPermission ? theme.primary : theme.border 
            }]}
            onPress={requestVideoPermission}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { 
                backgroundColor: cameraPermission ? theme.primary + '20' : theme.surface 
              }]}>
                <Ionicons 
                  name={cameraPermission ? "videocam" : "videocam-off"} 
                  size={22} 
                  color={cameraPermission ? theme.primary : theme.textSecondary} 
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Camera Permission
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  {cameraPermission ? 'Camera access granted' : 'Required for video calls'}
                </Text>
              </View>
            </View>
            {cameraPermission ? (
              <Ionicons name="checkmark-circle" size={24} color={theme.success} />
            ) : (
              <Text style={[styles.grantButton, { color: theme.primary }]}>Grant</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.permissionCard, { 
              backgroundColor: microphonePermission ? theme.surface : theme.card, 
              borderColor: microphonePermission ? theme.primary : theme.border 
            }]}
            onPress={requestAudioPermission}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { 
                backgroundColor: microphonePermission ? theme.primary + '20' : theme.surface 
              }]}>
                <Ionicons 
                  name={microphonePermission ? "mic" : "mic-off"} 
                  size={22} 
                  color={microphonePermission ? theme.primary : theme.textSecondary} 
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Microphone Permission
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  {microphonePermission ? 'Microphone access granted' : 'Required for voice & video calls'}
                </Text>
              </View>
            </View>
            {microphonePermission ? (
              <Ionicons name="checkmark-circle" size={24} color={theme.success} />
            ) : (
              <Text style={[styles.grantButton, { color: theme.primary }]}>Grant</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Who Can See Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            WHO CAN SEE
          </Text>
          <PrivacyOption
            icon="image"
            title="Profile Photo"
            description="Control who can see your profile photo"
            value={formatVisibilityValue(settings.profilePhotoVisibility)}
            onPress={() => showVisibilityOptions(
              'Profile Photo Visibility',
              settings.profilePhotoVisibility,
              (value) => updateVisibilitySetting('profilePhotoVisibility', value)
            )}
          />
          <PrivacyOption
            icon="time"
            title="Last Seen"
            description="Control who can see when you were last online"
            value={formatVisibilityValue(settings.lastSeenVisibility)}
            onPress={() => showVisibilityOptions(
              'Last Seen Visibility',
              settings.lastSeenVisibility,
              (value) => updateVisibilitySetting('lastSeenVisibility', value)
            )}
          />
          <PrivacyOption
            icon="information-circle"
            title="Status"
            description="Control who can see your status"
            value={formatVisibilityValue(settings.statusVisibility)}
            onPress={() => showVisibilityOptions(
              'Status Visibility',
              settings.statusVisibility,
              (value) => updateVisibilitySetting('statusVisibility', value)
            )}
          />
        </View>

        {/* Activity Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            ACTIVITY
          </Text>
          <PrivacyToggle
            icon="checkmark-done"
            title="Read Receipts"
            description="Allow others to see when you've read their messages"
            settingKey="readReceipts"
          />
          <PrivacyToggle
            icon="radio-button-on"
            title="Online Status"
            description="Show when you're online"
            settingKey="onlineStatus"
          />
          <PrivacyToggle
            icon="create"
            title="Typing Indicator"
            description="Show when you're typing a message"
            settingKey="typingIndicator"
          />
        </View>

        {/* Communication Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            COMMUNICATION
          </Text>
          <PrivacyToggle
            icon="call"
            title="Allow Calls"
            description="Let contacts call you"
            settingKey="allowCalls"
          />
          <PrivacyToggle
            icon="people"
            title="Group Invites"
            description="Allow others to add you to groups"
            settingKey="allowGroupInvites"
          />
        </View>

        {/* Security Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            SECURITY
          </Text>
          <PrivacyOption
            icon="shield-checkmark"
            title="Two-Factor Authentication"
            description="Add an extra layer of security"
            onPress={() => navigation.navigate('TwoFactorAuth')}
          />
          <PrivacyOption
            icon="lock-closed"
            title="Blocked Contacts"
            description="Manage blocked users"
            value="0"
            onPress={() => {}}
          />
          <PrivacyOption
            icon="key"
            title="Security Code"
            description="View or scan security QR code"
            onPress={() => navigation.navigate('SecurityCode')}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
    paddingHorizontal: SIZES.padding,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: SIZES.padding,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: SIZES.tiny,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: SIZES.small,
    lineHeight: 18,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  grantButton: {
    fontSize: SIZES.body,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.body,
    marginTop: 16,
  },
});
