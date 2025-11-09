import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Try to import react-native-localize with fallback
let Localization: any = null;
try {
  Localization = require('react-native-localize');
} catch (error) {
  console.warn('react-native-localize not available, using fallback');
}

import en from './locales/en.json';
import ne from './locales/ne.json';

const LANGUAGE_KEY = '@language';

const resources = {
  en: { translation: en },
  ne: { translation: ne },
};

const getDeviceLanguage = () => {
  if (!Localization) {
    return 'en'; // Fallback to English if module not available
  }
  
  try {
    const locales = Localization.getLocales();
    const deviceLanguage = locales[0]?.languageCode || 'en';
    
    // Map device language to supported languages
    if (deviceLanguage.startsWith('ne')) {
      return 'ne';
    }
    return 'en';
  } catch (error) {
    console.warn('Error getting device language:', error);
    return 'en';
  }
};

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  
  if (!savedLanguage) {
    savedLanguage = getDeviceLanguage();
  }

  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4',
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return i18n;
};

export const changeLanguage = async (language: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
  i18n.changeLanguage(language);
};

export const getCurrentLanguage = () => i18n.language;

export { initI18n };
export default i18n;
