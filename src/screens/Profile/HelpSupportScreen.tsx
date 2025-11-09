import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SIZES } from '../../utils/constants';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface HelpSupportScreenProps {
  navigation: any;
}

export default function HelpSupportScreen({ navigation }: HelpSupportScreenProps) {
  const { theme } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I start a video call?',
      answer: 'Open any chat conversation and tap the video camera icon in the top right corner. Make sure you have granted camera and microphone permissions.',
    },
    {
      id: '2',
      question: 'How do I enable two-factor authentication?',
      answer: 'Go to Profile > Privacy & Security > Two-Factor Authentication. Follow the on-screen instructions to set up 2FA with your authenticator app.',
    },
    {
      id: '3',
      question: 'Can I customize chat themes and wallpapers?',
      answer: 'Yes! Open any chat, tap the menu icon, and select "Chat Wallpaper" or "Theme" to customize your chat appearance with different colors and backgrounds.',
    },
    {
      id: '4',
      question: 'How do I create and share stories?',
      answer: 'Go to the Stories tab and tap the "+" button or camera icon. You can add photos, videos, or text to create your story. Stories disappear after 24 hours.',
    },
    {
      id: '5',
      question: 'How do I delete messages?',
      answer: 'Long press on any message you sent, then select "Delete". You can delete messages for yourself or for everyone in the chat.',
    },
    {
      id: '6',
      question: 'What does end-to-end encryption mean?',
      answer: 'End-to-end encryption ensures that only you and the person you\'re communicating with can read your messages. Not even we can access your encrypted messages.',
    },
    {
      id: '7',
      question: 'How do I block or unblock someone?',
      answer: 'Open the contact\'s profile, scroll down and tap "Block Contact". To unblock, go to Privacy & Security > Blocked Contacts and tap on the contact.',
    },
    {
      id: '8',
      question: 'Can I export my chat history?',
      answer: 'Yes, open any chat, tap the menu icon, and select "Export Chat". You can export as a text file or PDF document.',
    },
    {
      id: '9',
      question: 'How do I change my notification settings?',
      answer: 'Go to Profile > Notifications. You can customize notification sounds, vibration, message previews, and more for different types of alerts.',
    },
    {
      id: '10',
      question: 'What should I do if I forgot my password?',
      answer: 'On the login screen, tap "Forgot Password?" and enter your registered email. You\'ll receive a password reset link via email.',
    },
  ];

  const toggleFAQ = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const contactSupport = () => {
    Linking.openURL('mailto:support@projectchat.com?subject=Support Request');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
            
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={contactSupport}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="mail" size={24} color={theme.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: theme.text }]}>Contact Support</Text>
                <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                  Get help from our support team
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate('LiveChat')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="chatbubbles" size={24} color={theme.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: theme.text }]}>Live Chat</Text>
                <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                  Chat with us in real-time
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate('UserGuide')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="document-text" size={24} color={theme.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: theme.text }]}>User Guide</Text>
                <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                  Learn how to use the app
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* FAQs */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Frequently Asked Questions
            </Text>
            
            {faqs.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={[
                  styles.faqCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  expandedId === faq.id && { borderColor: theme.primary },
                ]}
                onPress={() => toggleFAQ(faq.id)}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQuestion, { color: theme.text }]}>
                    {faq.question}
                  </Text>
                  <Ionicons
                    name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.textSecondary}
                  />
                </View>
                {expandedId === faq.id && (
                  <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                    {faq.answer}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional Resources */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Resources</Text>
            
            <TouchableOpacity
              style={[styles.resourceCard, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="globe" size={20} color={theme.primary} />
              <Text style={[styles.resourceText, { color: theme.text }]}>Visit Our Website</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resourceCard, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="logo-twitter" size={20} color={theme.primary} />
              <Text style={[styles.resourceText, { color: theme.text }]}>Follow Us on Twitter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resourceCard, { backgroundColor: theme.surface }]}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
              <Text style={[styles.resourceText, { color: theme.text }]}>Privacy Policy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resourceCard, { backgroundColor: theme.surface }]}
              onPress={() => navigation.navigate('TermsOfService')}
            >
              <Ionicons name="document" size={20} color={theme.primary} />
              <Text style={[styles.resourceText, { color: theme.text }]}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    paddingTop: 16,
  },
  section: {
    paddingHorizontal: SIZES.padding,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: SIZES.small,
  },
  faqCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: SIZES.body,
    fontWeight: '600',
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: SIZES.small,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  resourceText: {
    fontSize: SIZES.body,
    fontWeight: '500',
  },
});
