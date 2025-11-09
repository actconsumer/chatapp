import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface StoryHeaderProps {
  title: string;
  onBack: () => void;
  onReset: () => void;
  onPublish: () => void;
  isPublishing: boolean;
  disabled?: boolean;
  isDark: boolean;
  theme: { text: string; primary: string } & Record<string, any>;
  t: (key: string) => string;
}

export const StoryHeader: React.FC<StoryHeaderProps> = ({
  title,
  onBack,
  onReset,
  onPublish,
  isPublishing,
  disabled,
  isDark,
  theme,
  t,
}) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={isDark 
          ? ['rgba(18,18,18,0.95)', 'rgba(18,18,18,0.85)', 'rgba(18,18,18,0.4)', 'transparent'] 
          : ['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.92)', 'rgba(255,255,255,0.7)', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[
              styles.headerButton,
              { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                shadowColor: isDark ? '#fff' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.1 : 0.05,
                shadowRadius: 4,
                elevation: 2,
              }
            ]}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={[
              styles.headerTitle, 
              { 
                color: isDark ? '#fff' : '#000',
                textShadowColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }
            ]}>
              {title}
            </Text>
          </View>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.headerButton,
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                  shadowColor: isDark ? '#fff' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.1 : 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                  opacity: disabled ? 0.4 : 1,
                }
              ]}
              onPress={onReset}
              accessibilityRole="button"
              accessibilityLabel={t('common.reset')}
              disabled={disabled}
            >
              <Ionicons name="trash-outline" size={20} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.publishButton,
                { 
                  opacity: isPublishing || disabled ? 0.6 : 1,
                }
              ]}
              onPress={onPublish}
              accessibilityRole="button"
              accessibilityLabel={t('story.publishStory')}
              disabled={isPublishing || disabled}
            >
              <LinearGradient
                colors={['#0084FF', '#00A8FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.publishButtonGradient}
              >
                {isPublishing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  publishButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default StoryHeader;
