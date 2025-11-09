// Chat wallpaper configurations with default emojis
export interface WallpaperConfig {
  id: string;
  name: string;
  defaultEmoji: string;
  backgroundColor?: string;
  gradient?: string[];
  pattern?: 'bubbles' | 'dots' | 'waves' | 'hearts' | 'stars' | 'solid';
  patternColor?: string;
  // Custom color options
  customBackground?: string; // Override background color
  backgroundImage?: string; // Photo background URI
  senderBubbleColor?: string; // Bubble color for sent messages
  receiverBubbleColor?: string; // Bubble color for received messages
  senderTextColor?: string; // Text color in sent messages
  receiverTextColor?: string; // Text color in received messages
  dateTextColor?: string; // Date separator text color
  useGradientForSender?: boolean; // Use gradient or solid color for sender
  headerColor?: string; // Header background color override
  inputBarColor?: string; // Input bar background color override
}

// Interface for custom color configuration
export interface CustomColorConfig {
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundColor?: string;
  gradientColors?: string[];
  backgroundImage?: string;
  senderBubbleColor: string;
  receiverBubbleColor: string;
  senderTextColor: string;
  receiverTextColor: string;
  dateTextColor: string;
  headerColor: string;
  inputBarColor: string;
}

export const CHAT_WALLPAPERS: WallpaperConfig[] = [
  {
    id: 'messenger',
    name: 'Messenger Classic',
    defaultEmoji: '👍',
    gradient: ['#0084FF', '#00C6FF'],
    pattern: 'bubbles',
    patternColor: 'rgba(255, 255, 255, 0.05)',
    // Custom Messenger Classic styling
    customBackground: '#FFFFFF',
    senderBubbleColor: '#0084FF',
    receiverBubbleColor: '#E4E6EB',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#050505',
    dateTextColor: '#65676B',
    useGradientForSender: false,
  },
  {
    id: 'sunset',
    name: 'Sunset',
    defaultEmoji: '🌅',
    gradient: ['#FF6B6B', '#FFA500', '#FFD700'],
    pattern: 'waves',
    patternColor: 'rgba(255, 255, 255, 0.1)',
    // Solid bubble colors for readability
    senderBubbleColor: '#FF6B6B',
    receiverBubbleColor: 'rgba(255, 255, 255, 0.25)',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#1A1A1A',
    dateTextColor: 'rgba(255, 255, 255, 0.8)',
    useGradientForSender: false,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    defaultEmoji: '🌊',
    gradient: ['#00B4DB', '#0083B0'],
    pattern: 'waves',
    patternColor: 'rgba(255, 255, 255, 0.08)',
    // Solid bubble colors for readability
    senderBubbleColor: '#00B4DB',
    receiverBubbleColor: 'rgba(255, 255, 255, 0.25)',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#1A1A1A',
    dateTextColor: 'rgba(255, 255, 255, 0.8)',
    useGradientForSender: false,
  },
  {
    id: 'forest',
    name: 'Forest',
    defaultEmoji: '🌲',
    gradient: ['#134E5E', '#71B280'],
    pattern: 'dots',
    patternColor: 'rgba(255, 255, 255, 0.06)',
    // Solid bubble colors for readability
    senderBubbleColor: '#71B280',
    receiverBubbleColor: 'rgba(255, 255, 255, 0.25)',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#1A1A1A',
    dateTextColor: 'rgba(255, 255, 255, 0.8)',
    useGradientForSender: false,
  },
  {
    id: 'rose',
    name: 'Rose',
    defaultEmoji: '🌹',
    gradient: ['#F857A6', '#FF5858'],
    pattern: 'hearts',
    patternColor: 'rgba(255, 255, 255, 0.07)',
    // Solid bubble colors for readability
    senderBubbleColor: '#F857A6',
    receiverBubbleColor: 'rgba(255, 255, 255, 0.25)',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#1A1A1A',
    dateTextColor: 'rgba(255, 255, 255, 0.8)',
    useGradientForSender: false,
  },
  {
    id: 'purple',
    name: 'Purple Dream',
    defaultEmoji: '💜',
    gradient: ['#667EEA', '#764BA2'],
    pattern: 'stars',
    patternColor: 'rgba(255, 255, 255, 0.09)',
    // Solid bubble colors for readability
    senderBubbleColor: '#667EEA',
    receiverBubbleColor: 'rgba(255, 255, 255, 0.25)',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#1A1A1A',
    dateTextColor: 'rgba(255, 255, 255, 0.8)',
    useGradientForSender: false,
  },
  {
    id: 'night',
    name: 'Night Sky',
    defaultEmoji: '🌙',
    gradient: ['#0F2027', '#203A43', '#2C5364'],
    pattern: 'stars',
    patternColor: 'rgba(255, 255, 255, 0.15)',
    // Solid bubble colors for readability
    senderBubbleColor: '#2C5364',
    receiverBubbleColor: 'rgba(255, 255, 255, 0.2)',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#FFFFFF',
    dateTextColor: 'rgba(255, 255, 255, 0.9)',
    useGradientForSender: false,
  },
  {
    id: 'peach',
    name: 'Peach',
    defaultEmoji: '🍑',
    gradient: ['#FFDEE9', '#B5FFFC'],
    pattern: 'bubbles',
    patternColor: 'rgba(255, 255, 255, 0.2)',
    // Solid bubble colors for readability
    senderBubbleColor: '#FFB5C2',
    receiverBubbleColor: 'rgba(255, 255, 255, 0.4)',
    senderTextColor: '#1A1A1A',
    receiverTextColor: '#1A1A1A',
    dateTextColor: '#666666',
    useGradientForSender: false,
  },
  {
    id: 'fire',
    name: 'Fire',
    defaultEmoji: '🔥',
    gradient: ['#FF416C', '#FF4B2B'],
    pattern: 'solid',
    patternColor: 'rgba(255, 255, 255, 0.1)',
    // Solid bubble colors for readability
    senderBubbleColor: '#FF416C',
    receiverBubbleColor: 'rgba(255, 255, 255, 0.25)',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#1A1A1A',
    dateTextColor: 'rgba(255, 255, 255, 0.8)',
    useGradientForSender: false,
  },
  {
    id: 'mint',
    name: 'Mint',
    defaultEmoji: '🍃',
    gradient: ['#00F260', '#0575E6'],
    pattern: 'dots',
    patternColor: 'rgba(255, 255, 255, 0.08)',
    // Solid bubble colors for readability
    senderBubbleColor: '#00F260',
    receiverBubbleColor: 'rgba(255, 255, 255, 0.25)',
    senderTextColor: '#1A1A1A',
    receiverTextColor: '#1A1A1A',
    dateTextColor: '#1A1A1A',
    useGradientForSender: false,
  },
];

// Default wallpaper
export const DEFAULT_WALLPAPER: WallpaperConfig = CHAT_WALLPAPERS[0];

// Get wallpaper by ID or return default
export const getWallpaper = (wallpaperId?: string): WallpaperConfig => {
  if (!wallpaperId) return DEFAULT_WALLPAPER;
  return CHAT_WALLPAPERS.find(w => w.id === wallpaperId) || DEFAULT_WALLPAPER;
};
