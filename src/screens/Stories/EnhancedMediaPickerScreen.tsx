import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
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

interface EnhancedMediaPickerScreenProps {
  navigation: any;
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
  { name: 'Fire', colors: ['#f85032', '#e73827'], icon: 'fire' },
  { name: 'Ice', colors: ['#00d2ff', '#3a7bd5'], icon: 'snowflake' },
];

export default function EnhancedMediaPickerScreen({ navigation }: EnhancedMediaPickerScreenProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [selectedGradient, setSelectedGradient] = useState<GradientOption>(GRADIENT_BACKGROUNDS[0]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.permissionRequired'),
        t('story.photoPermission')
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled) {
      navigation.navigate('EnhancedImageEditor', {
        mediaUri: result.assets[0].uri,
        mediaType: 'image',
      });
    }
  };

  const handleVideoPicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.permissionRequired'),
        t('story.photoPermission')
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
      videoMaxDuration: 60,
    });

    if (!result.canceled) {
      navigation.navigate('EnhancedVideoEditor', {
        mediaUri: result.assets[0].uri,
        mediaType: 'video',
      });
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.permissionRequired'),
        t('story.cameraPermission')
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled) {
      navigation.navigate('EnhancedImageEditor', {
        mediaUri: result.assets[0].uri,
        mediaType: 'image',
      });
    }
  };

  const handleVideoCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.permissionRequired'),
        t('story.cameraPermission')
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
      videoMaxDuration: 60,
    });

    if (!result.canceled) {
      navigation.navigate('EnhancedVideoEditor', {
        mediaUri: result.assets[0].uri,
        mediaType: 'video',
      });
    }
  };

  const handleTextStory = () => {
    navigation.navigate('EnhancedImageEditor', {
      mediaUri: null,
      mediaType: 'text',
      gradient: selectedGradient,
    });
  };

  const handleGradientSelect = (gradient: GradientOption) => {
    setSelectedGradient(gradient);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Story Header */}
      <StoryHeader
        title={t('story.createStory')}
        onBack={() => navigation.goBack()}
        onReset={() => setSelectedGradient(GRADIENT_BACKGROUNDS[0])}
        onPublish={handleTextStory}
        isPublishing={false}
        disabled={false}
        isDark={isDark}
        theme={theme}
        t={t}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview Card with Gradient */}
        <Animated.View
          style={[
            styles.previewCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[...selectedGradient.colors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientPreview}
          >
            <View style={styles.previewIconContainer}>
              <MaterialCommunityIcons
                name={selectedGradient.icon as any}
                size={70}
                color="rgba(255,255,255,0.4)"
              />
            </View>
            <Text style={styles.previewText}>{t('story.tapScreenToAddText')}</Text>
            <Text style={styles.previewSubtext}>{t('story.createTextStory')}</Text>
          </LinearGradient>

          <TouchableOpacity
            style={styles.createTextButton}
            onPress={handleTextStory}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#0084FF', '#00C6FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createTextGradient}
            >
              <Ionicons name="text" size={22} color="#fff" />
              <Text style={styles.createTextButtonText}>{t('story.createTextStory')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Gradient Selector */}
        <Animated.View 
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('story.chooseBackground')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gradientList}
          >
            {GRADIENT_BACKGROUNDS.map((gradient, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleGradientSelect(gradient)}
                activeOpacity={0.8}
                style={styles.gradientWrapper}
              >
                <LinearGradient
                  colors={[...gradient.colors]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.gradientOption,
                    selectedGradient.name === gradient.name && styles.gradientOptionSelected,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={gradient.icon as any}
                    size={28}
                    color="rgba(255,255,255,0.95)"
                  />
                </LinearGradient>
                {selectedGradient.name === gradient.name && (
                  <View style={[styles.gradientCheckmark, { backgroundColor: theme.primary }]}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Media Options */}
        <Animated.View 
          style={[
            styles.section,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('story.orChooseMedia')}
          </Text>
          
          <View style={styles.optionsGrid}>
            {/* Image from Gallery */}
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.surface }]}
              onPress={handleImagePicker}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B9D', '#FF8FAB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionIconContainer}
              >
                <Ionicons name="images" size={32} color="#fff" />
              </LinearGradient>
              <Text style={[styles.optionTitle, { color: theme.text }]}>
                {t('story.gallery')}
              </Text>
              <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                {t('story.fromGallery')}
              </Text>
            </TouchableOpacity>

            {/* Video from Gallery */}
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.surface }]}
              onPress={handleVideoPicker}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00C6FF', '#0084FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionIconContainer}
              >
                <Ionicons name="videocam" size={32} color="#fff" />
              </LinearGradient>
              <Text style={[styles.optionTitle, { color: theme.text }]}>
                {t('story.video')}
              </Text>
              <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                {t('story.videoGallery')}
              </Text>
            </TouchableOpacity>

            {/* Camera */}
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.surface }]}
              onPress={handleCamera}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFD93D', '#FFA726']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionIconContainer}
              >
                <Ionicons name="camera" size={32} color="#fff" />
              </LinearGradient>
              <Text style={[styles.optionTitle, { color: theme.text }]}>
                {t('story.camera')}
              </Text>
              <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                {t('story.takePhotoCamera')}
              </Text>
            </TouchableOpacity>

            {/* Video Camera */}
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.surface }]}
              onPress={handleVideoCamera}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6BCB77', '#4CAF50']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionIconContainer}
              >
                <MaterialCommunityIcons name="video-plus" size={32} color="#fff" />
              </LinearGradient>
              <Text style={[styles.optionTitle, { color: theme.text }]}>
                {t('story.recordVideo')}
              </Text>
              <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                {t('story.recordVideoCamera')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  previewCard: {
    marginBottom: 28,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientPreview: {
    height: 340,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  previewIconContainer: {
    marginBottom: 20,
  },
  previewText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  previewSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 8,
    textAlign: 'center',
  },
  createTextButton: {
    overflow: 'hidden',
  },
  createTextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  createTextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: '700',
    marginBottom: 16,
  },
  gradientList: {
    paddingVertical: 8,
    gap: 14,
  },
  gradientWrapper: {
    position: 'relative',
  },
  gradientOption: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  gradientOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    transform: [{ scale: 1.05 }],
  },
  gradientCheckmark: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  optionCard: {
    width: (width - 44) / 2,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  optionSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
