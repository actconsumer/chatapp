import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface BotPreventionProps {
  visible: boolean;
  onVerified: () => void;
  onCancel: () => void;
}

export default function BotPrevention({ visible, onVerified, onCancel }: BotPreventionProps) {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPressed && !isVerified) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsVerified(true);
            clearInterval(interval);
            setTimeout(() => {
              onVerified();
              resetState();
            }, 500);
            return 100;
          }
          return prev + 2; // 2% every 20ms = 10 seconds total
        });
      }, 200); // Update every 200ms
    } else if (!isPressed) {
      setProgress(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPressed, isVerified]);

  const resetState = () => {
    setIsPressed(false);
    setProgress(0);
    setIsVerified(false);
  };

  const handleCancel = () => {
    resetState();
    onCancel();
  };

  const handlePressIn = () => {
    if (!isVerified) {
      setIsPressed(true);
    }
  };

  const handlePressOut = () => {
    if (!isVerified) {
      setIsPressed(false);
      setProgress(0);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <Pressable style={[styles.container, { backgroundColor: theme.card }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
            {isVerified ? (
              <LinearGradient
                colors={theme.gradient}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="checkmark-circle" size={48} color="#fff" />
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={theme.gradient}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="shield-checkmark-outline" size={48} color="#fff" />
              </LinearGradient>
            )}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>
            {isVerified ? 'Verified!' : 'Verify You\'re Human'}
          </Text>
          
          {!isVerified && (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Press and hold the button below for 10 seconds
            </Text>
          )}

          {/* Progress Bar */}
          {!isVerified && (
            <View style={[styles.progressBarContainer, { backgroundColor: theme.surface }]}>
              <LinearGradient
                colors={theme.gradient}
                style={[styles.progressBar, { width: `${progress}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          )}

          {/* Timer */}
          {!isVerified && isPressed && (
            <Text style={[styles.timer, { color: theme.primary }]}>
              {Math.ceil((100 - progress) / 10)} seconds remaining...
            </Text>
          )}

          {/* Hold Button */}
          {!isVerified && (
            <TouchableOpacity
              style={styles.holdButtonContainer}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={isPressed ? theme.gradient : ['#CCCCCC', '#AAAAAA']}
                style={[
                  styles.holdButton,
                  isPressed && styles.holdButtonPressed,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons 
                  name={isPressed ? "hand-right" : "hand-right-outline"} 
                  size={32} 
                  color="#fff" 
                />
                <Text style={styles.holdButtonText}>
                  {isPressed ? 'Keep Holding...' : 'Press & Hold'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Success Message */}
          {isVerified && (
            <View style={styles.successContainer}>
              <Text style={[styles.successText, { color: theme.success }]}>
                Verification successful!
              </Text>
            </View>
          )}

          {/* Cancel Button */}
          {!isVerified && (
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  timer: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  holdButtonContainer: {
    width: '100%',
    marginBottom: 16,
  },
  holdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    gap: 12,
  },
  holdButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  holdButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  successContainer: {
    paddingVertical: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
