import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface MessageReactionsProps {
  visible: boolean;
  onClose: () => void;
  onSelectReaction: (emoji: string) => void;
  position?: { x: number; y: number };
  defaultEmoji?: string;
}

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '�', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '�😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶'] },
  { name: 'Gestures', emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '�', '🖖', '👋', '🤝', '�🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶'] },
  { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💌'] },
  { name: 'Objects', emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '�', '�🔥', '💯', '👑', '💎', '🎯', '🎮', '🎲', '🎭', '🎨', '🎬', '🎤', '🎧', '🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🥁'] },
  { name: 'Nature', emojis: ['🌸', '🌺', '🌻', '🌹', '🌷', '💐', '🌱', '🌿', '🍀', '☘️', '🌾', '🌵', '🌴', '🌳', '🌲', '⭐', '🌟', '💫', '✨', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌈'] },
];

export default function MessageReactions({
  visible,
  onClose,
  onSelectReaction,
  position,
  defaultEmoji = '❤️',
}: MessageReactionsProps) {
  const { theme, isDark } = useTheme();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible && !showEmojiPicker) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, showEmojiPicker]);

  const handleReaction = (emoji: string) => {
    onSelectReaction(emoji);
    onClose();
    setShowEmojiPicker(false);
  };

  const handleOpenEmojiPicker = () => {
    setShowEmojiPicker(true);
  };

  const handleCloseEmojiPicker = () => {
    setShowEmojiPicker(false);
    setSelectedCategory(0);
  };

  return (
    <>
      {/* Quick Reactions Bar */}
      <Modal
        visible={visible && !showEmojiPicker}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Animated.View 
            style={[
              styles.container, 
              { 
                backgroundColor: isDark ? theme.card : '#FFFFFF',
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            {/* Default/Quick Like Button - Highlighted */}
            <TouchableOpacity
              style={[
                styles.reactionButton, 
                styles.defaultReactionButton, 
                { 
                  backgroundColor: theme.primary + '15',
                  borderColor: theme.primary,
                }
              ]}
              onPress={() => handleReaction(defaultEmoji)}
              activeOpacity={0.6}
            >
              <Text style={styles.reactionEmoji}>{defaultEmoji}</Text>
            </TouchableOpacity>

            {/* Quick Reactions */}
            {QUICK_REACTIONS.filter(e => e !== defaultEmoji).slice(0, 5).map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.reactionButton, { backgroundColor: isDark ? theme.surface : '#F0F2F5' }]}
                onPress={() => handleReaction(emoji)}
                activeOpacity={0.6}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}

            {/* Add More Emoji Button with + Icon */}
            <TouchableOpacity
              style={[
                styles.reactionButton, 
                styles.addMoreButton, 
                { 
                  backgroundColor: isDark ? theme.surface : '#F0F2F5',
                  borderColor: theme.primary + '40',
                  borderWidth: 1.5,
                }
              ]}
              onPress={handleOpenEmojiPicker}
              activeOpacity={0.6}
            >
              <Ionicons name="add-circle" size={30} color={theme.primary} />
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Full Emoji Picker */}
      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <Pressable 
          style={styles.emojiModalOverlay} 
          onPress={() => setShowEmojiPicker(false)}
        >
          <Pressable style={[styles.emojiPicker, { backgroundColor: theme.card }]}>
            <View style={[styles.emojiHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.emojiTitle, { color: theme.text }]}>Pick a Reaction</Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                <Ionicons name="close" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.emojiScroll} showsVerticalScrollIndicator={false}>
              {EMOJI_CATEGORIES.map((category, catIndex) => (
                <View key={catIndex} style={styles.emojiCategory}>
                  <Text style={[styles.categoryName, { color: theme.textSecondary }]}>
                    {category.name}
                  </Text>
                  <View style={styles.emojiGrid}>
                    {category.emojis.map((emoji, emojiIndex) => (
                      <TouchableOpacity
                        key={emojiIndex}
                        style={styles.emojiItem}
                        onPress={() => handleReaction(emoji)}
                        activeOpacity={0.6}
                      >
                        <Text style={styles.emojiChar}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 50,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    maxWidth: '92%',
  },
  reactionButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  defaultReactionButton: {
    borderWidth: 2,
  },
  addMoreButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 30,
  },
  emojiModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  emojiPicker: {
    height: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  emojiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  emojiTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  categoryTabs: {
    borderBottomWidth: 1,
    maxHeight: 56,
  },
  categoryTabsContent: {
    paddingHorizontal: 8,
    gap: 4,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    minWidth: 52,
  },
  emojiScroll: {
    flex: 1,
  },
  emojiScrollContent: {
    paddingBottom: 20,
  },
  emojiCategory: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  emojiItem: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  emojiChar: {
    fontSize: 34,
  },
});
