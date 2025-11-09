import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface MessageAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  destructive?: boolean;
}

interface MessageActionsSheetProps {
  visible: boolean;
  onClose: () => void;
  actions: MessageAction[];
  onSelectAction: (actionId: string) => void;
  messagePreview?: {
    text: string;
    isMine: boolean;
  };
}

export default function MessageActionsSheet({
  visible,
  onClose,
  actions,
  onSelectAction,
  messagePreview,
}: MessageActionsSheetProps) {
  const { theme, isDark } = useTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSelectAction = (actionId: string) => {
    onSelectAction(actionId);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.overlayBackground,
            {
              opacity: fadeAnim,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          ]}
        />
      </Pressable>

      <Animated.View
        style={[
          styles.sheetContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handle,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' },
              ]}
            />
          </View>

          {/* Message Preview */}
          {messagePreview && (
            <View
              style={[
                styles.messagePreview,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={theme.textSecondary}
                style={styles.previewIcon}
              />
              <Text
                style={[styles.previewText, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {messagePreview.text}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => {
              const isDestructive = action.destructive;
              const color = isDestructive
                ? theme.error
                : action.color || theme.text;

              return (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.actionButton,
                    {
                      borderBottomColor: theme.border,
                      borderBottomWidth: index < actions.length - 1 ? 1 : 0,
                    },
                  ]}
                  onPress={() => handleSelectAction(action.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.actionIconContainer,
                      {
                        backgroundColor: isDestructive
                          ? `${theme.error}15`
                          : isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.05)',
                      },
                    ]}
                  >
                    <Ionicons name={action.icon} size={22} color={color} />
                  </View>
                  <Text style={[styles.actionLabel, { color }]}>
                    {action.label}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.textSecondary}
                    style={styles.chevron}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[
              styles.cancelButton,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              },
            ]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  chevron: {
    opacity: 0.5,
  },
  cancelButton: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
