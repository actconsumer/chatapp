import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SIZES } from '../../utils/constants';

interface NotificationsScreenProps {
  navigation: any;
}

export default function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const { theme } = useTheme();

  const [settings, setSettings] = useState({
    pushNotifications: true,
    messageNotifications: true,
    groupNotifications: true,
    callNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    showPreview: true,
    inAppNotifications: true,
    emailNotifications: false,
    storyNotifications: true,
    reactionNotifications: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const NotificationToggle = ({
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
        value={settings[settingKey]}
        onValueChange={() => toggleSetting(settingKey)}
        trackColor={{ false: theme.border, true: theme.primary + '40' }}
        thumbColor={settings[settingKey] ? theme.primary : theme.textSecondary}
        ios_backgroundColor={theme.border}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Push Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            PUSH NOTIFICATIONS
          </Text>
          <NotificationToggle
            icon="notifications"
            title="Push Notifications"
            description="Enable push notifications for all activities"
            settingKey="pushNotifications"
          />
        </View>

        {/* Message Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            MESSAGE ALERTS
          </Text>
          <NotificationToggle
            icon="chatbubble"
            title="Message Notifications"
            description="Get notified about new messages"
            settingKey="messageNotifications"
          />
          <NotificationToggle
            icon="people"
            title="Group Notifications"
            description="Notifications for group messages"
            settingKey="groupNotifications"
          />
          <NotificationToggle
            icon="eye"
            title="Show Message Preview"
            description="Display message content in notifications"
            settingKey="showPreview"
          />
        </View>

        {/* Call Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            CALLS & MEDIA
          </Text>
          <NotificationToggle
            icon="call"
            title="Call Notifications"
            description="Get notified about incoming calls"
            settingKey="callNotifications"
          />
          <NotificationToggle
            icon="play-circle"
            title="Story Notifications"
            description="Notify when someone posts a story"
            settingKey="storyNotifications"
          />
          <NotificationToggle
            icon="heart"
            title="Reaction Notifications"
            description="Get notified when someone reacts to your message"
            settingKey="reactionNotifications"
          />
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            SOUND & VIBRATION
          </Text>
          <NotificationToggle
            icon="volume-high"
            title="Notification Sound"
            description="Play sound for notifications"
            settingKey="soundEnabled"
          />
          <NotificationToggle
            icon="phone-portrait"
            title="Vibration"
            description="Vibrate for notifications"
            settingKey="vibrationEnabled"
          />
        </View>

        {/* Other Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            OTHER SETTINGS
          </Text>
          <NotificationToggle
            icon="phone-portrait"
            title="In-App Notifications"
            description="Show notifications while using the app"
            settingKey="inAppNotifications"
          />
          <NotificationToggle
            icon="mail"
            title="Email Notifications"
            description="Receive notifications via email"
            settingKey="emailNotifications"
          />
        </View>

        <View style={{ height: 40 }} />
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
});
