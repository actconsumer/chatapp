import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { chatService, ChatSummary } from '../../services/chat.service';
import DirectContactInfoScreen from './DirectContactInfoScreen';
import GroupContactInfoScreen from './GroupContactInfoScreen';

interface ContactProfileScreenProps {
  navigation: any;
  route: {
    params?: {
      chatId?: string;
      chatName?: string;
      chatAvatar?: string;
      isGroup?: boolean;
      summary?: ChatSummary;
      [key: string]: any;
    };
  };
}

export default function ContactProfileScreen({ navigation, route }: ContactProfileScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const params = route.params || {};
  const chatId = params.chatId;

  const [chatSummary, setChatSummary] = useState<ChatSummary | null>(params.summary || null);
  const [loading, setLoading] = useState(!params.summary);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!chatId) {
      setLoading(false);
      setErrorMessage('Missing chat identifier');
      return;
    }

    try {
      setLoading(true);
      const summary = await chatService.get(chatId);
      setChatSummary(summary);
      setErrorMessage(null);
    } catch (error: any) {
      console.error('ContactProfileScreen fetchSummary error:', error);
      setErrorMessage(error?.message || 'Failed to load contact information');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    if (!chatSummary) {
      void fetchSummary();
    }
  }, [chatSummary, fetchSummary]);

  useFocusEffect(
    useCallback(() => {
      if (chatId) {
        void fetchSummary();
      }
      return undefined;
    }, [chatId, fetchSummary])
  );

  const derivedType = useMemo(() => {
    if (chatSummary?.type) {
      return chatSummary.type;
    }
    return params.isGroup ? 'group' : 'direct';
  }, [chatSummary, params.isGroup]);

  if (loading && !chatSummary) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!chatSummary) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.errorWrapper}>
          <Text style={[styles.errorTitle, { color: theme.error }]}>{t('common.error')}</Text>
          <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>
            {errorMessage || 'Unable to load this contact right now.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (derivedType === 'group') {
    return (
      <GroupContactInfoScreen
        navigation={navigation}
        route={route}
        initialSummary={chatSummary}
      />
    );
  }

  return (
    <DirectContactInfoScreen
      navigation={navigation}
      route={route}
      initialSummary={chatSummary}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
});
