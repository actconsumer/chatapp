import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CustomWallpaperScreenProps {
  route: any;
  navigation: any;
}

interface ColorConfig {
  // Background
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundColor: string;
  gradientColor1: string;
  gradientColor2: string;
  backgroundImage: string | null;
  
  // Message Bubbles
  senderBubbleColor: string;
  receiverBubbleColor: string;
  senderTextColor: string;
  receiverTextColor: string;
  
  // Bubble Borders
  senderBorderColor: string;
  receiverBorderColor: string;
  senderBorderWidth: number;
  receiverBorderWidth: number;
  
  // Date Separator
  dateTextColor: string;
  dateBackgroundColor: string;
  
  // Header
  headerBackgroundColor: string;
  headerTextColor: string;
  headerIconColor: string;
  
  // Input Bar
  inputBackgroundColor: string;
  inputTextColor: string;
  inputBorderColor: string;
  inputPlaceholderColor: string;
  
  // Icons & Buttons
  sendButtonColor1: string;
  sendButtonColor2: string;
  attachButtonColor: string;
  emojiButtonColor: string;
  
  // Quick Reaction
  quickReactionEmoji: string;
}

const PRESET_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFA726', '#FFD700', '#66BB6A',
  '#4CAF50', '#26C6DA', '#42A5F5', '#5C6BC0', '#7E57C2',
  '#AB47BC', '#EC407A', '#EF5350', '#8D6E63', '#78909C',
  '#FFFFFF', '#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E',
  '#757575', '#616161', '#424242', '#212121', '#000000',
];

export default function CustomWallpaperScreen({ route, navigation }: CustomWallpaperScreenProps) {
  const { theme, isDark } = useTheme();
  const { chatId, currentConfig } = route.params;

  // Convert WallpaperConfig to ColorConfig if needed
  const getInitialConfig = (): ColorConfig => {
    if (currentConfig) {
      // If currentConfig is a WallpaperConfig, convert it
      const hasGradient = currentConfig.gradient && currentConfig.gradient.length === 2;
      return {
        backgroundType: currentConfig.backgroundImage ? 'image' : hasGradient ? 'gradient' : 'solid',
        backgroundColor: currentConfig.customBackground || '#FFFFFF',
        gradientColor1: hasGradient ? currentConfig.gradient[0] : '#667EEA',
        gradientColor2: hasGradient ? currentConfig.gradient[1] : '#764BA2',
        backgroundImage: currentConfig.backgroundImage || null,
        
        senderBubbleColor: currentConfig.senderBubbleColor || '#667EEA',
        receiverBubbleColor: currentConfig.receiverBubbleColor || '#E4E6EB',
        senderTextColor: currentConfig.senderTextColor || '#FFFFFF',
        receiverTextColor: currentConfig.receiverTextColor || '#050505',
        
        senderBorderColor: 'transparent',
        receiverBorderColor: 'transparent',
        senderBorderWidth: 0,
        receiverBorderWidth: 0,
        
        dateTextColor: currentConfig.dateTextColor || '#65676B',
        dateBackgroundColor: 'rgba(0, 0, 0, 0.05)',
        
        headerBackgroundColor: currentConfig.headerColor || '#667EEA',
        headerTextColor: '#FFFFFF',
        headerIconColor: '#FFFFFF',
        
        inputBackgroundColor: currentConfig.inputBarColor || '#F0F2F5',
        inputTextColor: '#050505',
        inputBorderColor: '#E4E6EB',
        inputPlaceholderColor: '#65676B',
        
        sendButtonColor1: '#667EEA',
        sendButtonColor2: '#764BA2',
        attachButtonColor: '#667EEA',
        emojiButtonColor: '#65676B',
        
        quickReactionEmoji: currentConfig.defaultEmoji || '👍',
      };
    }
    
    // Default config
    return {
      backgroundType: 'gradient',
      backgroundColor: '#FFFFFF',
      gradientColor1: '#667EEA',
      gradientColor2: '#764BA2',
      backgroundImage: null,
      
      senderBubbleColor: '#667EEA',
      receiverBubbleColor: '#E4E6EB',
      senderTextColor: '#FFFFFF',
      receiverTextColor: '#050505',
      
      senderBorderColor: 'transparent',
      receiverBorderColor: 'transparent',
      senderBorderWidth: 0,
      receiverBorderWidth: 0,
      
      dateTextColor: '#65676B',
      dateBackgroundColor: 'rgba(0, 0, 0, 0.05)',
      
      headerBackgroundColor: '#667EEA',
      headerTextColor: '#FFFFFF',
      headerIconColor: '#FFFFFF',
      
      inputBackgroundColor: '#F0F2F5',
      inputTextColor: '#050505',
      inputBorderColor: '#E4E6EB',
      inputPlaceholderColor: '#65676B',
      
      sendButtonColor1: '#667EEA',
      sendButtonColor2: '#764BA2',
      attachButtonColor: '#667EEA',
      emojiButtonColor: '#65676B',
      
      quickReactionEmoji: '👍',
    };
  };

  const [config, setConfig] = useState<ColorConfig>(getInitialConfig());

  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

  const updateColor = (key: keyof ColorConfig, color: string) => {
    setConfig(prev => ({ ...prev, [key]: color }));
  };

  const pickBackgroundImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library permission');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setConfig(prev => ({
          ...prev,
          backgroundImage: result.assets[0].uri,
          backgroundType: 'image',
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const saveCustomWallpaper = async () => {
    try {
      // Transform config to WallpaperConfig format
      const wallpaperConfig: any = {
        id: 'custom',
        name: 'My Custom Theme',
        defaultEmoji: config.quickReactionEmoji,
        customBackground: config.backgroundColor,
        senderBubbleColor: config.senderBubbleColor,
        receiverBubbleColor: config.receiverBubbleColor,
        senderTextColor: config.senderTextColor,
        receiverTextColor: config.receiverTextColor,
        dateTextColor: config.dateTextColor,
        headerColor: config.headerBackgroundColor,
        inputBarColor: config.inputBackgroundColor,
        useGradientForSender: false,
      };

      // Add gradient or image if applicable
      if (config.backgroundType === 'gradient') {
        wallpaperConfig.gradient = [
          config.gradientColor1 || '#667EEA',
          config.gradientColor2 || '#764BA2'
        ];
      } else if (config.backgroundType === 'image' && config.backgroundImage) {
        wallpaperConfig.backgroundImage = config.backgroundImage;
      }
      
      await AsyncStorage.setItem('@custom_wallpaper', JSON.stringify(wallpaperConfig));
      
      Alert.alert('Success', 'Custom theme saved!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
            if (route.params?.onSave) {
              route.params.onSave(wallpaperConfig);
            }
          }
        }
      ]);
    } catch (error) {
      console.error('Error saving custom theme:', error);
      Alert.alert('Error', 'Failed to save custom theme');
    }
  };

  const renderPreview = () => {
    // Ensure gradient colors are valid strings
    const gradientColor1 = config.gradientColor1 || '#667EEA';
    const gradientColor2 = config.gradientColor2 || '#764BA2';
    const sendButtonColor1 = config.sendButtonColor1 || '#667EEA';
    const sendButtonColor2 = config.sendButtonColor2 || '#764BA2';

    return (
      <View style={styles.previewSection}>
        <Text style={[styles.previewTitle, { color: theme.text }]}>Preview</Text>
        
        <View style={styles.previewContainer}>
          {/* Background Preview */}
          {config.backgroundType === 'image' && config.backgroundImage ? (
            <Image source={{ uri: config.backgroundImage }} style={styles.previewBackground} />
          ) : config.backgroundType === 'gradient' ? (
            <LinearGradient
              colors={[gradientColor1, gradientColor2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewBackground}
            />
          ) : (
            <View style={[styles.previewBackground, { backgroundColor: config.backgroundColor }]} />
          )}
          
          {/* Header Preview */}
          <View style={[styles.previewHeader, { backgroundColor: config.headerBackgroundColor }]}>
            <Ionicons name="arrow-back" size={20} color={config.headerIconColor} />
            <Text style={[styles.previewHeaderText, { color: config.headerTextColor }]}>Chat</Text>
            <Ionicons name="call" size={20} color={config.headerIconColor} />
          </View>
          
          {/* Messages Preview */}
          <View style={styles.previewMessages}>
            {/* Receiver Bubble */}
            <View style={styles.receiverBubbleContainer}>
              <View style={[
                styles.previewBubble,
                {
                  backgroundColor: config.receiverBubbleColor,
                  borderColor: config.receiverBorderColor,
                  borderWidth: config.receiverBorderWidth,
                  alignSelf: 'flex-start',
                }
              ]}>
                <Text style={[styles.previewBubbleText, { color: config.receiverTextColor }]}>
                  Hey there!
                </Text>
              </View>
            </View>
            
            {/* Sender Bubble */}
            <View style={styles.senderBubbleContainer}>
              <View style={[
                styles.previewBubble,
                {
                  backgroundColor: config.senderBubbleColor,
                  borderColor: config.senderBorderColor,
                  borderWidth: config.senderBorderWidth,
                  alignSelf: 'flex-end',
                }
              ]}>
                <Text style={[styles.previewBubbleText, { color: config.senderTextColor }]}>
                  Hi! How are you?
                </Text>
              </View>
            </View>
            
            {/* Date Separator */}
            <View style={styles.dateContainer}>
              <View style={[styles.dateBadge, { backgroundColor: config.dateBackgroundColor }]}>
                <Text style={[styles.dateText, { color: config.dateTextColor }]}>Today</Text>
              </View>
            </View>
          </View>
          
          {/* Input Bar Preview */}
          <View style={[styles.previewInput, { backgroundColor: config.inputBackgroundColor, borderColor: config.inputBorderColor }]}>
            <Text style={[styles.previewInputText, { color: config.inputPlaceholderColor }]}>
              Type a message...
            </Text>
            <LinearGradient
              colors={[sendButtonColor1, sendButtonColor2]}
              style={styles.previewSendButton}
            >
              <Ionicons name="send" size={12} color="#fff" />
            </LinearGradient>
          </View>
        </View>
      </View>
    );
  };

  const renderColorPicker = (
    label: string,
    colorKey: keyof ColorConfig,
    description?: string
  ) => {
    const currentColor = config[colorKey] as string;
    const isActive = activeColorPicker === colorKey;

    return (
      <View style={styles.colorPickerSection}>
        <TouchableOpacity
          style={styles.colorPickerHeader}
          onPress={() => setActiveColorPicker(isActive ? null : colorKey)}
        >
          <View style={styles.colorPickerInfo}>
            <Text style={[styles.colorLabel, { color: theme.text }]}>{label}</Text>
            {description && (
              <Text style={[styles.colorDescription, { color: theme.textSecondary }]}>
                {description}
              </Text>
            )}
          </View>
          <View style={styles.colorPreviewContainer}>
            <View style={[styles.colorPreview, { backgroundColor: currentColor }]} />
            <Ionicons
              name={isActive ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {isActive && (
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  currentColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => updateColor(colorKey, color)}
              >
                {currentColor === color && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
            
            {/* Custom color input */}
            <View style={styles.customColorInput}>
              <TextInput
                style={[styles.colorInput, { color: theme.text, borderColor: theme.border }]}
                value={currentColor}
                onChangeText={(text) => updateColor(colorKey, text)}
                placeholder="#000000"
                placeholderTextColor={theme.placeholder}
                maxLength={7}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderBorderWidthPicker = (
    label: string,
    widthKey: keyof ColorConfig
  ) => {
    const currentWidth = config[widthKey] as number;

    return (
      <View style={styles.borderWidthSection}>
        <Text style={[styles.colorLabel, { color: theme.text }]}>{label}</Text>
        <View style={styles.borderWidthControls}>
          <TouchableOpacity
            style={[styles.borderButton, { borderColor: theme.border }]}
            onPress={() => updateColor(widthKey, Math.max(0, currentWidth - 1) as any)}
          >
            <Ionicons name="remove" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.borderWidthValue, { color: theme.text }]}>
            {currentWidth}px
          </Text>
          <TouchableOpacity
            style={[styles.borderButton, { borderColor: theme.border }]}
            onPress={() => updateColor(widthKey, Math.min(5, currentWidth + 1) as any)}
          >
            <Ionicons name="add" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <LinearGradient
        colors={theme.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Custom Wallpaper</Text>
        <TouchableOpacity onPress={saveCustomWallpaper} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Live Preview */}
        {renderPreview()}

        {/* Background Type */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Background</Text>
          
          <View style={styles.backgroundTypeContainer}>
            <TouchableOpacity
              style={[
                styles.backgroundTypeButton,
                { borderColor: theme.border },
                config.backgroundType === 'solid' && { backgroundColor: theme.primary + '20', borderColor: theme.primary },
              ]}
              onPress={() => setConfig(prev => ({ ...prev, backgroundType: 'solid' }))}
            >
              <Ionicons
                name="color-fill"
                size={24}
                color={config.backgroundType === 'solid' ? theme.primary : theme.textSecondary}
              />
              <Text style={[styles.backgroundTypeText, { color: theme.text }]}>Solid</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.backgroundTypeButton,
                { borderColor: theme.border },
                config.backgroundType === 'gradient' && { backgroundColor: theme.primary + '20', borderColor: theme.primary },
              ]}
              onPress={() => setConfig(prev => ({ ...prev, backgroundType: 'gradient' }))}
            >
              <Ionicons
                name="color-palette"
                size={24}
                color={config.backgroundType === 'gradient' ? theme.primary : theme.textSecondary}
              />
              <Text style={[styles.backgroundTypeText, { color: theme.text }]}>Gradient</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.backgroundTypeButton,
                { borderColor: theme.border },
                config.backgroundType === 'image' && { backgroundColor: theme.primary + '20', borderColor: theme.primary },
              ]}
              onPress={pickBackgroundImage}
            >
              <Ionicons
                name="image"
                size={24}
                color={config.backgroundType === 'image' ? theme.primary : theme.textSecondary}
              />
              <Text style={[styles.backgroundTypeText, { color: theme.text }]}>Image</Text>
            </TouchableOpacity>
          </View>

          {config.backgroundType === 'solid' && renderColorPicker('Background Color', 'backgroundColor')}
          {config.backgroundType === 'gradient' && (
            <>
              {renderColorPicker('Gradient Start', 'gradientColor1')}
              {renderColorPicker('Gradient End', 'gradientColor2')}
            </>
          )}
          {config.backgroundType === 'image' && config.backgroundImage && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: config.backgroundImage }} style={styles.backgroundImagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setConfig(prev => ({ ...prev, backgroundImage: null, backgroundType: 'gradient' }))}
              >
                <Ionicons name="close-circle" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Message Bubbles */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Message Bubbles</Text>
          {renderColorPicker('Sender Bubble', 'senderBubbleColor', 'Your message background')}
          {renderColorPicker('Receiver Bubble', 'receiverBubbleColor', 'Their message background')}
          {renderColorPicker('Sender Text', 'senderTextColor', 'Your message text')}
          {renderColorPicker('Receiver Text', 'receiverTextColor', 'Their message text')}
        </View>

        {/* Bubble Borders */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Bubble Borders</Text>
          {renderColorPicker('Sender Border', 'senderBorderColor')}
          {renderBorderWidthPicker('Sender Border Width', 'senderBorderWidth')}
          {renderColorPicker('Receiver Border', 'receiverBorderColor')}
          {renderBorderWidthPicker('Receiver Border Width', 'receiverBorderWidth')}
        </View>

        {/* Date Separator */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Date Separator</Text>
          {renderColorPicker('Date Text', 'dateTextColor')}
          {renderColorPicker('Date Background', 'dateBackgroundColor')}
        </View>

        {/* Header */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Chat Header</Text>
          {renderColorPicker('Header Background', 'headerBackgroundColor')}
          {renderColorPicker('Header Text', 'headerTextColor')}
          {renderColorPicker('Header Icons', 'headerIconColor')}
        </View>

        {/* Input Bar */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Input Bar</Text>
          {renderColorPicker('Input Background', 'inputBackgroundColor')}
          {renderColorPicker('Input Text', 'inputTextColor')}
          {renderColorPicker('Input Border', 'inputBorderColor')}
          {renderColorPicker('Placeholder Text', 'inputPlaceholderColor')}
        </View>

        {/* Icons & Buttons */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Icons & Buttons</Text>
          {renderColorPicker('Send Button Start', 'sendButtonColor1')}
          {renderColorPicker('Send Button End', 'sendButtonColor2')}
          {renderColorPicker('Attach Button', 'attachButtonColor')}
          {renderColorPicker('Emoji Button', 'emojiButtonColor')}
        </View>

        {/* Quick Reaction */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Reaction</Text>
          <View style={styles.emojiInputContainer}>
            <Text style={[styles.colorLabel, { color: theme.text }]}>Default Emoji</Text>
            <TextInput
              style={[styles.emojiInput, { color: theme.text, borderColor: theme.border }]}
              value={config.quickReactionEmoji}
              onChangeText={(text) => setConfig(prev => ({ ...prev, quickReactionEmoji: text }))}
              placeholder="👍"
              maxLength={2}
            />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  backgroundTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  backgroundTypeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
  },
  backgroundTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorPickerSection: {
    marginBottom: 12,
  },
  colorPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  colorPickerInfo: {
    flex: 1,
  },
  colorLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  colorDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  colorPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  colorOptionSelected: {
    borderColor: '#000',
    borderWidth: 3,
  },
  customColorInput: {
    width: '100%',
    marginTop: 8,
  },
  colorInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  borderWidthSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  borderWidthControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  borderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  borderWidthValue: {
    fontSize: 15,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  imagePreview: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  emojiInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emojiInput: {
    fontSize: 32,
    textAlign: 'center',
    width: 60,
    height: 60,
    borderWidth: 1,
    borderRadius: 12,
  },
  bottomSpacer: {
    height: 24,
  },
  // Preview styles
  previewSection: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  previewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  previewBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  previewHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewMessages: {
    padding: 12,
    minHeight: 120,
  },
  receiverBubbleContainer: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  senderBubbleContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  previewBubble: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: '70%',
  },
  previewBubbleText: {
    fontSize: 11,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  dateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 9,
    fontWeight: '600',
  },
  previewInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    gap: 6,
  },
  previewInputText: {
    flex: 1,
    fontSize: 11,
  },
  previewSendButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
