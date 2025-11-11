import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { storyService } from '../../services/story.service';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍', '🔥', '🎉'];

interface Story {
  id: string;
  type: 'image' | 'text';
  content: string;
  backgroundColor?: string;
  timestamp: string;
}

function formatRelative(ts: string) {
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleDateString();
}

export default function StoryViewerScreen({ route, navigation }: any) {
  const { userId, userName, storyId } = route.params || {};
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const progressAnims = useRef<Animated.CompositeAnimation[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const currentStory = stories[currentIndex];

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (storyId) {
          // TODO: Connect to Firebase backend
          console.log('TODO: Fetch story from Firebase:', storyId);
          
          // Mock: Create empty story to prevent errors
          const mapped: Story = {
            id: storyId,
            type: 'text',
            content: 'Story content will load from Firebase',
            backgroundColor: '#667eea',
            timestamp: 'Just now'
          };
          if (!active) return;
          setStories([mapped]);
        }
      } catch (e) {
        // silent
      }
    };
    load();
    return () => { active = false; };
  }, [storyId]);

  useEffect(() => {
    if (!currentStory) return;
    startProgress();
    return () => {
      progressAnims.current.forEach(anim => anim.stop());
    };
  }, [currentIndex, isPaused, currentStory?.id]);

  const startProgress = () => {
    if (isPaused) return;

    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    progressAnims.current[currentIndex] = animation;

    animation.start(({ finished }) => {
      if (finished && !isPaused) {
        handleNext();
      }
    });
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePress = (x: number) => {
    const middle = width / 2;
    if (x < middle) {
      handlePrevious();
    } else {
      handleNext();
    }
  };

  const handleLongPressIn = () => {
    setIsPaused(true);
    progressAnims.current[currentIndex]?.stop();
  };

  const handleLongPressOut = () => {
    setIsPaused(false);
    startProgress();
  };

  const handleSendReply = () => {
    if (replyText.trim()) {
      // TODO: Send reply to story owner
      console.log('Reply:', replyText);
      setReplyText('');
      setShowReply(false);
    }
  };

  const handleReaction = (emoji: string) => {
    setSelectedReaction(emoji);
    setShowReactions(false);
    // TODO: Send reaction to backend
    console.log('Reacted with:', emoji);
  };

  const handleSaveStory = () => {
    setShowOptions(false);
    // TODO: Implement save story
    console.log('Saving story...');
  };

  const handleShareStory = () => {
    setShowOptions(false);
    // TODO: Implement share story
    console.log('Sharing story...');
  };

  const handleReportStory = () => {
    setShowOptions(false);
    // TODO: Implement report story
    console.log('Reporting story...');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Story Content */}
      <Pressable
        style={styles.storyContainer}
        onPress={(e) => handlePress(e.nativeEvent.pageX)}
        onLongPress={handleLongPressIn}
        onPressOut={handleLongPressOut}
      >
        {currentStory?.type === 'text' ? (
          <LinearGradient
            colors={[currentStory.backgroundColor || '#000', '#000']}
            style={styles.textStoryBackground}
          >
            <Text style={styles.storyText}>{currentStory.content}</Text>
          </LinearGradient>
        ) : (
          currentStory && (
            <Image
              source={{ uri: currentStory.content }}
              style={styles.storyImage}
              resizeMode="cover"
            />
          )
        )}
      </Pressable>

      {/* Overlay Gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.4)']}
        style={styles.overlayGradient}
        pointerEvents="none"
      />

      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width:
                    index === currentIndex
                      ? progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        })
                      : index < currentIndex
                      ? '100%'
                      : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <LinearGradient
              colors={theme.gradient}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>
                {userName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userName || 'User'}</Text>
            {!!currentStory && <Text style={styles.timestamp}>{currentStory.timestamp}</Text>}
          </View>
        </View>

        <View style={styles.headerActions}>
          {isPaused && (
            <View style={styles.pausedIndicator}>
              <Ionicons name="pause" size={16} color="#fff" />
            </View>
          )}
          <TouchableOpacity onPress={() => setIsPaused(!isPaused)}>
            <Ionicons
              name={isPaused ? 'play' : 'pause'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => setShowOptions(true)}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reply Input - Positioned at bottom with keyboard support */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.replyContainerWrapper}
      >
        <View style={styles.replyContainer}>
          <View style={styles.bottomActions}>
            {/* Reaction Button */}
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={() => setShowReactions(!showReactions)}
            >
              {selectedReaction ? (
                <Text style={styles.selectedReactionText}>{selectedReaction}</Text>
              ) : (
                <Ionicons name="heart-outline" size={28} color="#fff" />
              )}
            </TouchableOpacity>

            {/* Message Input */}
            {showReply ? (
              <View style={[styles.replyInputContainer, { backgroundColor: theme.surface + 'E6' }]}>
                <TextInput
                  style={[styles.replyInput, { color: theme.text }]}
                  placeholder={t('story.reply')}
                  placeholderTextColor={theme.placeholder}
                  value={replyText}
                  onChangeText={setReplyText}
                  autoFocus
                  multiline
                  maxLength={200}
                />
                <TouchableOpacity onPress={handleSendReply} style={styles.sendIconButton}>
                  <LinearGradient
                    colors={theme.gradient}
                    style={styles.sendButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="send" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.replyButton}
                onPress={() => setShowReply(true)}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.replyButtonGradient}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                  <Text style={styles.replyButtonText}>{t('story.reply')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Share Button */}
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={handleShareStory}
            >
              <Ionicons name="paper-plane-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Reactions Picker */}
          {showReactions && (
            <View style={styles.reactionsContainer}>
              {REACTION_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionButton}
                  onPress={() => handleReaction(emoji)}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Options Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowOptions(false)}
        >
          <View style={[styles.optionsModal, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={[styles.optionItem, { borderBottomColor: theme.border }]}
              onPress={handleSaveStory}
            >
              <Ionicons name="download-outline" size={24} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>{t('story.saveStory')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionItem, { borderBottomColor: theme.border }]}
              onPress={handleShareStory}
            >
              <Ionicons name="share-outline" size={24} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>{t('story.shareStory')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowOptions(false);
                navigation.navigate('ChatRoom', { chatId: userId, chatName: userName });
              }}
            >
              <Ionicons name="chatbubble-outline" size={24} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>{t('chat.sendMessage')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleReportStory}
            >
              <Ionicons name="flag-outline" size={24} color={theme.error} />
              <Text style={[styles.optionText, { color: theme.error }]}>{t('story.reportStory')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.background }]}
              onPress={() => setShowOptions(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyContainer: {
    flex: 1,
  },
  textStoryBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  storyText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  storyImage: {
    width: width,
    height: height,
  },
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  userDetails: {
    gap: 2,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  pausedIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  closeButton: {
    padding: 4,
  },
  headerAction: {
    padding: 4,
  },
  replyContainerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  replyContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedReactionText: {
    fontSize: 28,
  },
  replyButton: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  replyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  replyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  replyInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  replyInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendIconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionsContainer: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    gap: 8,
  },
  reactionButton: {
    padding: 8,
  },
  reactionEmoji: {
    fontSize: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  optionsModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
