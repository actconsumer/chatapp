import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
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

export default function LoginScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { login, loading } = useAuth();
  const { t } = useTranslation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [showBotPrevention, setShowBotPrevention] = useState(false);

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = t('auth.emailRequired');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.emailInvalid');
      valid = false;
    }

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = t('auth.passwordMinLength');
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLoginClick = () => {
    if (validateForm()) {
      setShowBotPrevention(true);
    }
  };

  const handleBotVerified = async () => {
    try {
      await login(email, password);
    } catch (error) {
      alert(t('auth.loginFailed'));
    }
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
        {/* Logo and Title */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.surface }]}>
            <LinearGradient
              colors={theme.gradient}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="chatbubbles" size={48} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{t('auth.loginTitle')}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t('auth.loginSubtitle')}
          </Text>
        </View>

        {/* Login Form */}
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
                placeholder={t('auth.emailOrUsername')}
                placeholderTextColor={theme.placeholder}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors({ ...errors, email: '' });
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {errors.email ? (
              <Text style={[styles.errorText, { color: theme.error }]}>{errors.email}</Text>
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
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors({ ...errors, password: '' });
                }}
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

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
              {t('auth.forgotPassword')}
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLoginClick}
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
                <Text style={styles.loginButtonText}>{t('common.login')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textSecondary }]}>{t('auth.or')}</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          {/* Social Login Buttons */}
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
              {t('auth.termsAgree')}{' '}
              <Text 
                style={[styles.privacyLink, { color: theme.primary }]}
                onPress={() => navigation.push('TermsOfService')}
              >
                {t('auth.termsOfService')}
              </Text>
              {' '}{t('auth.and')}{' '}
              <Text 
                style={[styles.privacyLink, { color: theme.primary }]}
                onPress={() => navigation.push('PrivacyPolicy')}
              >
                {t('auth.privacyPolicy')}
              </Text>
            </Text>
          </View>
        </View>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            {t('auth.dontHaveAccount')}{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.signUpText, { color: theme.primary }]}>{t('common.signup')}</Text>
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
    paddingBottom: SIZES.padding * 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: SIZES.small,
    textAlign: 'center',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: SIZES.borderRadius,
    overflow: 'hidden',
    marginBottom: 24,
  },
  gradientButton: {
    height: SIZES.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
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
    marginTop: 24,
    paddingTop: 16,
  },
  footerText: {
    fontSize: SIZES.body,
  },
  signUpText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },

});
