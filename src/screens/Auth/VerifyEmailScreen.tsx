import React, { useState, useRef } from 'react';
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
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SIZES } from '../../utils/constants';

export default function VerifyEmailScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user, verifyEmail, loading } = useAuth();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const setInputRef = (index: number) => (ref: TextInput | null) => {
    inputRefs.current[index] = ref;
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter the complete verification code');
      return;
    }

    try {
      await verifyEmail(verificationCode);
      // Navigate to main app
      navigation.replace('Main');
    } catch (error) {
      setError('Invalid verification code. Please try again.');
    }
  };

  const handleResendCode = () => {
    // TODO: Implement resend code
    alert('Verification code sent to ' + user?.email);
  };

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
              <Ionicons name="mail-outline" size={48} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </View>

        {/* Title and Description */}
        <Text style={[styles.title, { color: theme.text }]}>Verify Your Email</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          We've sent a 6-digit verification code to
        </Text>
        <Text style={[styles.email, { color: theme.text }]}>{user?.email}</Text>

        {/* Code Input */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={setInputRef(index)}
              style={[
                styles.codeInput,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: digit ? theme.primary : theme.border,
                  color: theme.text,
                },
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(index, value)}
              onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(index, key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        ) : null}

        {/* Verify Button */}
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={handleVerify}
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
              <Text style={styles.verifyButtonText}>Verify Email</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: theme.textSecondary }]}>
            Didn't receive the code?{' '}
          </Text>
          <TouchableOpacity onPress={handleResendCode}>
            <Text style={[styles.resendLink, { color: theme.primary }]}>Resend</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 4,
  },
  email: {
    fontSize: SIZES.body,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  codeInput: {
    width: 50,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    fontSize: SIZES.small,
    textAlign: 'center',
    marginBottom: 16,
  },
  verifyButton: {
    borderRadius: SIZES.borderRadius,
    overflow: 'hidden',
    marginBottom: 24,
  },
  gradientButton: {
    height: SIZES.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: SIZES.small,
  },
  resendLink: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
  },
});
