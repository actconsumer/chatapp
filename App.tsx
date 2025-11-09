import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { PrivacyProvider } from './src/context/PrivacyContext';
import RootNavigator from './src/navigation';
import { initI18n } from './src/i18n';
import './src/i18n';
import './src/polyfills/webrtc';

export default function App() {
  const [i18nInitialized, setI18nInitialized] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nInitialized(true));
  }, []);

  if (!i18nInitialized) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <PrivacyProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </PrivacyProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
