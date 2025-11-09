import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SIZES } from '../../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { securityPinService } from '../../services';

interface SetupSecurityPinScreenProps {
  navigation: any;
  route: any;
}

export default function SetupSecurityPinScreen({ navigation, route }: SetupSecurityPinScreenProps) {
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  
  const [step, setStep] = useState<'info' | 'choose-length' | 'enter-pin' | 'confirm-pin'>('info');
  const [pinLength, setPinLength] = useState<4 | 6>(6);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinPress = (digit: string) => {
    if (step === 'enter-pin') {
      if (pin.length < pinLength) {
        setPin(pin + digit);
        if (pin.length + 1 === pinLength) {
          setTimeout(() => setStep('confirm-pin'), 300);
        }
      }
    } else if (step === 'confirm-pin') {
      if (confirmPin.length < pinLength) {
        setConfirmPin(confirmPin + digit);
        if (confirmPin.length + 1 === pinLength) {
          setTimeout(() => verifyAndSetup(pin + digit), 300);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (step === 'enter-pin') {
      setPin(pin.slice(0, -1));
    } else if (step === 'confirm-pin') {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const verifyAndSetup = async (finalPin: string) => {
    if (pin !== finalPin.slice(0, -1)) {
      Alert.alert('Error', 'PINs do not match. Please try again.');
      setPin('');
      setConfirmPin('');
      setStep('enter-pin');
      return;
    }

    try {
      setLoading(true);
      await securityPinService.setup(pin);
      await refreshUser();
      
      Alert.alert(
        'Success',
        'Your account is now fully secured!',
        [
          {
            text: 'Get Started',
            onPress: () => navigation.replace('Main'),
          },
        ]
      );
    } catch (error) {
      console.error('Security PIN setup error:', error);
      Alert.alert('Error', 'Failed to setup security PIN. Please try again.');
      setPin('');
      setConfirmPin('');
      setStep('enter-pin');
    } finally {
      setLoading(false);
    }
  };

  const renderInfoStep = () => (
    <View style={styles.content}>
      <View style={[styles.iconCircle, { backgroundColor: theme.surface }]}>
        <LinearGradient
          colors={theme.gradient}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="keypad" size={64} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>
        Create Security PIN
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Your security PIN protects your encrypted messages when signing in from unknown devices
      </Text>

      <View style={styles.featureList}>
        <View style={[styles.featureItem, { backgroundColor: theme.surface }]}>
          <View style={[styles.featureIcon, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="lock-closed" size={24} color={theme.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: theme.text }]}>
              Message Encryption
            </Text>
            <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
              Your conversations are encrypted with your PIN
            </Text>
          </View>
        </View>

        <View style={[styles.featureItem, { backgroundColor: theme.surface }]}>
          <View style={[styles.featureIcon, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="phone-portrait" size={24} color={theme.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: theme.text }]}>
              Device Protection
            </Text>
            <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
              Required when accessing from new devices
            </Text>
          </View>
        </View>

        <View style={[styles.featureItem, { backgroundColor: theme.surface }]}>
          <View style={[styles.featureIcon, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: theme.text }]}>
              Easy Recovery
            </Text>
            <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
              Can be reset using your account password
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => setStep('choose-length')}
      >
        <LinearGradient
          colors={theme.gradient}
          style={styles.gradientButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderChooseLengthStep = () => (
    <View style={styles.content}>
      <Text style={[styles.title, { color: theme.text }]}>
        Choose PIN Length
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Select how many digits your security PIN should have
      </Text>

      <View style={styles.lengthOptions}>
        <TouchableOpacity
          style={[
            styles.lengthOption,
            { backgroundColor: theme.surface, borderColor: pinLength === 4 ? theme.primary : theme.border },
          ]}
          onPress={() => setPinLength(4)}
        >
          <View style={[styles.lengthIcon, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.lengthNumber, { color: theme.primary }]}>4</Text>
          </View>
          <Text style={[styles.lengthTitle, { color: theme.text }]}>4-Digit PIN</Text>
          <Text style={[styles.lengthDescription, { color: theme.textSecondary }]}>
            Quick and convenient
          </Text>
          {pinLength === 4 && (
            <Ionicons name="checkmark-circle" size={24} color={theme.primary} style={styles.lengthCheck} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.lengthOption,
            { backgroundColor: theme.surface, borderColor: pinLength === 6 ? theme.primary : theme.border },
          ]}
          onPress={() => setPinLength(6)}
        >
          <View style={[styles.lengthIcon, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.lengthNumber, { color: theme.primary }]}>6</Text>
          </View>
          <Text style={[styles.lengthTitle, { color: theme.text }]}>6-Digit PIN</Text>
          <Text style={[styles.lengthDescription, { color: theme.textSecondary }]}>
            More secure (recommended)
          </Text>
          {pinLength === 6 && (
            <Ionicons name="checkmark-circle" size={24} color={theme.primary} style={styles.lengthCheck} />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => setStep('enter-pin')}
      >
        <LinearGradient
          colors={theme.gradient}
          style={styles.gradientButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.continueButtonText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderPinInput = (currentPin: string, isConfirm: boolean = false) => (
    <View style={styles.pinInputContainer}>
      <Text style={[styles.pinTitle, { color: theme.text }]}>
        {isConfirm ? 'Confirm Your PIN' : 'Enter Your PIN'}
      </Text>
      <Text style={[styles.pinSubtitle, { color: theme.textSecondary }]}>
        {isConfirm ? 'Re-enter your PIN to confirm' : `Create a ${pinLength}-digit PIN`}
      </Text>

      <View style={styles.pinDots}>
        {Array.from({ length: pinLength }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              { borderColor: theme.border },
              index < currentPin.length && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity
            key={num}
            style={[styles.keypadButton, { backgroundColor: theme.surface }]}
            onPress={() => handlePinPress(num.toString())}
          >
            <Text style={[styles.keypadText, { color: theme.text }]}>{num}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.keypadButton} />
        <TouchableOpacity
          style={[styles.keypadButton, { backgroundColor: theme.surface }]}
          onPress={() => handlePinPress('0')}
        >
          <Text style={[styles.keypadText, { color: theme.text }]}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.keypadButton, { backgroundColor: theme.surface }]}
          onPress={handleBackspace}
        >
          <Ionicons name="backspace-outline" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity 
          onPress={() => {
            if (step === 'confirm-pin') {
              setConfirmPin('');
              setStep('enter-pin');
            } else if (step === 'enter-pin') {
              setPin('');
              setStep('choose-length');
            } else if (step === 'choose-length') {
              setStep('info');
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step !== 'info' && { backgroundColor: theme.primary }]} />
          <View style={[styles.stepDot, (step === 'enter-pin' || step === 'confirm-pin') && { backgroundColor: theme.primary }]} />
          <View style={[styles.stepDot, step === 'confirm-pin' && { backgroundColor: theme.primary }]} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Setting up your security PIN...
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {step === 'info' && renderInfoStep()}
          {step === 'choose-length' && renderChooseLengthStep()}
          {step === 'enter-pin' && renderPinInput(pin, false)}
          {step === 'confirm-pin' && renderPinInput(confirmPin, true)}
        </ScrollView>
      )}
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
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
  },
  content: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: SIZES.body,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  featureList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
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
  lengthOptions: {
    width: '100%',
    marginBottom: 32,
    gap: 16,
  },
  lengthOption: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  lengthIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lengthNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  lengthTitle: {
    fontSize: SIZES.h4,
    fontWeight: '700',
    marginBottom: 8,
  },
  lengthDescription: {
    fontSize: SIZES.small,
  },
  lengthCheck: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  pinInputContainer: {
    width: '100%',
    alignItems: 'center',
  },
  pinTitle: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pinSubtitle: {
    fontSize: SIZES.body,
    marginBottom: 40,
  },
  pinDots: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 48,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  keypadButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadText: {
    fontSize: 28,
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: SIZES.body,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: SIZES.body,
  },
});
