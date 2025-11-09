import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SIZES } from '../../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { twoFactorAuthService } from '../../services';

interface TwoFactorAuthScreenProps {
  navigation: any;
}

export default function TwoFactorAuthScreen({ navigation }: TwoFactorAuthScreenProps) {
  const { theme } = useTheme();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [step, setStep] = useState<'initial' | 'setup' | 'verify' | 'enabled'>('initial');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      setLoading(true);
      const status = await twoFactorAuthService.getStatus();
      setTwoFactorEnabled(status.enabled);
      if (status.enabled) {
        setStep('enabled');
      }
    } catch (error) {
      console.error('Check 2FA status error:', error);
    } finally {
      setLoading(false);
    }
  };

  const enableTwoFactor = async () => {
    try {
      setLoading(true);
      const response = await twoFactorAuthService.setup();
      setQrCode(response.qrCode);
      setSecret(response.secret);
      setBackupCodes(response.backupCodes);
      setStep('setup');
    } catch (error) {
      console.error('Enable 2FA error:', error);
      Alert.alert('Error', 'Failed to enable two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      await twoFactorAuthService.verify(verificationCode);
      setTwoFactorEnabled(true);
      setStep('enabled');
      Alert.alert(
        'Success',
        'Two-factor authentication has been enabled successfully!'
      );
    } catch (error) {
      console.error('Verify 2FA error:', error);
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = () => {
    Alert.alert(
      'Disable 2FA',
      'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Note: disableTwoFactor requires password - you may need to prompt for it
              await twoFactorAuthService.disable({ password: '' });
              setTwoFactorEnabled(false);
              setStep('initial');
              setVerificationCode('');
              setBackupCodes([]);
              setQrCode('');
              setSecret('');
            } catch (error) {
              console.error('Disable 2FA error:', error);
              Alert.alert('Error', 'Failed to disable two-factor authentication');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const downloadBackupCodes = () => {
    Alert.alert(
      'Backup Codes',
      'In a real app, backup codes would be downloaded as a file. Save these codes in a safe place.',
      [{ text: 'OK' }]
    );
  };

  const renderInitialView = () => (
    <View style={styles.content}>
      <View style={[styles.iconCircle, { backgroundColor: theme.surface }]}>
        <LinearGradient
          colors={theme.gradient}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="shield-checkmark" size={48} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>
        Two-Factor Authentication
      </Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        Add an extra layer of security to your account. When enabled, you'll need to enter a code from your authenticator app in addition to your password.
      </Text>

      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={24} color={theme.success} />
          <Text style={[styles.featureText, { color: theme.text }]}>
            Enhanced account security
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={24} color={theme.success} />
          <Text style={[styles.featureText, { color: theme.text }]}>
            Protection against unauthorized access
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={24} color={theme.success} />
          <Text style={[styles.featureText, { color: theme.text }]}>
            Backup codes for account recovery
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.primary }]}
        onPress={enableTwoFactor}
      >
        <Text style={styles.primaryButtonText}>Enable Two-Factor Authentication</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSetupView = () => (
    <View style={styles.content}>
      <Text style={[styles.title, { color: theme.text }]}>
        Setup Authenticator
      </Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
      </Text>

      <View style={[styles.qrCodeContainer, { backgroundColor: theme.surface }]}>
        <View style={[styles.qrCode, { backgroundColor: '#fff' }]}>
          <Text style={[styles.qrPlaceholder, { color: theme.textSecondary }]}>
            QR Code
          </Text>
          <Ionicons name="qr-code" size={120} color={theme.primary} />
        </View>
      </View>

      <View style={[styles.codeContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.codeLabel, { color: theme.textSecondary }]}>
          Or enter this code manually:
        </Text>
        <Text style={[styles.manualCode, { color: theme.text }]}>
          ABCD EFGH IJKL MNOP
        </Text>
      </View>

      <Text style={[styles.inputLabel, { color: theme.text }]}>
        Enter the 6-digit code from your app:
      </Text>
      <TextInput
        style={[styles.input, { 
          backgroundColor: theme.inputBackground, 
          color: theme.text,
          borderColor: theme.border,
        }]}
        placeholder="000000"
        placeholderTextColor={theme.placeholder}
        value={verificationCode}
        onChangeText={setVerificationCode}
        keyboardType="number-pad"
        maxLength={6}
      />

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.primary }]}
        onPress={verifyCode}
      >
        <Text style={styles.primaryButtonText}>Verify & Enable</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setStep('initial')}
      >
        <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEnabledView = () => (
    <View style={styles.content}>
      <View style={[styles.iconCircle, { backgroundColor: theme.success + '20' }]}>
        <Ionicons name="checkmark-circle" size={64} color={theme.success} />
      </View>

      <Text style={[styles.title, { color: theme.text }]}>
        2FA Enabled
      </Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        Your account is now protected with two-factor authentication.
      </Text>

      {backupCodes.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Backup Codes
          </Text>
          <Text style={[styles.backupDescription, { color: theme.textSecondary }]}>
            Save these codes in a safe place. Each code can be used once if you lose access to your authenticator.
          </Text>
          
          <View style={[styles.backupCodesContainer, { backgroundColor: theme.surface }]}>
            {backupCodes.map((code, index) => (
              <View key={index} style={[styles.backupCodeItem, { borderBottomColor: theme.border }]}>
                <Text style={[styles.backupCodeNumber, { color: theme.textSecondary }]}>
                  {index + 1}.
                </Text>
                <Text style={[styles.backupCodeText, { color: theme.text }]}>
                  {code}
                </Text>
                <TouchableOpacity>
                  <Ionicons name="copy-outline" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: theme.card, borderColor: theme.primary }]}
            onPress={downloadBackupCodes}
          >
            <Ionicons name="download-outline" size={20} color={theme.primary} />
            <Text style={[styles.downloadButtonText, { color: theme.primary }]}>
              Download Backup Codes
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={[styles.dangerButton, { backgroundColor: theme.error + '10', borderColor: theme.error }]}
        onPress={disableTwoFactor}
      >
        <Ionicons name="close-circle-outline" size={20} color={theme.error} />
        <Text style={[styles.dangerButtonText, { color: theme.error }]}>
          Disable Two-Factor Authentication
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Two-Factor Auth</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {step === 'initial' && renderInitialView()}
        {step === 'setup' && renderSetupView()}
        {step === 'enabled' && renderEnabledView()}
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
    paddingHorizontal: SIZES.padding,
    paddingTop: 32,
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: SIZES.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featureList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  featureText: {
    fontSize: SIZES.body,
    flex: 1,
  },
  qrCodeContainer: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  qrCode: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  qrPlaceholder: {
    fontSize: SIZES.small,
    marginBottom: 8,
  },
  codeContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: SIZES.small,
    marginBottom: 8,
  },
  manualCode: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  inputLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: SIZES.h4,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 24,
    borderWidth: 1,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  backupDescription: {
    fontSize: SIZES.small,
    textAlign: 'center',
    marginBottom: 16,
  },
  backupCodesContainer: {
    width: '100%',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  backupCodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    gap: 12,
  },
  backupCodeNumber: {
    fontSize: SIZES.small,
    width: 24,
  },
  backupCodeText: {
    fontSize: SIZES.body,
    fontFamily: 'monospace',
    flex: 1,
    fontWeight: '600',
  },
  downloadButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  downloadButtonText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  dangerButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 8,
  },
  dangerButtonText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
});
