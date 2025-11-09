import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { COLORS } from '../utils/constants';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: typeof COLORS.light;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');

  const getIsDark = () => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  };

  const isDark = getIsDark();
  const theme = isDark ? COLORS.dark : COLORS.light;

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
