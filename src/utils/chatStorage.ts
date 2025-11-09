import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  WALLPAPER_PREFIX: '@chat_wallpaper_',
  DEFAULT_EMOJI_PREFIX: '@chat_emoji_',
};

interface ChatPreferences {
  wallpaperId: string;
  customEmoji: string;
}

/**
 * Save wallpaper and emoji preferences for a specific chat
 */
export const saveChatPreferences = async (
  chatId: string,
  wallpaperId: string,
  customEmoji: string
): Promise<void> => {
  try {
    const preferences: ChatPreferences = {
      wallpaperId,
      customEmoji,
    };
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.WALLPAPER_PREFIX}${chatId}`,
      JSON.stringify(preferences)
    );
  } catch (error) {
    console.error('Error saving chat preferences:', error);
  }
};

/**
 * Get wallpaper and emoji preferences for a specific chat
 */
export const getChatPreferences = async (
  chatId: string
): Promise<ChatPreferences | null> => {
  try {
    const data = await AsyncStorage.getItem(
      `${STORAGE_KEYS.WALLPAPER_PREFIX}${chatId}`
    );
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error getting chat preferences:', error);
    return null;
  }
};

/**
 * Clear preferences for a specific chat
 */
export const clearChatPreferences = async (chatId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`${STORAGE_KEYS.WALLPAPER_PREFIX}${chatId}`);
  } catch (error) {
    console.error('Error clearing chat preferences:', error);
  }
};

/**
 * Get all saved chat preferences
 */
export const getAllChatPreferences = async (): Promise<
  Record<string, ChatPreferences>
> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const wallpaperKeys = keys.filter((key) =>
      key.startsWith(STORAGE_KEYS.WALLPAPER_PREFIX)
    );

    const preferences: Record<string, ChatPreferences> = {};

    for (const key of wallpaperKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const chatId = key.replace(STORAGE_KEYS.WALLPAPER_PREFIX, '');
        preferences[chatId] = JSON.parse(data);
      }
    }

    return preferences;
  } catch (error) {
    console.error('Error getting all chat preferences:', error);
    return {};
  }
};
