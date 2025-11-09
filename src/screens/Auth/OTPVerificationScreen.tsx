import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { SIZES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

interface OTPVerificationScreenProps {
  route: any;
  navigation: any;
}

export default function OTPVerificationScreen({ route, navigation }: OTPVerificationScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { verifyEmail, resendVerification } = useAuth();
  const { email: initialEmail, fromSignup } = route.params || {};

  const [email, setEmail] = useState(initialEmail || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert(t('common.error'), t('otp.enterComplete6Digit'));
      return;
    }

    setIsLoading(true);

    try {
      // Call actual API to verify email
      await verifyEmail(otpCode);

      Alert.alert(t('common.success'), t('otp.emailVerifiedSuccess'), [
        {
          text: t('common.ok'),
          onPress: () => {
            if (fromSignup) {
              navigation.navigate('Login');
            } else {
              navigation.goBack();
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert(t('common.error'), t('otp.invalidOTP'));
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    if (!canResend) return;

    try {
      // Call actual API to resend verification email
      await resendVerification(email);

      Alert.alert(t('common.success'), t('otp.codeSent', { email }));
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      // Restart countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error resending OTP:', error);
      Alert.alert(t('common.error'), t('otp.resendFailed'));
    }
  };

  const validateEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleChangeEmail = async () => {
    setEmailError('');

    if (!newEmail) {
      setEmailError(t('auth.emailRequired'));
      return;
    }

    if (!validateEmail(newEmail)) {
      setEmailError(t('auth.emailInvalid'));
      return;
    }

    if (newEmail === email) {
      setEmailError(t('otp.enterDifferentEmail'));
      return;
    }

    try {
      // TODO: Implement actual change email API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      setEmail(newEmail);
      setShowChangeEmailModal(false);
      setNewEmail('');
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      setCanResend(false);
      inputRefs.current[0]?.focus();

      Alert.alert(
        t('otp.emailUpdated'), 
        t('otp.codeSent', { email: newEmail }),
        [{ text: t('common.ok') }]
      );

      // Restart countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error changing email:', error);
      Alert.alert(t('common.error'), t('otp.changeEmailFailed'));
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
            <LinearGradient
              colors={theme.gradient}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="mail-outline" size={48} color="#fff" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>{t('otp.verifyEmail')}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t('otp.codeSentTo')}
          </Text>
          
          {/* Email with Change Option */}
          <View style={styles.emailContainer}>
            <Text style={[styles.email, { color: theme.primary }]}>{email}</Text>
            <TouchableOpacity 
              onPress={() => {
                setNewEmail(email);
                setShowChangeEmailModal(true);
              }}
              style={styles.changeEmailButton}
            >
              <Ionicons name="create-outline" size={18} color={theme.primary} />
              <Text style={[styles.changeEmailText, { color: theme.primary }]}>
                {t('common.change')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: digit ? theme.primary : theme.border,
                    color: theme.text,
                  },
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={styles.verifyButtonContainer}
            onPress={verifyOTP}
            disabled={isLoading || otp.join('').length !== 6}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={otp.join('').length === 6 ? theme.gradient : ['#CCCCCC', '#AAAAAA']}
              style={styles.verifyButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.verifyButtonText}>
                {isLoading ? t('otp.verifying') : t('otp.verifyEmail')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend Code */}
          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: theme.textSecondary }]}>
              {t('otp.didntReceiveCode')}
            </Text>
            {canResend ? (
              <TouchableOpacity onPress={resendOTP}>
                <Text style={[styles.resendButton, { color: theme.primary }]}>
                  {t('otp.resendCode')}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.countdown, { color: theme.textSecondary }]}>
                {t('otp.resendIn', { time: formatTime(countdown) })}
              </Text>
            )}
          </View>

          {/* Info */}
          <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              {t('otp.checkSpam')}
            </Text>
          </View>
        </ScrollView>

        {/* Change Email Modal */}
        <Modal
          visible={showChangeEmailModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowChangeEmailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t('otp.changeEmailAddress')}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  {t('otp.enterNewEmail')}
                </Text>

                <View style={styles.modalInputContainer}>
                  <View
                    style={[
                      styles.modalInput,
                      { 
                        backgroundColor: theme.inputBackground, 
                        borderColor: emailError ? theme.error : theme.border 
                      },
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={theme.placeholder}
                      style={styles.modalInputIcon}
                    />
                    <TextInput
                      style={[styles.modalInputText, { color: theme.text }]}
                      placeholder={t('otp.enterNewEmailPlaceholder')}
                      placeholderTextColor={theme.placeholder}
                      value={newEmail}
                      onChangeText={(text) => {
                        setNewEmail(text);
                        setEmailError('');
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoFocus
                    />
                  </View>
                  {emailError ? (
                    <Text style={[styles.modalErrorText, { color: theme.error }]}>
                      {emailError}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: theme.background }]}
                    onPress={() => {
                      setShowChangeEmailModal(false);
                      setNewEmail('');
                      setEmailError('');
                    }}
                  >
                    <Text style={[styles.modalButtonTextSecondary, { color: theme.text }]}>
                      {t('common.cancel')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalButtonPrimary}
                    onPress={handleChangeEmail}
                  >
                    <LinearGradient
                      colors={theme.gradient}
                      style={styles.modalButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.modalButtonText}>{t('common.confirm')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  changeEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeEmailText: {
    fontSize: 14,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  verifyButtonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  verifyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
  },
  resendButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  countdown: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalInputContainer: {
    marginBottom: 24,
  },
  modalInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: SIZES.inputHeight,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  modalInputIcon: {
    marginRight: 12,
  },
  modalInputText: {
    flex: 1,
    fontSize: SIZES.body,
  },
  modalErrorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonPrimary: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
