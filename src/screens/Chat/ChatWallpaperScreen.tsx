import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { CHAT_WALLPAPERS, getWallpaper, WallpaperConfig } from '../../utils/wallpapers';
import { saveChatPreferences, getChatPreferences } from '../../utils/chatStorage';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WALLPAPER_ITEM_SIZE = (SCREEN_WIDTH - 48) / 2;

interface ChatWallpaperScreenProps {
  navigation: any;
  route: any;
}

export default function ChatWallpaperScreen({ navigation, route }: ChatWallpaperScreenProps) {
  const { theme, isDark } = useTheme();
  const { chatId, currentWallpaper: initialWallpaperId, onSelectWallpaper } = route.params || {};
  
  const [selectedWallpaper, setSelectedWallpaper] = useState<WallpaperConfig>(
    getWallpaper(initialWallpaperId)
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customEmoji, setCustomEmoji] = useState<string>(selectedWallpaper.defaultEmoji);
  const [isLoading, setIsLoading] = useState(true);
  const [customWallpaper, setCustomWallpaper] = useState<WallpaperConfig | null>(null);
  const [allWallpapers, setAllWallpapers] = useState<WallpaperConfig[]>(CHAT_WALLPAPERS);

  const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉', '👏', '💯', '🌟', '💪'];

  // Load saved preferences on mount
  useEffect(() => {
    loadPreferences();
    loadCustomWallpaper();
  }, []);

  const loadCustomWallpaper = async () => {
    try {
      const saved = await AsyncStorage.getItem('@custom_wallpaper');
      if (saved) {
        const customConfig = JSON.parse(saved);
        setCustomWallpaper(customConfig);
        // Add custom wallpaper to the list
        setAllWallpapers([...CHAT_WALLPAPERS, customConfig]);
      }
    } catch (error) {
      console.error('Error loading custom wallpaper:', error);
    }
  };

  const loadPreferences = async () => {
    if (chatId) {
      try {
        const preferences = await getChatPreferences(chatId);
        if (preferences) {
          const wallpaper = getWallpaper(preferences.wallpaperId);
          setSelectedWallpaper(wallpaper);
          setCustomEmoji(preferences.customEmoji);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  const pickCustomWallpaper = async () => {
    // Navigate to Custom Wallpaper Screen
    navigation.navigate('CustomWallpaper', {
      chatId,
      currentConfig: customWallpaper || null,
      onSave: async (config: any) => {
        // Reload custom wallpaper after save
        await loadCustomWallpaper();
      },
    });
  };

  const applyWallpaper = async () => {
    // Save to cache
    if (chatId) {
      await saveChatPreferences(chatId, selectedWallpaper.id, customEmoji);
    }
    
    // Call the callback
    if (onSelectWallpaper) {
      onSelectWallpaper(selectedWallpaper.id, customEmoji);
    }
    
    navigation.goBack();
  };

  const handleWallpaperSelect = (wallpaper: WallpaperConfig) => {
    setSelectedWallpaper(wallpaper);
    setCustomEmoji(wallpaper.defaultEmoji);
  };

  const renderWallpaperPreview = (wallpaper: WallpaperConfig) => {
    const isSelected = selectedWallpaper.id === wallpaper.id;
    
    return (
      <TouchableOpacity
        key={wallpaper.id}
        style={[
          styles.wallpaperItem,
          isSelected && { borderColor: theme.primary, borderWidth: 3 }
        ]}
        onPress={() => handleWallpaperSelect(wallpaper)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={wallpaper.gradient as any || [theme.surface, theme.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.wallpaperGradient}
        >
          {/* Preview Message Bubbles */}
          <View style={styles.previewMessages}>
            <View style={[styles.previewBubbleReceived, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]}>
              <Text style={styles.previewText}>Hey!</Text>
            </View>
            <View style={[styles.previewBubbleSent, { backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)' }]}>
              <Text style={[styles.previewText, { color: isDark ? '#fff' : '#000' }]}>Hi there 👋</Text>
            </View>
          </View>

          {/* Default Emoji Badge */}
          <View style={[styles.emojiBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}>
            <Text style={styles.emojiBadgeText}>{wallpaper.defaultEmoji}</Text>
          </View>

          {/* Check Icon */}
          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
          )}
        </LinearGradient>

        <Text style={[styles.wallpaperName, { color: theme.text }]} numberOfLines={1}>
          {wallpaper.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Wallpaper & Emoji</Text>
        <TouchableOpacity onPress={applyWallpaper} style={styles.applyButton}>
          <Text style={[styles.applyText, { color: theme.primary }]}>Apply</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Selection Preview */}
        <View style={[styles.currentPreview, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <LinearGradient
            colors={selectedWallpaper.gradient as any || [theme.surface, theme.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.currentGradient}
          >
            <View style={styles.currentOverlay}>
              <Ionicons name="chatbubbles" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.currentWallpaperName}>{selectedWallpaper.name}</Text>
              <View style={styles.currentEmojiContainer}>
                <Text style={styles.currentEmoji}>{customEmoji}</Text>
                <Text style={styles.currentEmojiLabel}>Quick Reaction</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Customize Default Emoji */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Reaction Emoji</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Choose a default emoji for quick reactions
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emojiList}
          >
            {QUICK_EMOJIS.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.emojiItem,
                  { backgroundColor: theme.surface },
                  customEmoji === emoji && { 
                    backgroundColor: theme.primary + '20',
                    borderColor: theme.primary,
                    borderWidth: 2,
                  }
                ]}
                onPress={() => setCustomEmoji(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.emojiItem, styles.moreEmojiButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowEmojiPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={28} color={theme.primary} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Wallpapers Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Choose Wallpaper</Text>
          
          <View style={styles.wallpapersGrid}>
            {allWallpapers.map(wallpaper => renderWallpaperPreview(wallpaper))}
            
            {/* Custom Wallpaper Option */}
            <TouchableOpacity
              style={[styles.wallpaperItem, styles.customWallpaperButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
              onPress={pickCustomWallpaper}
              activeOpacity={0.8}
            >
              <Ionicons name="color-palette" size={48} color={theme.primary} />
              <Text style={[styles.customWallpaperText, { color: theme.text, fontWeight: '600' }]}>
                Custom Theme
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
        statusBarTranslucent
      >
        <Pressable 
          style={styles.emojiModalOverlay} 
          onPress={() => setShowEmojiPicker(false)}
        >
          <View style={[styles.emojiPickerModal, { backgroundColor: theme.card }]}>
            <View style={[styles.emojiPickerHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.emojiPickerTitle, { color: theme.text }]}>Select Emoji</Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                <Ionicons name="close" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.emojiPickerScroll}>
              <View style={styles.emojiPickerGrid}>
                {['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤝', '🙏', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫', '🔥', '💯', '👑', '💎', '🎯', '🎮', '🚀', '⚡', '💥'].map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.emojiPickerItem,
                      customEmoji === emoji && { backgroundColor: theme.primary + '20' }
                    ]}
                    onPress={() => {
                      setCustomEmoji(emoji);
                      setShowEmojiPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emojiPickerText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  applyButton: {
    paddingHorizontal: 12,
  },
  applyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  currentPreview: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  currentGradient: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentOverlay: {
    alignItems: 'center',
    gap: 12,
  },
  currentWallpaperName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  currentEmojiContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  currentEmoji: {
    fontSize: 48,
  },
  currentEmojiLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  emojiList: {
    gap: 10,
    paddingVertical: 8,
  },
  emojiItem: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 28,
  },
  moreEmojiButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  wallpapersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wallpaperItem: {
    width: WALLPAPER_ITEM_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  wallpaperGradient: {
    height: 180,
    padding: 12,
  },
  previewMessages: {
    flex: 1,
    gap: 8,
    justifyContent: 'flex-end',
  },
  previewBubbleReceived: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '75%',
  },
  previewBubbleSent: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '75%',
  },
  previewText: {
    fontSize: 12,
    color: '#fff',
  },
  emojiBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiBadgeText: {
    fontSize: 18,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wallpaperName: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 10,
    textAlign: 'center',
  },
  customWallpaperButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    height: 220,
  },
  customWallpaperText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  emojiModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  emojiPickerModal: {
    height: '65%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  emojiPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emojiPickerScroll: {
    flex: 1,
  },
  emojiPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 8,
  },
  emojiPickerItem: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  emojiPickerText: {
    fontSize: 32,
  },
});
