/**
 * API Helper
 * Common helper functions for API calls
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiHeaders, STORAGE_KEYS } from './config';

/**
 * Get authenticated headers
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  return getApiHeaders(token || undefined);
}

/**
 * Safe token retrieval that converts null to undefined
 */
export async function getSafeToken(): Promise<string | undefined> {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  return token || undefined;
}
