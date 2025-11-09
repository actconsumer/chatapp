import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { socketService } from '../services/socket.service';

interface TypingIndicatorProps {
  isVisible?: boolean;
  chatId?: string; // Optional: to listen for typing events in specific chat
  onTypingChange?: (isTyping: boolean, userId: string) => void;
}

export default function TypingIndicator({ 
  isVisible = true, 
  chatId,
  onTypingChange,
}: TypingIndicatorProps) {
  const { theme } = useTheme();
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  // Listen for typing events via socket if chatId is provided
  useEffect(() => {
    if (!chatId) return;

    const handleTypingStart = (data: any) => {
      if (data.chatId === chatId) {
        onTypingChange?.(true, data.userId);
      }
    };

    const handleTypingStop = (data: any) => {
      if (data.chatId === chatId) {
        onTypingChange?.(false, data.userId);
      }
    };

    socketService.on('typing:start', handleTypingStart);
    socketService.on('typing:stop', handleTypingStop);

    return () => {
      socketService.off('typing:start', handleTypingStart);
      socketService.off('typing:stop', handleTypingStop);
    };
  }, [chatId, onTypingChange]);

  useEffect(() => {
    if (isVisible) {
      const animateDot = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animation = Animated.parallel([
        animateDot(dot1Anim, 0),
        animateDot(dot2Anim, 150),
        animateDot(dot3Anim, 300),
      ]);

      animation.start();

      return () => {
        animation.stop();
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
    ],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: theme.textSecondary },
          dotStyle(dot1Anim),
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: theme.textSecondary },
          dotStyle(dot2Anim),
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: theme.textSecondary },
          dotStyle(dot3Anim),
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    marginLeft: 12,
    marginVertical: 4,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
