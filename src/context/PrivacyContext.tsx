import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { privacyService, PrivacySettings } from '../services/privacy.service';
import { useAuth } from './AuthContext';

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profilePhotoVisibility: 'everyone',
  lastSeenVisibility: 'contacts',
  statusVisibility: 'everyone',
  readReceipts: true,
  onlineStatus: true,
  typingIndicator: true,
  allowCalls: true,
  allowGroupInvites: true,
};

interface PrivacyContextValue {
  settings: PrivacySettings;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  updateSettings: (updates: Partial<PrivacySettings>) => Promise<void>;
}

const PrivacyContext = createContext<PrivacyContextValue | undefined>(undefined);

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [isFetching, setIsFetching] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setSettings(DEFAULT_PRIVACY_SETTINGS);
      setHasLoaded(true);
      return;
    }

    setIsFetching(true);
    try {
      const freshSettings = await privacyService.getPrivacySettings();
      if (freshSettings) {
        setSettings(freshSettings);
      }
    } catch (error) {
      console.error('Privacy settings refresh error:', error);
    } finally {
      setIsFetching(false);
      setHasLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateSettings = useCallback(
    async (updates: Partial<PrivacySettings>) => {
      if (!user) {
        throw new Error('You must be signed in to update privacy settings.');
      }

      const previousSettings = settings;
      const optimistic = { ...settings, ...updates } as PrivacySettings;
      setSettings(optimistic);

      try {
        const persisted = await privacyService.updatePrivacySettings(updates);
        if (persisted) {
          setSettings(persisted);
        } else {
          setSettings(optimistic);
        }
      } catch (error) {
        console.error('Privacy settings update error:', error);
        setSettings(previousSettings);
        throw error;
      }
    },
    [settings, user]
  );

  return (
    <PrivacyContext.Provider
      value={{
        settings,
        loading: !hasLoaded && isFetching,
        refreshing: isFetching,
        refresh,
        updateSettings,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};
