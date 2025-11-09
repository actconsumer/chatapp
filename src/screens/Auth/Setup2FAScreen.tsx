import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SIZES } from '../../utils/constants';
import { twoFactorAuthService } from '../../services';

type SecuritySetupStackParamList = {
  Setup2FA: { email?: string; userId?: string } | undefined;
  SetupSecurityPin: undefined;
};

type Setup2FAScreenNavigationProp = NativeStackNavigationProp<SecuritySetupStackParamList, 'Setup2FA'>;
type Setup2FAScreenRouteProp = RouteProp<SecuritySetupStackParamList, 'Setup2FA'>;

type SetupStep = 'intro' | 'provision' | 'verify';

type ProvisionPayload = {
  secret: string;
  qrCode: string;
  backupCodes: string[];
};

interface Setup2FAScreenProps {
  navigation: Setup2FAScreenNavigationProp;
  route: Setup2FAScreenRouteProp;
}

export default function Setup2FAScreen({ navigation, route }: Setup2FAScreenProps) {
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<SetupStep>('intro');
  const [provisionPayload, setProvisionPayload] = useState<ProvisionPayload | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isBackupCodesSaved, setIsBackupCodesSaved] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'setup' | 'verify' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fallbackEmail = route?.params?.email;
  const accountEmail = user?.email ?? fallbackEmail ?? 'your account';

  useEffect(() => {
    if (user?.twoFactorEnabled) {
      navigation.replace('SetupSecurityPin');
    }
  }, [navigation, user?.twoFactorEnabled]);

  const stepIndex = useMemo(() => {
    switch (step) {
      case 'intro':
        return 0;
      case 'provision':
        return 1;
      case 'verify':
        return 2;
      default:
        return 0;
    }
  }, [step]);

  const handleStartSetup = useCallback(async () => {
    try {
      setErrorMessage(null);
      setLoadingStage('setup');
      const response = await twoFactorAuthService.setup();
      setProvisionPayload(response);
      setIsBackupCodesSaved(false);
      setStep('provision');
    } catch (error: any) {
      console.error('2FA setup error:', error);
      setErrorMessage(error?.message || 'Failed to initialize two-factor authentication.');
    } finally {
      setLoadingStage(null);
    }
  }, []);

  const handleCopySecret = useCallback(async () => {
    if (!provisionPayload?.secret) {
      return;
    }

    try {
      await Clipboard.setStringAsync(provisionPayload.secret);
      Alert.alert('Secret Copied', 'Authenticator secret copied to clipboard.');
    } catch (error) {
      console.error('Clipboard error:', error);
      Alert.alert('Copy Failed', 'Unable to copy the secret. Please copy it manually.');
    }
  }, [provisionPayload?.secret]);

  const handleCopyBackupCodes = useCallback(async () => {
    if (!provisionPayload?.backupCodes?.length) {
      return;
    }

    try {
      await Clipboard.setStringAsync(provisionPayload.backupCodes.join('\n'));
      Alert.alert('Backup Codes Copied', 'Store these codes in a secure password manager.');
    } catch (error) {
      console.error('Clipboard error:', error);
      Alert.alert('Copy Failed', 'Unable to copy the backup codes. Please capture them manually.');
    }
  }, [provisionPayload?.backupCodes]);

  const proceedToVerification = useCallback(() => {
    if (!isBackupCodesSaved) {
      Alert.alert(
        'Save Backup Codes',
        'Please confirm that you have saved your backup codes before continuing.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'I Saved Them',
            onPress: () => setStep('verify'),
          },
        ],
      );
      return;
    }

    setStep('verify');
  }, [isBackupCodesSaved]);

  const handleVerify = useCallback(async () => {
    if (verificationCode.trim().length !== 6) {
      Alert.alert('Invalid Code', 'Enter the 6-digit code from your authenticator app.');
      return;
    }

    try {
      setErrorMessage(null);
      setLoadingStage('verify');
      const response = await twoFactorAuthService.verify(verificationCode.trim());

      // Update local backup codes if API returned fresh set
      if (response?.backupCodes?.length) {
        setProvisionPayload((prev) =>
          prev ? { ...prev, backupCodes: response.backupCodes } : { secret: '', qrCode: '', backupCodes: response.backupCodes },
        );
      }

      await refreshUser();
      navigation.replace('SetupSecurityPin');
    } catch (error: any) {
      console.error('2FA verification error:', error);
      setErrorMessage(error?.message || 'Verification failed. Double-check the code and try again.');
    } finally {
      setLoadingStage(null);
    }
  }, [navigation, refreshUser, verificationCode]);

  const renderHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}> 
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.stepDots}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.stepDot,
              index <= stepIndex && { backgroundColor: theme.primary },
            ]}
          />
        ))}
      </View>

      <View style={styles.placeholder} />
    </View>
  );

  const renderErrorBanner = () => {
    if (!errorMessage) {
      return null;
    }

    return (
      <View style={[styles.errorBanner, { backgroundColor: theme.error + '15', borderColor: theme.error + '50' }]}>
        <Ionicons name="warning" size={20} color={theme.error} style={styles.errorIcon} />
        <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
      </View>
    );
  };

  const renderIntroStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.heroIconWrapper, { backgroundColor: theme.surface }]}>
        <LinearGradient colors={theme.gradient} style={styles.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="shield-checkmark" size={64} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>Secure Your Chats</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Protect {accountEmail} with an authenticator app before continuing.</Text>

      <View style={styles.featureList}>
        <View style={[styles.featureCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.featureIcon, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="lock-closed" size={22} color={theme.primary} />
          </View>
          <View style={styles.featureCopy}>
            <Text style={[styles.featureTitle, { color: theme.text }]}>Defense in Depth</Text>
            <Text style={[styles.featureBody, { color: theme.textSecondary }]}>Even if someone learns your password, they cannot sign in without the authenticator code.</Text>
          </View>
        </View>

        <View style={[styles.featureCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.featureIcon, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="phone-portrait" size={22} color={theme.primary} />
          </View>
          <View style={styles.featureCopy}>
            <Text style={[styles.featureTitle, { color: theme.text }]}>Works Everywhere</Text>
            <Text style={[styles.featureBody, { color: theme.textSecondary }]}>Compatible with Google Authenticator, Authy, Microsoft Authenticator, and more.</Text>
          </View>
        </View>

        <View style={[styles.featureCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.featureIcon, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="key" size={22} color={theme.primary} />
          </View>
          <View style={styles.featureCopy}>
            <Text style={[styles.featureTitle, { color: theme.text }]}>Emergency Access</Text>
            <Text style={[styles.featureBody, { color: theme.textSecondary }]}>Save backup codes to recover your account if you lose your device.</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleStartSetup} disabled={loadingStage === 'setup'}>
        <LinearGradient colors={theme.gradient} style={styles.primaryButtonBackground} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          {loadingStage === 'setup' ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Get Started</Text>}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderProvisionStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.title, { color: theme.text }]}>Scan & Save</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Scan the QR code with your authenticator app, then store your backup codes.</Text>

      {provisionPayload?.qrCode ? (
        <View style={[styles.qrWrapper, { backgroundColor: theme.surface }]}>
          <Image source={{ uri: provisionPayload.qrCode }} style={styles.qrImage} resizeMode="contain" />
        </View>
      ) : (
        <View style={[styles.qrSkeleton, { backgroundColor: theme.surface }]}>
          <ActivityIndicator color={theme.primary} />
        </View>
      )}

      <View style={[styles.secretCard, { backgroundColor: theme.surface }]}> 
        <View style={styles.secretHeader}>
          <Text style={[styles.secretLabel, { color: theme.textSecondary }]}>Manual Entry Code</Text>
          <TouchableOpacity onPress={handleCopySecret}>
            <Text style={[styles.secretAction, { color: theme.primary }]}>Copy</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.secretValue, { color: theme.text }]}>{provisionPayload?.secret || '••••••••••'}</Text>
      </View>

      <View style={[styles.backupCard, { backgroundColor: theme.card }]}>
        <View style={styles.backupHeader}>
          <Ionicons name="shield-outline" size={20} color={theme.primary} />
          <Text style={[styles.backupTitle, { color: theme.text }]}>Backup Codes</Text>
          <TouchableOpacity style={styles.copyInline} onPress={handleCopyBackupCodes}>
            <Ionicons name="copy" size={16} color={theme.primary} />
            <Text style={[styles.copyText, { color: theme.primary }]}>Copy</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.backupDescription, { color: theme.textSecondary }]}>Store these single-use codes in a secure password manager. Each code can be used once.</Text>
        <View style={styles.codesGrid}>
          {provisionPayload?.backupCodes?.map((code) => (
            <View key={code} style={[styles.codeChip, { borderColor: theme.border }]}>
              <Text style={[styles.codeText, { color: theme.text }]}>{code}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsBackupCodesSaved((prev) => !prev)}>
          <View
            style={[styles.checkbox, { borderColor: theme.border }, isBackupCodesSaved && { backgroundColor: theme.primary, borderColor: theme.primary }]}
          >
            {isBackupCodesSaved && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={[styles.checkboxLabel, { color: theme.text }]}>I've saved my backup codes safely</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={proceedToVerification}>
        <LinearGradient colors={theme.gradient} style={styles.primaryButtonBackground} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleStartSetup} disabled={loadingStage === 'setup'}>
        {loadingStage === 'setup' ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Refresh QR & Codes</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderVerifyStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.title, { color: theme.text }]}>Verify Authenticator</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter the 6-digit code currently displayed in your authenticator app.</Text>

      <View style={[styles.codeInputWrapper, { backgroundColor: theme.surface }]}> 
        <Ionicons name="shield-checkmark" size={22} color={theme.primary} style={styles.codeInputIcon} />
        <TextInput
          style={[styles.codeInput, { color: theme.text }]}
          placeholder="123456"
          placeholderTextColor={theme.placeholder}
          keyboardType="number-pad"
          maxLength={6}
          value={verificationCode}
          onChangeText={setVerificationCode}
          autoFocus
        />
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
        <Ionicons name="information-circle" size={20} color={theme.primary} style={styles.infoIcon} />
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>Codes refresh every 30 seconds. If the code expires, wait for the next one and try again.</Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, verificationCode.length !== 6 && styles.primaryButtonDisabled]}
        onPress={handleVerify}
        disabled={loadingStage === 'verify' || verificationCode.length !== 6}
      >
        <LinearGradient
          colors={verificationCode.length === 6 ? theme.gradient : ['#B0B3B8', '#8A8D91']}
          style={styles.primaryButtonBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loadingStage === 'verify' ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Verify & Continue</Text>}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('provision')}>
        <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Need the QR code again?</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      {renderHeader()}
      {renderErrorBanner()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {step === 'intro' && renderIntroStep()}
        {step === 'provision' && renderProvisionStep()}
        {step === 'verify' && renderVerifyStep()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDots: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C5C6C7',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  errorBanner: {
    marginHorizontal: SIZES.padding,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: SIZES.small,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 32,
  },
  stepContent: {
    alignItems: 'center',
    gap: 24,
    marginTop: 12,
  },
  heroIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.body,
    textAlign: 'center',
    color: '#6B7280',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  featureList: {
    width: '100%',
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 18,
    borderRadius: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureBody: {
    fontSize: SIZES.small,
    lineHeight: 18,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryButtonBackground: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: SIZES.body,
    fontWeight: '700',
  },
  primaryButtonDisabled: {
    opacity: 0.85,
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  qrWrapper: {
    padding: 24,
    borderRadius: 20,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  qrSkeleton: {
    width: 220,
    height: 220,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secretCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
  },
  secretHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  secretLabel: {
    fontSize: SIZES.small,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  secretAction: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  secretValue: {
    fontSize: 20,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  backupCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backupTitle: {
    fontSize: SIZES.body,
    fontWeight: '700',
  },
  backupDescription: {
    fontSize: SIZES.small,
    lineHeight: 18,
  },
  copyInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  copyText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  codesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  codeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: SIZES.small,
    fontWeight: '600',
    letterSpacing: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: SIZES.small,
    fontWeight: '500',
    flex: 1,
  },
  codeInputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  codeInputIcon: {
    marginRight: 12,
  },
  codeInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 8,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.small,
    lineHeight: 18,
  },
});
