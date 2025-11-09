import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { SIZES } from '../../utils/constants';
import { changeLanguage, getCurrentLanguage } from '../../i18n';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  available: boolean;
}

interface LanguageScreenProps {
  navigation: any;
}

export default function LanguageScreen({ navigation }: LanguageScreenProps) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(getCurrentLanguage());
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // Update selected language when i18n language changes
    setSelectedLanguage(i18n.language);
  }, [i18n.language]);

  const languages: Language[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      available: true,
    },
    {
      code: 'ne',
      name: 'नेपाली',
      nativeName: 'नेपाली',
      available: true,
    },
  ];

  const selectLanguage = async (code: string) => {
    const language = languages.find((l) => l.code === code);
    if (language?.available && code !== selectedLanguage) {
      setIsChanging(true);
      try {
        await changeLanguage(code);
        setSelectedLanguage(code);
        
        // Show success message
        setTimeout(() => {
          Alert.alert(
            code === 'en' ? 'Language Changed' : 'भाषा परिवर्तन गरियो',
            code === 'en' 
              ? 'Language has been changed to English' 
              : 'भाषा नेपालीमा परिवर्तन गरियो',
            [{ text: code === 'en' ? 'OK' : 'ठीक छ' }]
          );
        }, 100);
      } catch (error) {
        console.error('Error changing language:', error);
        Alert.alert('Error', 'Failed to change language');
      } finally {
        setIsChanging(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('profile.language')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {t('profile.selectLanguage')}
          </Text>

          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageCard,
                {
                  backgroundColor: theme.card,
                  borderColor: selectedLanguage === language.code ? theme.primary : theme.border,
                  borderWidth: selectedLanguage === language.code ? 2 : 1,
                },
                !language.available && { opacity: 0.6 },
              ]}
              onPress={() => selectLanguage(language.code)}
              disabled={!language.available || isChanging}
            >
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, { color: theme.text }]}>
                  {language.name}
                </Text>
                <Text style={[styles.languageNative, { color: theme.textSecondary }]}>
                  {language.nativeName}
                </Text>
                {!language.available && (
                  <View style={[styles.comingSoonBadge, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.comingSoonText, { color: theme.primary }]}>
                      Coming Soon
                    </Text>
                  </View>
                )}
              </View>
              {selectedLanguage === language.code && language.available && (
                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}

          <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="information-circle" size={24} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              {selectedLanguage === 'en' 
                ? 'The selected language will be saved and applied across the entire app immediately.' 
                : 'चयन गरिएको भाषा सुरक्षित गरिनेछ र तुरुन्तै सम्पूर्ण एपमा लागू हुनेछ।'}
            </Text>
          </View>
        </View>
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
    paddingHorizontal: SIZES.padding,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SIZES.padding,
  },
  description: {
    fontSize: SIZES.body,
    marginBottom: 24,
    lineHeight: 22,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  languageNative: {
    fontSize: SIZES.body,
    marginBottom: 8,
  },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  comingSoonText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.small,
    lineHeight: 20,
  },
});
