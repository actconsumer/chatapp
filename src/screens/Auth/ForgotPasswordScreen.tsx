import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SIZES } from '../../utils/constants';
import BotPrevention from '../../components/BotPrevention';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { forgotPassword } = useAuth();
  const { t } = useTranslation();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showBotPrevention, setShowBotPrevention] = useState(false);

  const validateEmail = () => {
    if (!email) {
      setError(t('auth.emailRequired'));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('auth.emailInvalid'));
      return false;
    }
    return true;
  };

  const handleResetPasswordClick = () => {
    if (validateEmail()) {
      setShowBotPrevention(true);
    }
  };

  const handleBotVerified = async () => {
    try {
      setLoading(true);
      await forgotPassword(email);
      setEmailSent(true);
    } catch (error) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.surface },
              ]}
            >
              <LinearGradient
                colors={theme.gradient}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="checkmark-circle" size={48} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </View>

          {/* Title and Description */}
          <Text style={[styles.title, { color: theme.text }]}>Check Your Email</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            We've sent password reset instructions to
          </Text>
          <Text style={[styles.email, { color: theme.text }]}>{email}</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Please check your inbox and follow the instructions to reset your password.
          </Text>

          {/* Back to Login Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <LinearGradient
              colors={theme.gradient}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Back to Login</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend Email */}
          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: theme.textSecondary }]}>
              Didn't receive the email?{' '}
            </Text>
            <TouchableOpacity onPress={() => setEmailSent(false)}>
              <Text style={[styles.resendLink, { color: theme.primary }]}>Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.surface },
            ]}
          >
            <LinearGradient
              colors={theme.gradient}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="lock-closed" size={48} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </View>

        {/* Title and Description */}
        <Text style={[styles.title, { color: theme.text }]}>Forgot Password?</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          No worries! Enter your email address and we'll send you instructions to reset your
          password.
        </Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <View
            style={[
              styles.input,
              { backgroundColor: theme.inputBackground, borderColor: theme.border },
              error && { borderColor: theme.error },
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={theme.placeholder}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.inputText, { color: theme.text }]}
              placeholder="Email"
              placeholderTextColor={theme.placeholder}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          {error ? (
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          ) : null}
        </View>

        {/* Reset Password Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleResetPasswordClick}
          disabled={loading}
        >
          <LinearGradient
            colors={theme.gradient}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Bot Prevention Modal */}
        <BotPrevention
          visible={showBotPrevention}
          onVerified={handleBotVerified}
          onCancel={() => setShowBotPrevention(false)}
        />

        {/* Back to Login Link */}
        <TouchableOpacity
          style={styles.backToLogin}
          onPress={() => navigation.navigate('Login')}
        >
          <Ionicons name="arrow-back" size={16} color={theme.primary} />
          <Text style={[styles.backToLoginText, { color: theme.primary }]}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SIZES.padding * 1.5,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: SIZES.small,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  email: {
    fontSize: SIZES.body,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    height: SIZES.inputHeight,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: SIZES.body,
  },
  errorText: {
    fontSize: SIZES.tiny,
    marginTop: 4,
    marginLeft: 16,
  },
  button: {
    borderRadius: SIZES.borderRadius,
    overflow: 'hidden',
    marginBottom: 24,
  },
  gradientButton: {
    height: SIZES.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backToLoginText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: SIZES.small,
  },
  resendLink: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
  },
});
