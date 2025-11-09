import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SIZES } from '../../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';

interface AboutScreenProps {
  navigation: any;
}

export default function AboutScreen({ navigation }: AboutScreenProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>About</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* App Logo */}
          <View style={styles.logoSection}>
            <View style={[styles.logoContainer, { backgroundColor: theme.surface }]}>
              <LinearGradient
                colors={theme.gradient}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="chatbubbles" size={64} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={[styles.appName, { color: theme.text }]}>Project Chat</Text>
            <Text style={[styles.version, { color: theme.textSecondary }]}>Version 1.0.0</Text>
          </View>

          {/* About Company */}
          <View style={[styles.aboutCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.aboutTitle, { color: theme.text }]}>
              Our Mission
            </Text>
            <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
              Project Chat is a modern, secure messaging platform designed to bring people together. 
              We believe in creating meaningful connections through seamless communication, 
              powered by cutting-edge technology and beautiful design.
            </Text>
          </View>

          <View style={[styles.aboutCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.aboutTitle, { color: theme.text }]}>
              What We Offer
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>
                    End-to-End Encryption
                  </Text>
                  <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                    Your messages are secured with military-grade encryption
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="videocam" size={24} color={theme.primary} />
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>
                    HD Video Calls
                  </Text>
                  <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                    Crystal clear voice and video calling
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="color-palette" size={24} color={theme.primary} />
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>
                    Customizable Themes
                  </Text>
                  <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                    Personalize your chat experience with themes and wallpapers
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="play-circle" size={24} color={theme.primary} />
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>
                    Stories & Media
                  </Text>
                  <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                    Share moments with stories and rich media
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="cloud-done" size={24} color={theme.primary} />
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>
                    Cloud Sync
                  </Text>
                  <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                    Access your messages from any device
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Team Info */}
          <View style={[styles.aboutCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.aboutTitle, { color: theme.text }]}>
              Our Team
            </Text>
            <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
              We're a passionate team of developers, designers, and security experts 
              committed to building the best messaging experience. Our goal is to create 
              a platform that's not just functional, but delightful to use every day.
            </Text>
          </View>

          {/* Contact & Social */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Connect With Us</Text>
            
            <TouchableOpacity style={[styles.socialCard, { backgroundColor: theme.surface }]}>
              <Ionicons name="globe" size={24} color={theme.primary} />
              <Text style={[styles.socialText, { color: theme.text }]}>www.projectchat.com</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.socialCard, { backgroundColor: theme.surface }]}>
              <Ionicons name="mail" size={24} color={theme.primary} />
              <Text style={[styles.socialText, { color: theme.text }]}>contact@projectchat.com</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.socialCard, { backgroundColor: theme.surface }]}>
              <Ionicons name="logo-twitter" size={24} color={theme.primary} />
              <Text style={[styles.socialText, { color: theme.text }]}>@projectchat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.socialCard, { backgroundColor: theme.surface }]}>
              <Ionicons name="logo-github" size={24} color={theme.primary} />
              <Text style={[styles.socialText, { color: theme.text }]}>github.com/projectchat</Text>
            </TouchableOpacity>
          </View>

          {/* Legal */}
          <View style={styles.legalSection}>
            <Text style={[styles.legalText, { color: theme.textSecondary }]}>
              © 2024 Project Chat. All rights reserved.
            </Text>
            <View style={styles.legalLinks}>
              <TouchableOpacity>
                <Text style={[styles.legalLink, { color: theme.primary }]}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={[styles.legalSeparator, { color: theme.textSecondary }]}>•</Text>
              <TouchableOpacity>
                <Text style={[styles.legalLink, { color: theme.primary }]}>Terms of Service</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 24,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  version: {
    fontSize: SIZES.body,
  },
  aboutCard: {
    marginHorizontal: SIZES.padding,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  aboutTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: SIZES.body,
    lineHeight: 24,
  },
  featureList: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: SIZES.small,
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: SIZES.padding,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  socialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  socialText: {
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  legalSection: {
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    marginTop: 24,
  },
  legalText: {
    fontSize: SIZES.small,
    marginBottom: 12,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalLink: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  legalSeparator: {
    fontSize: SIZES.small,
  },
});
