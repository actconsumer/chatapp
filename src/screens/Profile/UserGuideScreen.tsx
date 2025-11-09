import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GuideSection {
  id: string;
  icon: string;
  title: string;
  description: string;
  steps: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: '1',
    icon: 'person-add',
    title: 'Getting Started',
    description: 'Create your account and set up your profile',
    steps: [
      'Download and open the app',
      'Tap "Sign Up" to create a new account',
      'Enter your phone number or email',
      'Verify your account with the code sent',
      'Set up your profile name and picture',
      'Start chatting with friends!',
    ],
  },
  {
    id: '2',
    icon: 'chatbubbles',
    title: 'Sending Messages',
    description: 'Learn how to send text, media, and voice messages',
    steps: [
      'Open a chat by tapping on a contact',
      'Type your message in the input field',
      'Tap the emoji icon to add emojis',
      'Tap the attachment icon for media',
      'Hold the mic icon to record voice',
      'Tap send to deliver your message',
    ],
  },
  {
    id: '3',
    icon: 'image',
    title: 'Sharing Media',
    description: 'Share photos, videos, and files with ease',
    steps: [
      'Tap the attachment (+ icon) in chat',
      'Select Camera to take a photo/video',
      'Select Gallery for existing media',
      'Select File for documents',
      'Preview your selection',
      'Add a caption if desired',
      'Tap send to share',
    ],
  },
  {
    id: '4',
    icon: 'call',
    title: 'Voice & Video Calls',
    description: 'Make crystal-clear voice and video calls',
    steps: [
      'Open a chat conversation',
      'Tap the phone icon for voice call',
      'Tap the video icon for video call',
      'Grant camera/mic permissions',
      'Wait for the other person to answer',
      'Use controls to mute, switch camera, etc.',
      'Tap end call when finished',
    ],
  },
  {
    id: '5',
    icon: 'people',
    title: 'Group Chats',
    description: 'Create and manage group conversations',
    steps: [
      'Tap the "+" button on chat list',
      'Select "New Group" option',
      'Choose group participants',
      'Set group name and icon',
      'Tap create to start the group',
      'Add more members anytime',
      'Manage admin settings if admin',
    ],
  },
  {
    id: '6',
    icon: 'color-wand',
    title: 'Stories',
    description: 'Share moments that disappear in 24 hours',
    steps: [
      'Tap the "+" icon in Stories tab',
      'Choose photo, video, or text story',
      'Add text, stickers, or drawings',
      'Customize background colors',
      'Preview your story',
      'Tap "Post" to share',
      'View who saw your story',
    ],
  },
  {
    id: '7',
    icon: 'shield-checkmark',
    title: 'Privacy & Security',
    description: 'Protect your account and conversations',
    steps: [
      'Go to Profile > Privacy',
      'Enable Two-Factor Authentication',
      'Set who can see your profile info',
      'Control read receipts and typing',
      'Block unwanted contacts',
      'Verify security codes in chats',
      'Review active sessions regularly',
    ],
  },
  {
    id: '8',
    icon: 'lock-closed',
    title: 'End-to-End Encryption',
    description: 'Your messages are always private',
    steps: [
      'All messages are encrypted by default',
      'Only you and recipient can read them',
      'Verify encryption with security code',
      'Look for lock icon in chats',
      'Nobody else can access your messages',
      'Not even we can read them',
    ],
  },
  {
    id: '9',
    icon: 'settings',
    title: 'Customization',
    description: 'Personalize your chat experience',
    steps: [
      'Go to Profile > Settings',
      'Choose light or dark theme',
      'Select your language preference',
      'Customize notification sounds',
      'Set chat wallpapers',
      'Adjust font size and bubbles',
      'Enable/disable features you need',
    ],
  },
  {
    id: '10',
    icon: 'notifications',
    title: 'Notifications',
    description: 'Manage your notification preferences',
    steps: [
      'Go to Profile > Notifications',
      'Toggle notification types on/off',
      'Customize sounds for messages',
      'Set quiet hours (Do Not Disturb)',
      'Choose vibration patterns',
      'Manage group notification muting',
      'Preview messages in notifications',
    ],
  },
];

export default function UserGuideScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const filteredSections = GUIDE_SECTIONS.filter(
    section =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const renderSection = (section: GuideSection) => {
    const isExpanded = expandedSections.has(section.id);

    return (
      <TouchableOpacity
        key={section.id}
        style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => toggleSection(section.id)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name={section.icon as any} size={24} color={theme.primary} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
              {section.description}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.textSecondary}
          />
        </View>

        {isExpanded && (
          <View style={[styles.stepsContainer, { borderTopColor: theme.border }]}>
            {section.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>User Guide</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: theme.surface }]}>
          <LinearGradient
            colors={theme.gradient}
            style={styles.heroIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="book" size={32} color="#fff" />
          </LinearGradient>
          <Text style={[styles.heroTitle, { color: theme.text }]}>How Can We Help?</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            Learn everything about using our app
          </Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.inputBackground }]}>
          <Ionicons name="search" size={20} color={theme.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search topics..."
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.placeholder} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <Ionicons name="chatbubbles" size={28} color={theme.primary} />
            <Text style={[styles.quickActionText, { color: theme.text }]}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate('About')}
          >
            <Ionicons name="information-circle" size={28} color={theme.primary} />
            <Text style={[styles.quickActionText, { color: theme.text }]}>About App</Text>
          </TouchableOpacity>
        </View>

        {/* Guide Sections */}
        <View style={styles.sectionsContainer}>
          <Text style={[styles.sectionsTitle, { color: theme.text }]}>
            Browse Topics ({filteredSections.length})
          </Text>
          {filteredSections.map(renderSection)}
        </View>

        {/* Need More Help */}
        <View style={[styles.helpSection, { backgroundColor: theme.surface }]}>
          <Ionicons name="help-circle" size={32} color={theme.primary} />
          <Text style={[styles.helpTitle, { color: theme.text }]}>Still Need Help?</Text>
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            Our support team is here 24/7 to assist you
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <LinearGradient
              colors={theme.gradient}
              style={styles.contactButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.contactButtonText}>Contact Support</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
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
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionsContainer: {
    marginBottom: 20,
  },
  sectionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
  },
  stepsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 2,
  },
  helpSection: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  contactButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});
