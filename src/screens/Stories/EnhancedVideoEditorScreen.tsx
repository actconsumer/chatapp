import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
  Animated,
  ScrollView,
  ActivityIndicator,
  PanResponder,
  Modal,
  Keyboard,
  GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Slider } from '@react-native-assets/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SIZES } from '../../utils/constants';
import StoryHeader from './components/StoryHeader';
import { blobStorageService } from '../../services/blobStorage.service';
import { storyService } from '../../services/story.service';

const { width, height } = Dimensions.get('window');

interface TextOverlay {
  id: string;
  text: string;
  color: string;
  size: number;
  x: number;
  y: number;
  scale: number;
}

interface EnhancedVideoEditorScreenProps {
  navigation: any;
  route?: {
    params?: {
      mediaUri: string;
      mediaType: 'video';
    };
  };
}

const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF6B9D', '#FFD93D', '#6BCB77',
  '#4ECDC4', '#667eea', '#f12711', '#cc2b5e', '#56ab2f'
];

const TEXT_SIZES = [
  { label: 'S', value: 18 },
  { label: 'M', value: 28 },
  { label: 'L', value: 42 },
  { label: 'XL', value: 56 },
];

export default function EnhancedVideoEditorScreen({ navigation, route }: EnhancedVideoEditorScreenProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { mediaUri } = route?.params || { mediaUri: '' };

  const [isLoading, setIsLoading] = useState(true);
  const [videoDuration, setVideoDuration] = useState(10);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const [currentText, setCurrentText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedSize, setSelectedSize] = useState(28);
  const [isPublishing, setIsPublishing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const player = useVideoPlayer(mediaUri);
  const videoContainerRef = useRef<View>(null);

  // Gesture tracking
  const panOffset = useRef({ x: 0, y: 0 });
  const initialDistance = useRef(0);
  const initialScale = useRef(1);

  useEffect(() => {
    player.loop = true;
    
    const checkDuration = setInterval(() => {
      if (player.duration > 0) {
        const duration = Math.floor(player.duration);
        setVideoDuration(duration);
        setEndTime(Math.min(duration, 10));
        setIsLoading(false);
        clearInterval(checkDuration);
      }
    }, 100);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    return () => {
      clearInterval(checkDuration);
      player.pause();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (player.currentTime >= endTime) {
        player.currentTime = startTime;
      }
      setCurrentTime(player.currentTime);
    }, 100);

    return () => clearInterval(interval);
  }, [endTime, startTime]);

  const calculateDistance = (touches: any[]) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const createPanResponder = (overlayId: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const overlay = textOverlays.find(o => o.id === overlayId);
        if (overlay) {
          panOffset.current = { x: overlay.x, y: overlay.y };
          initialScale.current = overlay.scale;
          setSelectedOverlay(overlayId);
          
          if (evt.nativeEvent.touches.length === 2) {
            initialDistance.current = calculateDistance(evt.nativeEvent.touches);
          }
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2) {
          // Pinch to zoom
          const currentDistance = calculateDistance(evt.nativeEvent.touches);
          const scale = (currentDistance / initialDistance.current) * initialScale.current;
          const clampedScale = Math.max(0.5, Math.min(scale, 3));
          
          setTextOverlays(prev =>
            prev.map(overlay =>
              overlay.id === overlayId
                ? { ...overlay, scale: clampedScale }
                : overlay
            )
          );
        } else {
          // Drag to move
          const newX = panOffset.current.x + gestureState.dx;
          const newY = panOffset.current.y + gestureState.dy;
          
          setTextOverlays(prev =>
            prev.map(overlay =>
              overlay.id === overlayId
                ? { ...overlay, x: newX, y: newY }
                : overlay
            )
          );
        }
      },
      onPanResponderRelease: () => {
        initialDistance.current = 0;
      },
    });
  };

  const handleVideoTap = (event: GestureResponderEvent) => {
    if (selectedOverlay) {
      setSelectedOverlay(null);
      return;
    }

    videoContainerRef.current?.measure((x, y, w, h, pageX, pageY) => {
      const tapX = event.nativeEvent.pageX - pageX;
      const tapY = event.nativeEvent.pageY - pageY;
      
      const tappedOverlay = textOverlays.find(overlay => {
        const textWidth = overlay.text.length * (overlay.size * overlay.scale * 0.6);
        const textHeight = overlay.size * overlay.scale;
        return (
          tapX >= overlay.x &&
          tapX <= overlay.x + textWidth &&
          tapY >= overlay.y &&
          tapY <= overlay.y + textHeight
        );
      });

      if (tappedOverlay) {
        setSelectedOverlay(tappedOverlay.id);
      } else {
        // Add new text at tap position
        const newOverlay: TextOverlay = {
          id: Date.now().toString(),
          text: t('story.tapToEdit'),
          color: selectedColor,
          size: selectedSize,
          x: tapX - 50,
          y: tapY - 20,
          scale: 1,
        };
        setTextOverlays([...textOverlays, newOverlay]);
        setSelectedOverlay(newOverlay.id);
      }
    });
  };

  const handleOverlayDoubleTap = (overlayId: string) => {
    const overlay = textOverlays.find(o => o.id === overlayId);
    if (overlay) {
      setCurrentText(overlay.text);
      setSelectedColor(overlay.color);
      setSelectedSize(overlay.size);
      setEditingOverlayId(overlayId);
      setShowTextModal(true);
    }
  };

  const handleSaveText = () => {
    if (!currentText.trim()) {
      Alert.alert(t('common.error'), t('story.enterText'));
      return;
    }

    if (editingOverlayId) {
      setTextOverlays(prev =>
        prev.map(overlay =>
          overlay.id === editingOverlayId
            ? { ...overlay, text: currentText, color: selectedColor, size: selectedSize }
            : overlay
        )
      );
    } else {
      const newOverlay: TextOverlay = {
        id: Date.now().toString(),
        text: currentText,
        color: selectedColor,
        size: selectedSize,
        x: width / 2 - 50,
        y: height / 3,
        scale: 1,
      };
      setTextOverlays([...textOverlays, newOverlay]);
    }

    setCurrentText('');
    setShowTextModal(false);
    setEditingOverlayId(null);
  };

  const handleDeleteOverlay = () => {
    if (selectedOverlay) {
      setTextOverlays(prev => prev.filter(o => o.id !== selectedOverlay));
      setSelectedOverlay(null);
    }
  };

  const handleTogglePlayback = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePublish = async () => {
    if (endTime - startTime > 60) {
      Alert.alert(t('common.error'), t('story.videoTooLong'));
      return;
    }

    setIsPublishing(true);
    try {
      // Upload video to blob storage
      const fileName = `story-video-${Date.now()}.mp4`;
      const mediaUrl = await blobStorageService.uploadStoryMedia(mediaUri, fileName);

      // Prepare story data
      const storyData: any = {
        mediaUrl,
        mediaType: 'video',
        duration: Math.floor(endTime - startTime),
        privacy: 'friends',
      };

      // Add caption from text overlays
      if (textOverlays.length > 0) {
        storyData.caption = textOverlays.map(t => t.text).join(' ');
      }

      // Create the story
      await storyService.create(storyData);

      setIsPublishing(false);
      navigation.navigate('StoryList');
      Alert.alert(t('common.success'), t('story.storyPublished'));
    } catch (error: any) {
      setIsPublishing(false);
      Alert.alert(
        t('common.error'),
        error.message || t('common.somethingWrong')
      );
    }
  };

  const trimmedDuration = endTime - startTime;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            {t('story.loadingVideo')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Story Header */}
      <StoryHeader
        title={t('story.editVideo')}
        onBack={() => navigation.goBack()}
        onReset={() => {
          setTextOverlays([]);
          setSelectedOverlay(null);
        }}
        onPublish={handlePublish}
        isPublishing={isPublishing}
        disabled={trimmedDuration > 10}
        isDark={true}
        theme={theme}
        t={t}
      />

      {/* Video Preview with Overlays */}
      <Animated.View style={[styles.videoContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          ref={videoContainerRef}
          activeOpacity={1}
          onPress={handleVideoTap}
          style={styles.videoTouchable}
        >
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
          />
          
          {/* Text Overlays */}
          {textOverlays.map(overlay => {
            const panResponder = createPanResponder(overlay.id);
            const isSelected = selectedOverlay === overlay.id;
            
            return (
              <Animated.View
                key={overlay.id}
                {...panResponder.panHandlers}
                style={[
                  styles.textOverlay,
                  {
                    left: overlay.x,
                    top: overlay.y,
                    transform: [{ scale: overlay.scale }],
                  },
                  isSelected && styles.textOverlaySelected,
                ]}
              >
                <TouchableOpacity
                  onPress={() => setSelectedOverlay(overlay.id)}
                  onLongPress={() => handleOverlayDoubleTap(overlay.id)}
                  delayLongPress={500}
                >
                  <Text
                    style={[
                      styles.overlayText,
                      {
                        color: overlay.color,
                        fontSize: overlay.size,
                        textShadowColor: overlay.color === '#FFFFFF' ? '#000' : '#fff',
                      },
                    ]}
                  >
                    {overlay.text}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </TouchableOpacity>

        {/* Hint Text */}
        {textOverlays.length === 0 && (
          <View style={styles.hintContainer}>
            <MaterialCommunityIcons name="cursor-pointer" size={40} color="rgba(255,255,255,0.6)" />
            <Text style={styles.hintText}>{t('story.tapScreenToAddText')}</Text>
            <Text style={styles.hintSubtext}>{t('story.dragToMove')}</Text>
          </View>
        )}

        {/* Selected Overlay Controls */}
        {selectedOverlay && (
          <View style={styles.overlayControls}>
            <TouchableOpacity
              style={styles.overlayControlButton}
              onPress={() => handleOverlayDoubleTap(selectedOverlay)}
            >
              <Ionicons name="create-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.overlayControlButton, styles.deleteButton]}
              onPress={handleDeleteOverlay}
            >
              <Ionicons name="trash-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Bottom Controls */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.bottomControls}
      >
        {/* Trim Controls */}
        <View style={styles.trimSection}>
          <View style={styles.trimHeader}>
            <View style={styles.trimTitleRow}>
              <MaterialCommunityIcons name="content-cut" size={22} color="#fff" />
              <Text style={styles.trimTitle}>{t('story.trimVideo')}</Text>
            </View>
            <View style={[
              styles.durationBadge,
              trimmedDuration > 10 && styles.durationBadgeError
            ]}>
              <Text style={[
                styles.durationText,
                trimmedDuration > 10 && styles.durationTextError
              ]}>
                {trimmedDuration.toFixed(1)}s
              </Text>
            </View>
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderRow}>
              <Ionicons name="play-circle-outline" size={20} color="#4ECDC4" />
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={videoDuration}
                value={startTime}
                onValueChange={setStartTime}
                minimumTrackTintColor="#4ECDC4"
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="#4ECDC4"
                step={0.1}
              />
              <Text style={styles.sliderLabel}>{startTime.toFixed(1)}s</Text>
            </View>

            <View style={styles.sliderRow}>
              <Ionicons name="stop-circle-outline" size={20} color="#FF6B9D" />
              <Slider
                style={styles.slider}
                minimumValue={startTime}
                maximumValue={videoDuration}
                value={endTime}
                onValueChange={setEndTime}
                minimumTrackTintColor="#FF6B9D"
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="#FF6B9D"
                step={0.1}
              />
              <Text style={styles.sliderLabel}>{endTime.toFixed(1)}s</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTogglePlayback}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionButtonLabel}>
              {isPlaying ? t('common.pause') : t('common.play')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setCurrentText('');
              setEditingOverlayId(null);
              setShowTextModal(true);
            }}
          >
            <LinearGradient
              colors={['#FFD93D', '#FFA726']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="text" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionButtonLabel}>{t('story.addText')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePublish}
            disabled={isPublishing}
          >
            <LinearGradient
              colors={['#00C6FF', '#0084FF']}
              style={styles.actionButtonGradient}
            >
              {isPublishing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="checkmark" size={28} color="#fff" />
              )}
            </LinearGradient>
            <Text style={styles.actionButtonLabel}>{t('story.publish')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Text Edit Modal */}
      <Modal
        visible={showTextModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTextModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            setShowTextModal(false);
          }}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {editingOverlayId ? t('story.editText') : t('story.addText')}
                </Text>
                <TouchableOpacity onPress={() => setShowTextModal(false)}>
                  <Ionicons name="close" size={26} color={theme.text} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                placeholder={t('story.enterText')}
                placeholderTextColor={theme.textSecondary}
                value={currentText}
                onChangeText={setCurrentText}
                multiline
                maxLength={100}
                autoFocus
              />

              {/* Color Picker */}
              <Text style={[styles.modalSectionTitle, { color: theme.text }]}>
                {t('story.textColor')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
                {TEXT_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                  />
                ))}
              </ScrollView>

              {/* Size Picker */}
              <Text style={[styles.modalSectionTitle, { color: theme.text }]}>
                {t('story.textSize')}
              </Text>
              <View style={styles.sizePicker}>
                {TEXT_SIZES.map(size => (
                  <TouchableOpacity
                    key={size.value}
                    onPress={() => setSelectedSize(size.value)}
                    style={[
                      styles.sizeOption,
                      { backgroundColor: theme.background },
                      selectedSize === size.value && { backgroundColor: theme.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sizeLabel,
                        { color: theme.text },
                        selectedSize === size.value && { color: '#fff' },
                      ]}
                    >
                      {size.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { opacity: currentText.trim() ? 1 : 0.5 }]}
                onPress={handleSaveText}
                disabled={!currentText.trim()}
              >
                <LinearGradient
                  colors={['#00C6FF', '#0084FF']}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>
                    {editingOverlayId ? t('common.update') : t('common.add')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoTouchable: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  textOverlay: {
    position: 'absolute',
    padding: 8,
  },
  textOverlaySelected: {
    borderWidth: 2,
    borderColor: '#0084FF',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 132, 255, 0.1)',
  },
  overlayText: {
    fontWeight: '700',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  hintContainer: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 12,
    textAlign: 'center',
  },
  hintSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
    textAlign: 'center',
  },
  overlayControls: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  overlayControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 132, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  trimSection: {
    marginBottom: 20,
  },
  trimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trimTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trimTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  durationBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  durationBadgeError: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderColor: '#FF3B30',
  },
  durationText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  durationTextError: {
    color: '#FF3B30',
  },
  sliderContainer: {
    gap: 16,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    minWidth: 48,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  actionButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    fontSize: SIZES.body,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: SIZES.body,
    fontWeight: '700',
    marginBottom: 12,
  },
  colorPicker: {
    marginBottom: 24,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#0084FF',
    transform: [{ scale: 1.1 }],
  },
  sizePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sizeOption: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});
