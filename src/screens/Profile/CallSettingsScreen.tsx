/**
 * Call Settings Screen
 * Allows users to configure call quality settings (echo cancellation, resolution, audio/video devices)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { callService, CallSettings } from '../../services/call.service';
import { socketService } from '../../services/socket.service';

interface CallSettingsScreenProps {
  navigation: any;
}

export default function CallSettingsScreen({ navigation }: CallSettingsScreenProps) {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<CallSettings>({
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    videoBitrate: 1500,
    preferredResolution: '720p',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // TODO: Connect to Firebase backend
      console.log('TODO: Fetch call settings from Firebase');
      
      // Mock: Use default settings matching CallSettings interface
      const data: CallSettings = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        videoBitrate: 2000,
        preferredResolution: '720p',
      };
      setSettings(data);
    } catch (error) {
      console.error('Failed to load call settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof CallSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      setSaving(true);
      
      // TODO: Connect to Firebase backend
      console.log('TODO: Update call settings in Firebase:', { [key]: value });
      
      // Notify other devices via SignalR
      socketService.send('settings:updated', {
        type: 'call',
        settings: { [key]: value },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
      // Revert on error
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  const resolutions: Array<'360p' | '720p' | '1080p'> = ['360p', '720p', '1080p'];

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Call Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Audio Settings */}
        <View
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            AUDIO SETTINGS
          </Text>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="mic-off-outline" size={22} color={theme.text} />
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    Echo Cancellation
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Reduces echo during calls
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.echoCancellation}
                onValueChange={(value) => updateSetting('echoCancellation', value)}
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={settings.echoCancellation ? theme.primary : theme.surface}
                disabled={saving}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="volume-mute-outline" size={22} color={theme.text} />
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    Noise Suppression
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Filters background noise
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.noiseSuppression}
                onValueChange={(value) => updateSetting('noiseSuppression', value)}
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={settings.noiseSuppression ? theme.primary : theme.surface}
                disabled={saving}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="volume-high-outline" size={22} color={theme.text} />
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    Auto Gain Control
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Automatically adjust volume levels
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.autoGainControl}
                onValueChange={(value) => updateSetting('autoGainControl', value)}
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={settings.autoGainControl ? theme.primary : theme.surface}
                disabled={saving}
              />
            </View>
          </View>
        </View>

        {/* Video Settings */}
        <View
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            VIDEO SETTINGS
          </Text>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Preferred Resolution
            </Text>
            <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
              Higher resolution uses more data
            </Text>

            <View style={styles.resolutionOptions}>
              {resolutions.map((resolution) => (
                <TouchableOpacity
                  key={resolution}
                  style={[
                    styles.resolutionOption,
                    {
                      backgroundColor:
                        settings.preferredResolution === resolution
                          ? theme.primary + '20'
                          : theme.surface,
                      borderColor:
                        settings.preferredResolution === resolution
                          ? theme.primary
                          : theme.border,
                    },
                  ]}
                  onPress={() => updateSetting('preferredResolution', resolution)}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.resolutionText,
                      {
                        color:
                          settings.preferredResolution === resolution
                            ? theme.primary
                            : theme.text,
                      },
                    ]}
                  >
                    {resolution}
                  </Text>
                  {settings.preferredResolution === resolution && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View
          style={[styles.infoCard, { backgroundColor: theme.primary + '15' }]}
        >
          <Ionicons name="information-circle" size={24} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.text }]}>
            Settings are synced across all your devices. Changes apply to future calls.
          </Text>
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
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  resolutionOptions: {
    gap: 12,
  },
  resolutionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  resolutionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
