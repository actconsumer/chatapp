// Theme colors inspired by Meta Messenger
export const COLORS = {
  light: {
    primary: '#0084FF',
    secondary: '#00C6FF',
    gradient: ['#0084FF', '#00C6FF'] as const,
    background: '#FFFFFF',
    surface: '#F0F2F5',
    card: '#FFFFFF',
    text: '#050505',
    textSecondary: '#65676B',
    border: '#E4E6EB',
    error: '#F02849',
    success: '#00A400',
    inputBackground: '#F0F2F5',
    placeholder: '#8A8D91',
    shadow: '#000000',
  },
  dark: {
    primary: '#0084FF',
    secondary: '#00C6FF',
    gradient: ['#0084FF', '#00C6FF'] as const,
    background: '#000000',
    surface: '#18191A',
    card: '#242526',
    text: '#E4E6EB',
    textSecondary: '#B0B3B8',
    border: '#3E4042',
    error: '#F02849',
    success: '#00A400',
    inputBackground: '#3A3B3C',
    placeholder: '#B0B3B8',
    shadow: '#000000',
  },
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
};

export const SIZES = {
  // Font sizes
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  small: 14,
  tiny: 12,
  
  // Spacing
  padding: 16,
  margin: 16,
  borderRadius: 20,
  
  // Input
  inputHeight: 52,
  buttonHeight: 52,
};

export const API_URL = 'http://localhost:3000/api';
export const SOCKET_URL = 'http://localhost:3000';
