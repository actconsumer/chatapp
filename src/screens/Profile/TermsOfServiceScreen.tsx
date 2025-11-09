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

export default function TermsOfServiceScreen({ navigation }: any) {
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
          {isNepali ? 'सेवा सर्तहरू' : 'Terms of Service'}
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
            <Ionicons name="document-text" size={32} color="#fff" />
          </LinearGradient>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            {isNepali ? 'सेवा सर्तहरू' : 'Terms of Service'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            {isNepali ? 'प्रभावकारी मिति: नोभेम्बर ७, २०२५' : 'Effective Date: November 7, 2025'}
          </Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {isNepali ? '१. सर्तहरूमा सहमति' : '1. Agreement to Terms'}
          </Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            {isNepali
              ? 'हाम्रो च्याट एप्लिकेसन ("सेवा") प्रयोग गरेर, तपाईं यी सेवा सर्तहरू ("सर्तहरू") द्वारा बाध्य हुन सहमत हुनुहुन्छ। यदि तपाईं यी सर्तहरूको कुनै पनि भागसँग असहमत हुनुहुन्छ भने, तपाईं सेवा प्रयोग गर्न सक्नुहुन्न।'
              : 'By accessing or using our chat application ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.'}
          </Text>
        </View>

        {/* User Accounts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {isNepali ? '२. प्रयोगकर्ता खाताहरू' : '2. User Accounts'}
          </Text>
          
          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>
              {isNepali ? '२.१ खाता सिर्जना' : '2.1 Account Creation'}
            </Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              {isNepali
                ? '• खाता सिर्जना गर्न तपाईं कम्तिमा १३ वर्षको हुनुपर्छ\n• तपाईंले सही र पूर्ण जानकारी प्रदान गर्नुपर्छ\n• तपाईं खाता सुरक्षा कायम राख्न जिम्मेवार हुनुहुन्छ\n• एक व्यक्तिले एकभन्दा बढी खाता राख्न सक्दैन\n• तपाईंले आफ्नो खाता अरूलाई हस्तान्तरण गर्न सक्नुहुन्न'
                : '• You must be at least 13 years old to create an account\n• You must provide accurate and complete information\n• You are responsible for maintaining account security\n• One person may not maintain more than one account\n• You may not transfer your account to others'}
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>
              {isNepali ? '२.२ खाता सुरक्षा' : '2.2 Account Security'}
            </Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              {isNepali
                ? 'तपाईं यसका लागि जिम्मेवार हुनुहुन्छ:\n\n• आफ्नो पासवर्ड र लगइन प्रमाणहरू सुरक्षित राख्ने\n• तपाईंको खाता अन्तर्गत हुने सबै गतिविधिहरू\n• कुनै अनधिकृत प्रयोगको तुरुन्त सूचना दिने\n• दुई-कारक प्रमाणीकरण सक्षम गर्ने (सिफारिस गरिएको)'
                : 'You are responsible for:\n\n• Safeguarding your password and login credentials\n• All activities that occur under your account\n• Notifying us immediately of any unauthorized use\n• Enabling two-factor authentication (recommended)'}
            </Text>
          </View>
        </View>

        {/* Acceptable Use */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {isNepali ? '३. स्वीकार्य प्रयोग नीति' : '3. Acceptable Use Policy'}
          </Text>
          
          <View style={[styles.warningBox, { backgroundColor: theme.surface, borderLeftColor: theme.error }]}>
            <Ionicons name="warning" size={20} color={theme.error} />
            <Text style={[styles.warningText, { color: theme.text }]}>
              {isNepali ? 'निषेधित गतिविधिहरू' : 'Prohibited Activities'}
            </Text>
          </View>

          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            {isNepali
              ? 'तपाईं यी कामहरू नगर्न सहमत हुनुहुन्छ:\n\n✗ अरूलाई उत्पीडन, धम्की वा हानि गर्ने\n✗ अवैध, हानिकारक, वा आपत्तिजनक सामग्री साझा गर्ने\n✗ अरूको नक्कल गर्ने वा नक्कली खाताहरू सिर्जना गर्ने\n✗ स्प्याम, घोटाला, वा धोखाधडी गतिविधिहरूमा संलग्न हुने\n✗ म्यालवेयर वा भाइरस वितरण गर्ने\n✗ बौद्धिक सम्पत्ति अधिकार उल्लंघन गर्ने\n✗ सेवा ह्याक वा सम्झौता गर्ने प्रयास गर्ने\n✗ नाबालिगहरूसँग स्पष्ट वा वयस्क सामग्री साझा गर्ने\n✗ कुनै पनि अवैध गतिविधिहरूमा संलग्न हुने\n✗ अनुमति बिना प्रयोगकर्ता डेटा स्क्र्याप वा फसल गर्ने'
              : 'You agree NOT to:\n\n✗ Harass, threaten, or harm others\n✗ Share illegal, harmful, or offensive content\n✗ Impersonate others or create fake accounts\n✗ Spam, scam, or engage in fraudulent activities\n✗ Distribute malware or viruses\n✗ Violate intellectual property rights\n✗ Attempt to hack or compromise the Service\n✗ Share explicit or adult content with minors\n✗ Engage in any illegal activities\n✗ Scrape or harvest user data without permission'}
          </Text>
        </View>

        {/* User Content */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>4. User Content</Text>
          
          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>4.1 Your Content</Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              • You retain ownership of content you create{'\n'}
              • You grant us license to store and transmit your content{'\n'}
              • You are responsible for the content you share{'\n'}
              • We may remove content that violates these Terms{'\n'}
              • Deleted content may persist in backups for up to 30 days
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>4.2 Content Standards</Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              All content must:{'\n\n'}
              ✓ Comply with applicable laws{'\n'}
              ✓ Respect others' rights and privacy{'\n'}
              ✓ Be accurate and not misleading{'\n'}
              ✓ Not infringe intellectual property{'\n'}
              ✓ Be appropriate for all ages (in public features)
            </Text>
          </View>
        </View>

        {/* Privacy and Data */}
        <View style={[styles.highlightSection, { backgroundColor: theme.surface }]}>
          <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
          <Text style={[styles.highlightTitle, { color: theme.text }]}>
            {isNepali ? 'गोपनीयता र डेटा संरक्षण' : 'Privacy & Data Protection'}
          </Text>
          <Text style={[styles.highlightText, { color: theme.textSecondary }]}>
            {isNepali
              ? 'तपाईंको गोपनीयता हाम्रो लागि महत्त्वपूर्ण छ। कृपया हाम्रो गोपनीयता नीति समीक्षा गर्नुहोस् कि हामी तपाईंको डेटा कसरी सङ्कलन, प्रयोग र सुरक्षित गर्छौं भनेर बुझ्न। हाम्रो सेवा प्रयोग गरेर, तपाईं हाम्रो गोपनीयता नीतिमा पनि सहमत हुनुहुन्छ।'
              : 'Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your data. By using our Service, you also agree to our Privacy Policy.'}
          </Text>
        </View>

        {/* Service Availability */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Service Availability</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            • We strive for 99.9% uptime but cannot guarantee uninterrupted service{'\n'}
            • Maintenance windows may cause temporary unavailability{'\n'}
            • We may modify or discontinue features at any time{'\n'}
            • We are not liable for service interruptions{'\n'}
            • Critical updates may require immediate deployment
          </Text>
        </View>

        {/* Intellectual Property */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Intellectual Property</Text>
          
          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>6.1 Our Property</Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              • The Service, app, and all related content are our property{'\n'}
              • Our trademarks, logos, and branding are protected{'\n'}
              • You may not copy, modify, or distribute our intellectual property{'\n'}
              • Reverse engineering the app is prohibited
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>6.2 Reporting Infringement</Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              If you believe content infringes your intellectual property rights, contact us at legal@chatapp.com with detailed information.
            </Text>
          </View>
        </View>

        {/* Third-Party Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>7. Third-Party Links and Services</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            • Our Service may contain links to third-party websites{'\n'}
            • We are not responsible for third-party content or services{'\n'}
            • Third-party services have their own terms and policies{'\n'}
            • Use third-party links at your own risk
          </Text>
        </View>

        {/* Termination */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>8. Termination</Text>
          
          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>8.1 By You</Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              • You may delete your account at any time{'\n'}
              • Account deletion is permanent after 30 days{'\n'}
              • Some data may be retained as required by law
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>8.2 By Us</Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              We may suspend or terminate your account if:{'\n\n'}
              • You violate these Terms{'\n'}
              • You engage in illegal or harmful activities{'\n'}
              • Your account is inactive for over 1 year{'\n'}
              • Required by law or legal process{'\n'}
              • We discontinue the Service
            </Text>
          </View>
        </View>

        {/* Disclaimers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>9. Disclaimers</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:{'\n\n'}
            • Merchantability{'\n'}
            • Fitness for a particular purpose{'\n'}
            • Non-infringement{'\n'}
            • Accuracy or reliability{'\n'}
            • Security or error-free operation{'\n\n'}
            We do not guarantee that the Service will meet your requirements or be available at all times.
          </Text>
        </View>

        {/* Limitation of Liability */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>10. Limitation of Liability</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:{'\n\n'}
            • Indirect, incidental, or consequential damages{'\n'}
            • Loss of profits, data, or goodwill{'\n'}
            • Service interruptions or errors{'\n'}
            • Unauthorized access to your data{'\n'}
            • Third-party content or actions{'\n\n'}
            Our total liability shall not exceed $100 or the amount you paid us in the past 12 months, whichever is greater.
          </Text>
        </View>

        {/* Indemnification */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>11. Indemnification</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from:{'\n\n'}
            • Your use of the Service{'\n'}
            • Your violation of these Terms{'\n'}
            • Your violation of any rights of others{'\n'}
            • Your content or activities
          </Text>
        </View>

        {/* Governing Law */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>12. Governing Law</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            These Terms shall be governed by the laws of the State of California, United States, without regard to conflict of law provisions. Any disputes shall be resolved in the courts of San Francisco County, California.
          </Text>
        </View>

        {/* Dispute Resolution */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>13. Dispute Resolution</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            • Most disputes can be resolved through customer support{'\n'}
            • Informal resolution should be attempted first{'\n'}
            • Binding arbitration may be required for unresolved disputes{'\n'}
            • You waive the right to class action lawsuits
          </Text>
        </View>

        {/* Changes to Terms */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>14. Changes to Terms</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            We may update these Terms at any time. We will notify you of material changes by:{'\n\n'}
            • In-app notification{'\n'}
            • Email to your registered address{'\n'}
            • Prominent notice in the app{'\n\n'}
            Continued use after changes constitutes acceptance. If you don't agree to new Terms, you must stop using the Service.
          </Text>
        </View>

        {/* Severability */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>15. Severability</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.
          </Text>
        </View>

        {/* Entire Agreement */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>16. Entire Agreement</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            These Terms, along with our Privacy Policy, constitute the entire agreement between you and us regarding the Service.
          </Text>
        </View>

        {/* Contact */}
        <View style={[styles.contactSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {isNepali ? 'हामीलाई सम्पर्क गर्नुहोस्' : 'Contact Us'}
          </Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            {isNepali
              ? 'यी सेवा सर्तहरूको बारेमा प्रश्नहरू छन्?'
              : 'Questions about these Terms of Service?'}
          </Text>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={20} color={theme.primary} />
            <Text style={[styles.contactText, { color: theme.primary }]}>legal@chatapp.com</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={20} color={theme.primary} />
            <Text style={[styles.contactText, { color: theme.primary }]}>1-800-CHAT-APP</Text>
          </View>
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 12,
    gap: 12,
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
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
