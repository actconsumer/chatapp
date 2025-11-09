import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SIZES } from '../../utils/constants';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { theme, isDark, setThemeMode, themeMode } = useTheme();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const getLanguageDisplayName = () => {
    return i18n.language === 'ne' ? 'नेपाली (Nepali)' : 'English';
  };

  const handleLogout = async () => {
    await logout();
  };

  const toggleTheme = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('auto');
    } else {
      setThemeMode('light');
    }
  };

  const changeProfilePicture = () => {
    Alert.alert(
      t('profile.selectPhoto'),
      t('common.select'),
      [
        {
          text: t('profile.takePhoto'),
          onPress: () => {
            // Camera functionality would go here
            Alert.alert(t('common.info'), t('common.featureComingSoon'));
          },
        },
        {
          text: t('common.chooseFromGallery'),
          onPress: () => {
            // Gallery functionality would go here
            Alert.alert(t('common.info'), t('common.featureComingSoon'));
          },
        },
        {
          text: 'Remove Photo',
          style: 'destructive',
          onPress: () => setProfileImage(null),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('chat.profile')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
          <Ionicons name="create-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={changeProfilePicture} activeOpacity={0.7}>
          <View style={[styles.avatarLarge, { backgroundColor: theme.surface }]}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={theme.gradient}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
            )}
            <View style={[styles.editBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={[styles.displayName, { color: theme.text }]}>{user?.displayName}</Text>
        <Text style={[styles.username, { color: theme.textSecondary }]}>@{user?.username}</Text>
        <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email}</Text>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('profile.settings').toUpperCase()}</Text>
        
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={toggleTheme}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={theme.primary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>{t('profile.theme')}</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
              {themeMode === 'auto' ? t('profile.themeAuto') : themeMode === 'dark' ? t('profile.darkMode') : t('profile.lightMode')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('Notifications')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
              <Ionicons name="notifications-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>{t('profile.notifications')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('Privacy')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
              <Ionicons name="lock-closed-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>{t('profile.privacy')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('TwoFactorAuth')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>{t('profile.twoFactorAuth')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Security & Devices */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SECURITY & DEVICES</Text>
        
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('LoginActivity')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
              <Ionicons name="phone-portrait-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>Login Activity</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('CallSettingsProfile')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
              <Ionicons name="call-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>Call Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('profile.accountSettings').toUpperCase()}</Text>
        
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
              <Ionicons name="person-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>{t('profile.editProfile')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('Language')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
              <Ionicons name="language-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>{t('profile.language')}</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{getLanguageDisplayName()}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('profile.about').toUpperCase()}</Text>
        
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('HelpSupport')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
              <Ionicons name="help-circle-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>{t('profile.helpSupport')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('About')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
              <Ionicons name="information-circle-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>{t('profile.about')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.card, borderColor: theme.error }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color={theme.error} />
        <Text style={[styles.logoutText, { color: theme.error }]}>{t('common.logout')}</Text>
      </TouchableOpacity>

      {/* Developer Navigation Button */}
      <TouchableOpacity
        style={[styles.devButton, { backgroundColor: theme.surface, borderColor: theme.primary }]}
        onPress={() => navigation.navigate('DevNavigation')}
      >
        <Ionicons name="bug" size={20} color={theme.primary} />
        <Text style={[styles.devButtonText, { color: theme.primary }]}>
          Developer: Test All Screens
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: SIZES.padding,
  },
  headerTitle: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  displayName: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: SIZES.body,
    marginBottom: 4,
  },
  email: {
    fontSize: SIZES.small,
  },
  section: {
    paddingHorizontal: SIZES.padding,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: SIZES.tiny,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    flex: 1,
  },
  settingValue: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    marginHorizontal: SIZES.padding,
    marginBottom: 32,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: SIZES.padding,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
  },
  devButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
