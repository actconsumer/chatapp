import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SIZES } from '../../utils/constants';
import BotPrevention from '../../components/BotPrevention';

export default function RegisterScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { register, loading } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showBotPrevention, setShowBotPrevention] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: '',
      username: '',
      displayName: '',
      password: '',
      confirmPassword: '',
    };

    // Email validation
    if (!formData.email) {
      newErrors.email = t('auth.emailRequired');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.emailInvalid');
      valid = false;
    }

    // Username validation
    if (!formData.username) {
      newErrors.username = t('auth.usernameRequired');
      valid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = t('auth.usernameMinLength');
      valid = false;
    }

    // Display name validation
    if (!formData.displayName) {
      newErrors.displayName = t('auth.displayNameRequired');
      valid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired');
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.passwordMinLength');
      valid = false;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.confirmPasswordRequired');
      valid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordMismatch');
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegisterClick = () => {
    if (validateForm()) {
      setShowBotPrevention(true);
    }
  };

  const handleBotVerified = async () => {
    try {
      await register(
        formData.email,
        formData.username,
        formData.password,
        formData.displayName
      );
      setShowBotPrevention(false);
    } catch (error) {
      Alert.alert(t('auth.registrationFailed'), t('auth.registrationFailedMessage'));
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
    setErrors({ ...errors, [key]: '' });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{t('auth.createAccount')}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t('auth.joinAndStartMessaging')}
          </Text>
        </View>

        {/* Registration Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.input,
                { backgroundColor: theme.inputBackground, borderColor: theme.border },
                errors.email && { borderColor: theme.error },
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
                placeholder={t('auth.email')}
                placeholderTextColor={theme.placeholder}
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {errors.email ? (
              <Text style={[styles.errorText, { color: theme.error }]}>{errors.email}</Text>
            ) : null}
          </View>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.input,
                { backgroundColor: theme.inputBackground, borderColor: theme.border },
                errors.username && { borderColor: theme.error },
              ]}
            >
              <Ionicons
                name="at-outline"
                size={20}
                color={theme.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.inputText, { color: theme.text }]}
                placeholder={t('auth.username')}
                placeholderTextColor={theme.placeholder}
                value={formData.username}
                onChangeText={(text) => updateFormData('username', text)}
                autoCapitalize="none"
              />
            </View>
            {errors.username ? (
              <Text style={[styles.errorText, { color: theme.error }]}>{errors.username}</Text>
            ) : null}
          </View>

          {/* Display Name Input */}
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.input,
                { backgroundColor: theme.inputBackground, borderColor: theme.border },
                errors.displayName && { borderColor: theme.error },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={theme.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.inputText, { color: theme.text }]}
                placeholder={t('auth.displayName')}
                placeholderTextColor={theme.placeholder}
                value={formData.displayName}
                onChangeText={(text) => updateFormData('displayName', text)}
              />
            </View>
            {errors.displayName ? (
              <Text style={[styles.errorText, { color: theme.error }]}>{errors.displayName}</Text>
            ) : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.input,
                { backgroundColor: theme.inputBackground, borderColor: theme.border },
                errors.password && { borderColor: theme.error },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={theme.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.inputText, { color: theme.text }]}
                placeholder={t('auth.password')}
                placeholderTextColor={theme.placeholder}
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={theme.placeholder}
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={[styles.errorText, { color: theme.error }]}>{errors.password}</Text>
            ) : null}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.input,
                { backgroundColor: theme.inputBackground, borderColor: theme.border },
                errors.confirmPassword && { borderColor: theme.error },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={theme.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.inputText, { color: theme.text }]}
                placeholder={t('auth.confirmPassword')}
                placeholderTextColor={theme.placeholder}
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={theme.placeholder}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={[styles.errorText, { color: theme.error }]}>
                {errors.confirmPassword}
              </Text>
            ) : null}
          </View>

          {/* Terms and Conditions */}
          <Text style={[styles.termsText, { color: theme.textSecondary }]}>
            {t('auth.signUpAgree')}{' '}
            <Text 
              style={{ color: theme.primary }}
              onPress={() => navigation.push('TermsOfService')}
            >
              {t('auth.termsOfService')}
            </Text> {t('auth.and')}{' '}
            <Text 
              style={{ color: theme.primary }}
              onPress={() => navigation.push('PrivacyPolicy')}
            >
              {t('auth.privacyPolicy')}
            </Text>
          </Text>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleRegisterClick}
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
                <Text style={styles.signUpButtonText}>{t('common.signup')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textSecondary }]}>{t('auth.or')}</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          {/* Social Sign Up Buttons */}
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={[styles.socialButtonText, { color: theme.text }]}>
              {t('auth.continueWithGoogle')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="logo-facebook" size={20} color="#1877F2" />
            <Text style={[styles.socialButtonText, { color: theme.text }]}>
              {t('auth.continueWithFacebook')}
            </Text>
          </TouchableOpacity>

          {/* Privacy Policy Note */}
          <View style={styles.privacyNote}>
            <Text style={[styles.privacyText, { color: theme.textSecondary }]}>
              {t('auth.signUpAgree')}{' '}
              <Text style={[styles.privacyLink, { color: theme.primary }]}>
                {t('auth.termsOfService')}
              </Text>
              {' '}{t('auth.and')}{' '}
              <Text style={[styles.privacyLink, { color: theme.primary }]}>
                {t('auth.privacyPolicy')}
              </Text>
            </Text>
          </View>
        </View>

        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            {t('auth.alreadyHaveAccount')}{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.loginText, { color: theme.primary }]}>{t('common.login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bot Prevention Modal */}
      <BotPrevention
        visible={showBotPrevention}
        onVerified={handleBotVerified}
        onCancel={() => setShowBotPrevention(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 16,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: SIZES.small,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
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
  termsText: {
    fontSize: SIZES.tiny,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  signUpButton: {
    borderRadius: SIZES.borderRadius,
    overflow: 'hidden',
    marginBottom: 24,
  },
  gradientButton: {
    height: SIZES.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: SIZES.buttonHeight,
    borderRadius: SIZES.borderRadius,
    marginBottom: 12,
    borderWidth: 1,
  },
  socialButtonText: {
    marginLeft: 12,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  privacyNote: {
    marginTop: 20,
    paddingHorizontal: 8,
  },
  privacyText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  privacyLink: {
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: SIZES.body,
  },
  loginText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
});
