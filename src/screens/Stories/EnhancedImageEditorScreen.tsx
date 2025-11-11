import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Alert,
  Animated,
  ScrollView,
  ActivityIndicator,
  PanResponder,
  GestureResponderEvent,
  Modal,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SIZES } from '../../utils/constants';
import StoryHeader from './components/StoryHeader';

const { width, height } = Dimensions.get('window');

type ColorTuple = [string, string] | [string, string, string];

interface GradientOption {
  name: string;
  colors: ColorTuple;
  icon: string;
}

interface TextOverlay {
  id: string;
  text: string;
  color: string;
  backgroundColor: string;
  size: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  textDecorationLine: 'none' | 'underline' | 'line-through';
  x: number;
  y: number;
  scale: number;
}

interface EnhancedImageEditorScreenProps {
  navigation: any;
  route?: {
    params?: {
      mediaUri: string | null;
      mediaType: 'image' | 'text';
      gradient?: GradientOption;
    };
  };
}

const GRADIENT_BACKGROUNDS: GradientOption[] = [
  { name: 'Violet Dream', colors: ['#667eea', '#764ba2'], icon: 'water' },
  { name: 'Ocean Blue', colors: ['#2193b0', '#6dd5ed'], icon: 'waves' },
  { name: 'Sunset', colors: ['#f12711', '#f5af19'], icon: 'white-balance-sunny' },
  { name: 'Forest', colors: ['#134e5e', '#71b280'], icon: 'tree' },
  { name: 'Purple Love', colors: ['#cc2b5e', '#753a88'], icon: 'heart' },
  { name: 'Night Sky', colors: ['#0f2027', '#203a43', '#2c5364'], icon: 'moon-waning-crescent' },
  { name: 'Peach', colors: ['#ed4264', '#ffedbc'], icon: 'flower' },
  { name: 'Mint', colors: ['#56ab2f', '#a8e063'], icon: 'leaf' },
];

const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF6B9D', '#FFD93D', '#6BCB77',
  '#4ECDC4', '#667eea', '#f12711', '#cc2b5e', '#56ab2f',
  '#FF5722', '#9C27B0', '#3F51B5', '#00BCD4', '#8BC34A',
];

const BG_COLORS = [
  'transparent', '#FFFFFF', '#000000', '#FF6B9D', '#FFD93D',
  '#6BCB77', '#4ECDC4', '#667eea', '#f12711', '#cc2b5e',
];

const TEXT_STYLES = [
  { id: 'classic', name: 'Classic', sample: 'Aa' },
  { id: 'modern', name: 'Modern', sample: 'Aa', bold: true },
  { id: 'neon', name: 'Neon', sample: 'Aa', color: '#00ffff' },
  { id: 'typewriter', name: 'Type', sample: 'Aa' },
  { id: 'strong', name: 'Strong', sample: 'Aa', bold: true, large: true },
];

const FILTERS = [
  { name: 'None', value: null, icon: 'ban' },
  { name: 'Vintage', value: 'sepia', icon: 'camera-retro' },
  { name: 'Cool', value: 'cool', icon: 'snowflake' },
  { name: 'Warm', value: 'warm', icon: 'fire' },
  { name: 'B&W', value: 'grayscale', icon: 'adjust' },
];

export default function EnhancedImageEditorScreen({ navigation, route }: EnhancedImageEditorScreenProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { mediaUri, mediaType, gradient } = route?.params || { 
    mediaUri: null, 
    mediaType: 'text' as const,
    gradient: undefined 
  };

  const [selectedGradient, setSelectedGradient] = useState<GradientOption>(
    gradient || GRADIENT_BACKGROUNDS[0]
  );
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedBgColor, setSelectedBgColor] = useState('transparent');
  const [textSize, setTextSize] = useState(32);
  const [textWeight, setTextWeight] = useState<'normal' | 'bold'>('bold');
  const [textStyle, setTextStyle] = useState<'normal' | 'italic'>('normal');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline' | 'line-through'>('none');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const imageContainerRef = useRef<View>(null);
  const panOffset = useRef({ x: 0, y: 0 });
  const initialDistance = useRef(0);
  const initialScale = useRef(1);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleScreenTap = (event: GestureResponderEvent) => {
    if (selectedOverlayId) {
      setSelectedOverlayId(null);
      return;
    }

    imageContainerRef.current?.measure((x, y, w, h, pageX, pageY) => {
      const tapX = event.nativeEvent.pageX - pageX;
      const tapY = event.nativeEvent.pageY - pageY;
      
      // Check if tapped on existing text
      const tappedOverlay = textOverlays.find(overlay => {
        const textWidth = overlay.text.length * (overlay.size * overlay.scale * 0.6);
        const textHeight = overlay.size * overlay.scale * 1.2;
        return (
          tapX >= overlay.x &&
          tapX <= overlay.x + textWidth &&
          tapY >= overlay.y &&
          tapY <= overlay.y + textHeight
        );
      });

      if (tappedOverlay) {
        setSelectedOverlayId(tappedOverlay.id);
      } else {
        // Add new text at tap position
        const newOverlay: TextOverlay = {
          id: Date.now().toString(),
          text: 'Tap to edit',
          color: selectedColor,
          backgroundColor: selectedBgColor,
          size: textSize,
          fontWeight: textWeight,
          fontStyle: textStyle,
          textAlign: textAlign,
          textDecorationLine: textDecoration,
          x: tapX - 50,
          y: tapY - 20,
          scale: 1,
        };
        
        setTextOverlays([...textOverlays, newOverlay]);
        setSelectedOverlayId(newOverlay.id);
      }
    });
  };

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
          setSelectedOverlayId(overlayId);
          
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
          // Drag to move - use current position + delta for smooth movement
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

  const updateSelectedOverlay = (updates: Partial<TextOverlay>) => {
    if (!selectedOverlayId) return;
    setTextOverlays(prev =>
      prev.map(overlay =>
        overlay.id === selectedOverlayId ? { ...overlay, ...updates } : overlay
      )
    );
  };

  const handleDeleteOverlay = () => {
    if (selectedOverlayId) {
      setTextOverlays(prev => prev.filter(o => o.id !== selectedOverlayId));
      setSelectedOverlayId(null);
    }
  };

  const handleTextChange = (text: string) => {
    updateSelectedOverlay({ text });
  };

  const applyTextStyle = (styleId: string) => {
    switch (styleId) {
      case 'classic':
        updateSelectedOverlay({ fontWeight: 'normal', fontStyle: 'normal', size: 28 });
        break;
      case 'modern':
        updateSelectedOverlay({ fontWeight: 'bold', fontStyle: 'normal', size: 32 });
        break;
      case 'neon':
        updateSelectedOverlay({ color: '#00ffff', backgroundColor: '#000000', fontWeight: 'bold' });
        break;
      case 'typewriter':
        updateSelectedOverlay({ fontWeight: 'normal', size: 24 });
        break;
      case 'strong':
        updateSelectedOverlay({ fontWeight: 'bold', size: 42 });
        break;
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      let finalMediaUri = mediaUri;
      let finalMediaType = mediaType;

      // If it's a text story with gradient background, capture the gradient
      if (mediaType === 'text' || !mediaUri) {
        finalMediaUri = null;
        finalMediaType = 'text';
      }

      // Prepare story data
      const storyData: any = {
        mediaType: finalMediaType,
        backgroundColor: selectedGradient.colors.join(','),
        duration: 10,
        privacy: 'friends',
      };

      // Add caption from text overlays
      if (textOverlays.length > 0) {
        storyData.caption = textOverlays.map(t => t.text).join(' ');
      }

      // If we have an actual image/video, upload it first
      if (finalMediaUri && finalMediaType !== 'text') {
        // TODO: Connect to Firebase Storage backend
        console.log('TODO: Upload story media to Firebase Storage:', finalMediaUri);
        
        // Mock: Use local URI
        const mediaUrl = finalMediaUri;
        storyData.mediaUrl = mediaUrl;
      } else {
        // For text stories, use gradient info
        storyData.mediaUrl = selectedGradient.colors[0];
      }

      // TODO: Connect to Firebase backend
      console.log('TODO: Create story in Firebase:', storyData);

      setIsPublishing(false);
      Alert.alert(
        t('common.success'),
        t('story.storyPublished'),
        [{ text: t('common.ok'), onPress: () => navigation.navigate('StoryList') }]
      );
    } catch (error: any) {
      setIsPublishing(false);
      Alert.alert(
        t('common.error'),
        error.message || t('common.somethingWrong')
      );
    }
  };

  const getFilterOverlayStyle = () => {
    switch (selectedFilter) {
      case 'sepia':
        return { backgroundColor: 'rgba(112, 66, 20, 0.25)' };
      case 'cool':
        return { backgroundColor: 'rgba(33, 147, 176, 0.25)' };
      case 'warm':
        return { backgroundColor: 'rgba(237, 66, 100, 0.25)' };
      case 'grayscale':
        return { backgroundColor: 'rgba(0,0,0,0.25)' };
      default:
        return null;
    }
  };

  const selectedOverlay = textOverlays.find(o => o.id === selectedOverlayId);

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Story Header */}
      <StoryHeader
        title={t('story.editImage')}
        onBack={() => navigation.goBack()}
        onReset={() => {
          setTextOverlays([]);
          setSelectedOverlayId(null);
        }}
        onPublish={handlePublish}
        isPublishing={isPublishing}
        disabled={textOverlays.length === 0}
        isDark={true}
        theme={theme}
        t={t}
      />

      {/* Main Content Area */}
      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          ref={imageContainerRef}
          activeOpacity={1}
          onPress={handleScreenTap}
          style={styles.touchableArea}
        >
          {mediaType === 'image' && mediaUri ? (
            <Image source={{ uri: mediaUri }} style={styles.image} resizeMode="contain" />
          ) : (
            <LinearGradient
              colors={[...selectedGradient.colors]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBackground}
            />
          )}

          {/* Filter Overlay */}
          {selectedFilter && (
            <View style={[StyleSheet.absoluteFill, getFilterOverlayStyle()]} />
          )}

          {/* Text Overlays */}
          {textOverlays.map(overlay => {
            const panResponder = createPanResponder(overlay.id);
            const isSelected = selectedOverlayId === overlay.id;
            
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
                <View
                  style={[
                    styles.textContainer,
                    { backgroundColor: overlay.backgroundColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.overlayText,
                      {
                        color: overlay.color,
                        fontSize: overlay.size,
                        fontWeight: overlay.fontWeight,
                        fontStyle: overlay.fontStyle,
                        textAlign: overlay.textAlign,
                        textDecorationLine: overlay.textDecorationLine,
                      },
                    ]}
                  >
                    {overlay.text}
                  </Text>
                </View>
              </Animated.View>
            );
          })}

          {/* Hint */}
          {textOverlays.length === 0 && (
            <View style={styles.hintContainer}>
              <MaterialCommunityIcons name="cursor-pointer" size={50} color="rgba(255,255,255,0.6)" />
              <Text style={styles.hintText}>{t('story.tapScreenToAddText')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom Controls with SafeAreaView */}
      <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomControls}
        >
        {selectedOverlay && (
          <View style={styles.editingControls}>
            {/* Text Input */}
            <View style={styles.textInputRow}>
              <TextInput
                style={styles.inlineTextInput}
                value={selectedOverlay.text}
                onChangeText={handleTextChange}
                placeholder="Enter text..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                maxLength={100}
              />
              <TouchableOpacity
                style={styles.styleButton}
                onPress={() => setShowStyleModal(true)}
              >
                <MaterialCommunityIcons name="format-text" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Quick Style Controls */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickControls}>
              {/* Bold */}
              <TouchableOpacity
                style={[
                  styles.quickButton,
                  selectedOverlay.fontWeight === 'bold' && styles.quickButtonActive,
                ]}
                onPress={() => updateSelectedOverlay({
                  fontWeight: selectedOverlay.fontWeight === 'bold' ? 'normal' : 'bold'
                })}
              >
                <Text style={styles.quickButtonText}>B</Text>
              </TouchableOpacity>

              {/* Italic */}
              <TouchableOpacity
                style={[
                  styles.quickButton,
                  selectedOverlay.fontStyle === 'italic' && styles.quickButtonActive,
                ]}
                onPress={() => updateSelectedOverlay({
                  fontStyle: selectedOverlay.fontStyle === 'italic' ? 'normal' : 'italic'
                })}
              >
                <Text style={[styles.quickButtonText, { fontStyle: 'italic' }]}>I</Text>
              </TouchableOpacity>

              {/* Underline */}
              <TouchableOpacity
                style={[
                  styles.quickButton,
                  selectedOverlay.textDecorationLine === 'underline' && styles.quickButtonActive,
                ]}
                onPress={() => updateSelectedOverlay({
                  textDecorationLine: selectedOverlay.textDecorationLine === 'underline' ? 'none' : 'underline'
                })}
              >
                <Text style={[styles.quickButtonText, { textDecorationLine: 'underline' }]}>U</Text>
              </TouchableOpacity>

              {/* Align Left */}
              <TouchableOpacity
                style={[
                  styles.quickButton,
                  selectedOverlay.textAlign === 'left' && styles.quickButtonActive,
                ]}
                onPress={() => updateSelectedOverlay({ textAlign: 'left' })}
              >
                <Ionicons name="text-outline" size={20} color="#fff" />
              </TouchableOpacity>

              {/* Align Center */}
              <TouchableOpacity
                style={[
                  styles.quickButton,
                  selectedOverlay.textAlign === 'center' && styles.quickButtonActive,
                ]}
                onPress={() => updateSelectedOverlay({ textAlign: 'center' })}
              >
                <MaterialCommunityIcons name="format-align-center" size={20} color="#fff" />
              </TouchableOpacity>

              {/* Align Right */}
              <TouchableOpacity
                style={[
                  styles.quickButton,
                  selectedOverlay.textAlign === 'right' && styles.quickButtonActive,
                ]}
                onPress={() => updateSelectedOverlay({ textAlign: 'right' })}
              >
                <MaterialCommunityIcons name="format-align-right" size={20} color="#fff" />
              </TouchableOpacity>

              {/* Size - */}
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => updateSelectedOverlay({ size: Math.max(16, selectedOverlay.size - 4) })}
              >
                <MaterialCommunityIcons name="format-font-size-decrease" size={20} color="#fff" />
              </TouchableOpacity>

              {/* Size + */}
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => updateSelectedOverlay({ size: Math.min(72, selectedOverlay.size + 4) })}
              >
                <MaterialCommunityIcons name="format-font-size-increase" size={20} color="#fff" />
              </TouchableOpacity>

              {/* Delete */}
              <TouchableOpacity
                style={[styles.quickButton, styles.deleteButton]}
                onPress={handleDeleteOverlay}
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </ScrollView>

            {/* Color Pickers */}
            <View style={styles.colorRow}>
              <Text style={styles.colorLabel}>Text:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
                {TEXT_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => updateSelectedOverlay({ color })}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedOverlay.color === color && styles.colorOptionSelected,
                    ]}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.colorRow}>
              <Text style={styles.colorLabel}>BG:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
                {BG_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => updateSelectedOverlay({ backgroundColor: color })}
                    style={[
                      styles.colorOption,
                      { 
                        backgroundColor: color === 'transparent' ? '#333' : color,
                        borderWidth: color === 'transparent' ? 2 : 0,
                        borderColor: '#666',
                      },
                      selectedOverlay.backgroundColor === color && styles.colorOptionSelected,
                    ]}
                  >
                    {color === 'transparent' && (
                      <Ionicons name="close" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {mediaType === 'text' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowStyleModal(true)}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.actionButtonGradient}
              >
                <MaterialCommunityIcons name="palette" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionButtonLabel}>{t('story.background')}</Text>
            </TouchableOpacity>
          )}

          {mediaType === 'image' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowStyleModal(true)}
            >
              <LinearGradient
                colors={['#FF6B9D', '#FF8FAB']}
                style={styles.actionButtonGradient}
              >
                <MaterialCommunityIcons name="image-filter-hdr" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionButtonLabel}>{t('story.filter')}</Text>
            </TouchableOpacity>
          )}

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
      </SafeAreaView>

      {/* Style Modal */}
      <Modal
        visible={showStyleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStyleModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStyleModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {mediaType === 'image' ? t('story.filter') : t('story.background')}
                </Text>
                <TouchableOpacity onPress={() => setShowStyleModal(false)}>
                  <Ionicons name="close" size={28} color={theme.text} />
                </TouchableOpacity>
              </View>

              {mediaType === 'text' ? (
                <ScrollView style={styles.modalScroll}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Gradient Backgrounds
                  </Text>
                  <View style={styles.gradientGrid}>
                    {GRADIENT_BACKGROUNDS.map((grad, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setSelectedGradient(grad);
                          setShowStyleModal(false);
                        }}
                        style={styles.gradientCard}
                      >
                        <LinearGradient
                          colors={[...grad.colors]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.gradientPreview}
                        >
                          <MaterialCommunityIcons
                            name={grad.icon as any}
                            size={32}
                            color="rgba(255,255,255,0.9)"
                          />
                        </LinearGradient>
                        <Text style={[styles.gradientName, { color: theme.text }]}>
                          {grad.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              ) : (
                <ScrollView style={styles.modalScroll}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Image Filters
                  </Text>
                  <View style={styles.filterGrid}>
                    {FILTERS.map((filter, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setSelectedFilter(filter.value);
                          setShowStyleModal(false);
                        }}
                        style={[
                          styles.filterCard,
                          { backgroundColor: theme.background },
                          selectedFilter === filter.value && styles.filterCardSelected,
                        ]}
                      >
                        <FontAwesome5 name={filter.icon as any} size={28} color={theme.text} />
                        <Text style={[styles.filterName, { color: theme.text }]}>
                          {filter.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
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
  safeArea: {
    flex: 1,
  },
  bottomSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  },
  imageContainer: {
    flex: 1,
  },
  touchableArea: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
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
  textContainer: {
    padding: 8,
    borderRadius: 4,
  },
  overlayText: {
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
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
  bottomControls: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  editingControls: {
    marginBottom: 16,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  inlineTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    maxHeight: 100,
  },
  styleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickControls: {
    marginBottom: 12,
  },
  quickButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  quickButtonActive: {
    backgroundColor: '#0084FF',
  },
  quickButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginRight: 10,
    width: 40,
  },
  colorPicker: {
    flex: 1,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderColor: '#fff',
    transform: [{ scale: 1.15 }],
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
    maxHeight: height * 0.75,
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
  modalScroll: {
    maxHeight: height * 0.6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  gradientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gradientCard: {
    width: (width - 52) / 3,
    alignItems: 'center',
  },
  gradientPreview: {
    width: '100%',
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gradientName: {
    fontSize: 12,
    textAlign: 'center',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterCard: {
    width: (width - 52) / 3,
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterCardSelected: {
    borderColor: '#0084FF',
  },
  filterName: {
    fontSize: 12,
    marginTop: 8,
  },
});
