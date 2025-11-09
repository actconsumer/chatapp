import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function PrivacyPolicyScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const isNepali = i18n.language === 'ne';

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {isNepali ? 'गोपनीयता नीति' : 'Privacy Policy'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
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
            <Ionicons name="shield-checkmark" size={32} color="#fff" />
          </LinearGradient>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            {isNepali ? 'तपाईंको गोपनीयता महत्त्वपूर्ण छ' : 'Your Privacy Matters'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            {isNepali ? 'अन्तिम अपडेट: नोभेम्बर ७, २०२५' : 'Last updated: November 7, 2025'}
          </Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {isNepali ? 'परिचय' : 'Introduction'}
          </Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            {isNepali
              ? 'हाम्रो च्याट एप्लिकेसनमा स्वागत छ। हामी तपाईंको गोपनीयता संरक्षण गर्न र तपाईंको व्यक्तिगत जानकारीको सुरक्षा सुनिश्चित गर्न प्रतिबद्ध छौं। यो गोपनीयता नीतिले तपाईंले हाम्रो सन्देश सेवाहरू प्रयोग गर्दा हामीले तपाईंको डेटा कसरी सङ्कलन, प्रयोग, प्रकट र सुरक्षित गर्छौं भन्ने व्याख्या गर्दछ।'
              : 'Welcome to our chat application. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our messaging services.'}
          </Text>
        </View>

        {/* Information We Collect */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {isNepali ? 'हामीले सङ्कलन गर्ने जानकारी' : 'Information We Collect'}
          </Text>
          
          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>
              {isNepali ? '१. व्यक्तिगत जानकारी' : '1. Personal Information'}
            </Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              {isNepali
                ? '• खाता जानकारी (नाम, इमेल, फोन नम्बर)\n• प्रोफाइल तस्वीर र प्रदर्शन नाम\n• उपकरण जानकारी र पहिचानकर्ताहरू\n• IP ठेगाना र स्थान डेटा (तपाईंको अनुमतिसँग)'
                : '• Account information (name, email, phone number)\n• Profile picture and display name\n• Device information and identifiers\n• IP address and location data (with your permission)'}
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>
              {isNepali ? '२. प्रयोग डेटा' : '2. Usage Data'}
            </Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              {isNepali
                ? '• तपाईंले पठाउने सन्देशहरू र मिडिया (एन्क्रिप्टेड)\n• कल लगहरू र अवधि\n• कथाहरू र स्थिति अद्यावधिकहरू\n• एप प्रयोग ढाँचा र प्राथमिकताहरू'
                : '• Messages and media you send (encrypted)\n• Call logs and duration\n• Stories and status updates\n• App usage patterns and preferences'}
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>
              {isNepali ? '३. प्राविधिक डेटा' : '3. Technical Data'}
            </Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              {isNepali
                ? '• उपकरण प्रकार, अपरेटिङ सिस्टम, र एप संस्करण\n• नेटवर्क जडान प्रकार\n• प्रदर्शन डेटा र क्र्यास रिपोर्टहरू\n• कुकीज र समान ट्र्याकिङ प्रविधिहरू'
                : '• Device type, operating system, and app version\n• Network connection type\n• Performance data and crash reports\n• Cookies and similar tracking technologies'}
            </Text>
          </View>
        </View>

        {/* How We Use Your Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {isNepali ? 'हामी तपाईंको जानकारी कसरी प्रयोग गर्छौं' : 'How We Use Your Information'}
          </Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            {isNepali
              ? 'हामी तपाईंको जानकारी यसका लागि प्रयोग गर्छौं:\n\n• हाम्रो सन्देश सेवाहरू प्रदान र कायम राख्न\n• प्रयोगकर्ताहरू बीच संचार सक्षम गर्न\n• एप प्रदर्शन र प्रयोगकर्ता अनुभव सुधार गर्न\n• महत्त्वपूर्ण सूचनाहरू र अद्यावधिकहरू पठाउन\n• धोखाधडी रोक्न र सुरक्षा बढाउन\n• कानूनी दायित्वहरू पालना गर्न\n• सेवा सुधारको लागि प्रयोग ढाँचाहरू विश्लेषण गर्न'
              : 'We use your information to:\n\n• Provide and maintain our messaging services\n• Enable communication between users\n• Improve app performance and user experience\n• Send important notifications and updates\n• Prevent fraud and enhance security\n• Comply with legal obligations\n• Analyze usage patterns for service improvement'}
          </Text>
        </View>

        {/* End-to-End Encryption */}
        <View style={[styles.highlightSection, { backgroundColor: theme.surface }]}>
          <Ionicons name="lock-closed" size={24} color={theme.primary} />
          <Text style={[styles.highlightTitle, { color: theme.text }]}>
            {isNepali ? 'एन्ड-टु-एन्ड एन्क्रिप्शन' : 'End-to-End Encryption'}
          </Text>
          <Text style={[styles.highlightText, { color: theme.textSecondary }]}>
            {isNepali
              ? 'तपाईंका सबै सन्देशहरू, कलहरू, र साझा गरिएका मिडियाहरू एन्ड-टु-एन्ड एन्क्रिप्शनद्वारा सुरक्षित छन्। यसको मतलब तपाईं र तपाईंले संचार गरिरहनुभएको व्यक्तिले मात्र तिनीहरूलाई पढ्न वा सुन्न सक्नुहुन्छ। हामी पनि तपाईंको एन्क्रिप्टेड सामग्री पहुँच गर्न सक्दैनौं।'
              : 'All your messages, calls, and shared media are protected with end-to-end encryption. This means only you and the person you\'re communicating with can read or listen to them. Not even we can access your encrypted content.'}
          </Text>
        </View>

        {/* Data Sharing */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Sharing and Disclosure</Text>
          
          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>We DO NOT sell your data</Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              Your personal information is never sold to third parties for marketing or advertising purposes.
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>Limited Sharing</Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              We may share limited data with:{'\n\n'}
              • Service providers (cloud hosting, analytics){'\n'}
              • Legal authorities (when required by law){'\n'}
              • Business partners (with your explicit consent){'\n'}
              • Other users (profile info you choose to share)
            </Text>
          </View>
        </View>

        {/* Your Rights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Privacy Rights</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            You have the right to:{'\n\n'}
            ✓ Access your personal data{'\n'}
            ✓ Correct inaccurate information{'\n'}
            ✓ Delete your account and data{'\n'}
            ✓ Export your data{'\n'}
            ✓ Opt-out of marketing communications{'\n'}
            ✓ Control privacy settings{'\n'}
            ✓ Withdraw consent at any time
          </Text>
        </View>

        {/* Data Retention */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Retention</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            • Messages: Stored until you delete them or deactivate your account{'\n'}
            • Stories: Automatically deleted after 24 hours{'\n'}
            • Account data: Retained until account deletion{'\n'}
            • Backup data: Deleted 30 days after account deletion{'\n'}
            • Legal holds: May be retained longer if required by law
          </Text>
        </View>

        {/* Security Measures */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Security Measures</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            We implement industry-standard security measures:{'\n\n'}
            • End-to-end encryption for all messages{'\n'}
            • Two-factor authentication (2FA){'\n'}
            • Secure data transmission (SSL/TLS){'\n'}
            • Regular security audits{'\n'}
            • Encrypted cloud backups{'\n'}
            • Biometric authentication support{'\n'}
            • Security code verification for chats
          </Text>
        </View>

        {/* Third-Party Services */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Third-Party Services</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            Our app uses third-party services for:{'\n\n'}
            • Cloud storage and backups{'\n'}
            • Push notifications{'\n'}
            • Analytics and crash reporting{'\n'}
            • Payment processing (if applicable){'\n\n'}
            These services have their own privacy policies. We carefully select partners who meet our security standards.
          </Text>
        </View>

        {/* Children's Privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Children's Privacy</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected data from a child, please contact us immediately.
          </Text>
        </View>

        {/* International Data Transfers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>International Data Transfers</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
          </Text>
        </View>

        {/* Changes to Privacy Policy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Changes to This Policy</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            We may update this Privacy Policy from time to time. We will notify you of any significant changes by:{'\n\n'}
            • In-app notification{'\n'}
            • Email notification{'\n'}
            • Prominent notice in the app{'\n\n'}
            Your continued use of the service after changes constitutes acceptance of the updated policy.
          </Text>
        </View>

        {/* Contact Us */}
        <View style={[styles.contactSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {isNepali ? 'हामीलाई सम्पर्क गर्नुहोस्' : 'Contact Us'}
          </Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            {isNepali
              ? 'यदि तपाईंसँग यो गोपनीयता नीति वा तपाईंको डेटाको बारेमा प्रश्नहरू छन् भने:'
              : 'If you have questions about this Privacy Policy or your data:'}
          </Text>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={20} color={theme.primary} />
            <Text style={[styles.contactText, { color: theme.primary }]}>privacy@chatapp.com</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="globe-outline" size={20} color={theme.primary} />
            <Text style={[styles.contactText, { color: theme.primary }]}>www.chatapp.com/privacy</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="location-outline" size={20} color={theme.primary} />
            <Text style={[styles.contactText, { color: theme.textSecondary }]}>
              123 Tech Street, San Francisco, CA 94105
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
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
    marginBottom: 24,
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
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  subsection: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  highlightSection: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 28,
    alignItems: 'center',
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  highlightText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  contactSection: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    flex: 1,
  },
  bottomSpacing: {
    height: 20,
  },
});
