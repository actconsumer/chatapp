/**
 * API Configuration
 * Central configuration for all API endpoints
 */

// API Base URLs
export const API_CONFIG = {
  // Development
  DEV: {
    BASE_URL: 'http://localhost:3000',
    API_VERSION: 'v1',
  },
  // Production
  PROD: {
    BASE_URL: 'https://api.projectchat.azure-api.net',
    API_VERSION: 'v1',
  },
};

// Get current environment
const isDevelopment = __DEV__;

// Current API configuration
export const CURRENT_API = isDevelopment ? API_CONFIG.DEV : API_CONFIG.PROD;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ME: '/auth/me',
  },
  
  // 2FA endpoints
  TWO_FACTOR: {
    SETUP: '/auth/2fa/setup',
    VERIFY: '/auth/2fa/verify',
    VALIDATE: '/auth/2fa/validate',
    DISABLE: '/auth/2fa/disable',
    REGENERATE_BACKUP_CODES: '/auth/2fa/backup-codes/regenerate',
    STATUS: '/auth/2fa/status',
  },
  
  // Security endpoints
  SECURITY: {
    GENERATE_KEYS: '/security/keys/generate',
    REGISTER_DEVICE: '/security/devices/register',
    GET_DEVICES: '/security/devices',
    REVOKE_DEVICE: (deviceId: string) => `/security/devices/${deviceId}`,
    ENCRYPT_MESSAGE_KEY: '/security/messages/keys/encrypt',
    GET_MESSAGE_KEY: '/security/messages/keys',
    VERIFY_DEVICE: '/security/devices/verify',
    PIN: {
      SETUP: '/security/pin/setup',
      VERIFY: '/security/pin/verify',
      REQUIRED: '/security/pin/required',
      CHANGE: '/security/pin',
      DISABLE: '/security/pin',
      ENABLE: '/security/pin/enable',
      STATUS: '/security/pin/status',
      TRUST_DEVICE: '/security/pin/devices/trust',
      GET_DEVICES: '/security/pin/devices',
      REVOKE_DEVICE: (deviceId: string) => `/security/pin/devices/${deviceId}`,
      REVOKE_ALL: '/security/pin/devices/revoke-all',
    },
  },
  
  // Message endpoints
  MESSAGES: {
    SEND: '/messages',
    UPLOAD: '/messages/upload',
    LIST: (chatId: string) => `/messages/${chatId}`,
    GET: (chatId: string, messageId: string) => `/messages/${chatId}/${messageId}`,
    UPDATE: (messageId: string) => `/messages/${messageId}`,
    DELETE: (messageId: string) => `/messages/${messageId}`,
    DELETE_FOR_ME: (messageId: string) => `/messages/${messageId}/forme`,
    REACTIONS: (messageId: string) => `/messages/${messageId}/reactions`,
    REACTION: (messageId: string, emoji: string) => `/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    SEARCH: (chatId: string) => `/messages/${chatId}/search`,
    UNREAD_COUNT: (chatId: string) => `/messages/${chatId}/unread-count`,
    MARK_DELIVERED: (chatId: string) => `/messages/${chatId}/delivered`,
    MARK_READ: (chatId: string) => `/messages/${chatId}/read`,
    FORWARD: (messageId: string) => `/messages/${messageId}/forward`,
  },
  
  // Conversation endpoints (legacy aliases that map to chat routes)
  CONVERSATIONS: {
    LIST: '/chats',
    GET: (conversationId: string) => `/chats/${conversationId}`,
    CREATE: '/chats',
    UPDATE: (conversationId: string) => `/chats/${conversationId}`,
    DELETE: (conversationId: string) => `/chats/${conversationId}`,
    MESSAGES: (conversationId: string) => `/messages/${conversationId}`,
    MARK_READ: (conversationId: string) => `/messages/${conversationId}/read`,
    PIN: (conversationId: string) => `/chats/${conversationId}/pin`,
    MUTE: (conversationId: string) => `/chats/${conversationId}/mute`,
  },
  
  // Chat endpoints
  CHATS: {
    LIST: '/chats',
    SEARCH: '/chats/search',
    GET: (chatId: string) => `/chats/${chatId}`,
    CREATE: '/chats',
    UPDATE: (chatId: string) => `/chats/${chatId}`,
    DELETE: (chatId: string) => `/chats/${chatId}`,
    PARTICIPANTS: (chatId: string) => `/chats/${chatId}/participants`,
    PARTICIPANT: (chatId: string, participantId: string) => `/chats/${chatId}/participants/${participantId}`,
    PARTICIPANT_ROLE: (chatId: string, participantId: string) => `/chats/${chatId}/participants/${participantId}/role`,
    AVATAR: (chatId: string) => `/chats/${chatId}/avatar`,
    MUTE: (chatId: string) => `/chats/${chatId}/mute`,
    PIN: (chatId: string) => `/chats/${chatId}/pin`,
    READ: (chatId: string) => `/chats/${chatId}/read`,
    STATS: (chatId: string) => `/chats/${chatId}/stats`,
    LEAVE: (chatId: string) => `/chats/${chatId}/leave`,
  },

  // Group endpoints
  GROUPS: {
    LIST: '/groups',
    CREATE: '/groups',
    GET: (groupId: string) => `/groups/${groupId}`,
    UPDATE: (groupId: string) => `/groups/${groupId}`,
    DELETE: (groupId: string) => `/groups/${groupId}`,
    ADD_MEMBERS: (groupId: string) => `/groups/${groupId}/members`,
    REMOVE_MEMBER: (groupId: string, memberId: string) => `/groups/${groupId}/members/${memberId}`,
    LEAVE: (groupId: string) => `/groups/${groupId}/leave`,
    PIN: (groupId: string) => `/groups/${groupId}/pin`,
  },
  
  // Story endpoints
  STORIES: {
    CREATE: '/stories/create',
    LIST: '/stories',
    GET: (storyId: string) => `/stories/${storyId}`,
    DELETE: (storyId: string) => `/stories/${storyId}`,
    VIEW: (storyId: string) => `/stories/${storyId}/view`,
    VIEWERS: (storyId: string) => `/stories/${storyId}/viewers`,
    MY_STORIES: '/stories/my-stories',
  },
  
  // User endpoints
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile/update',
    UPLOAD_AVATAR: '/users/profile/avatar',
    SEARCH: '/users/search',
    GET: (userId: string) => `/users/${userId}`,
    BLOCK: (userId: string) => `/users/${userId}/block`,
    UNBLOCK: (userId: string) => `/users/${userId}/unblock`,
  },
  
  // Notification endpoints
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (notificationId: string) => `/notifications/${notificationId}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: (notificationId: string) => `/notifications/${notificationId}`,
    PREFERENCES: '/notifications/preferences',
    REGISTER_TOKEN: '/notifications/push/register',
    UNREGISTER_TOKEN: '/notifications/push/unregister',
    UNREAD_COUNT: '/notifications/unread-count',
  },
  
  // Call endpoints
  CALLS: {
    INITIATE: '/calls/initiate',
    ANSWER: (callId: string) => `/calls/${callId}/answer`,
    REJECT: (callId: string) => `/calls/${callId}/reject`,
    END: (callId: string) => `/calls/${callId}/end`,
    HISTORY: '/calls/history',
    GET: (callId: string) => `/calls/${callId}`,
    QUALITY: (callId: string) => `/calls/${callId}/quality`,
    PARTICIPANTS: (callId: string) => `/calls/${callId}/participants`,
    PARTICIPANT: (callId: string, participantId: string) => `/calls/${callId}/participants/${participantId}`,
  },

  // Moderation endpoints
  REPORTS: {
    CREATE: '/reports',
    USER: '/reports/user',
    CHAT: (chatId: string) => `/reports/chats/${chatId}`,
  },
};

// API Headers
export const getApiHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// API URL builder
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = CURRENT_API.BASE_URL;
  const version = CURRENT_API.API_VERSION;
  
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  return `${baseUrl}/api/${version}/${cleanEndpoint}`;
};

// Email configuration
export const EMAIL_CONFIG = {
  FROM: 'no-reply@projectchat.azurecomm.net',
  FROM_NAME: 'Project Chat',
};

// App configuration
export const APP_CONFIG = {
  NAME: 'Project Chat',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@projectchat.com',
  PRIVACY_URL: 'https://projectchat.com/privacy',
  TERMS_URL: 'https://projectchat.com/terms',
};

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@projectchat:access_token',
  REFRESH_TOKEN: '@projectchat:refresh_token',
  USER_DATA: '@projectchat:user_data',
  DEVICE_ID: '@projectchat:device_id',
  PRIVATE_KEY: '@projectchat:private_key',
  BACKUP_CODES: '@projectchat:backup_codes',
  LANGUAGE: '@projectchat:language',
  THEME: '@projectchat:theme',
};

// Timeout configurations
export const TIMEOUTS = {
  REQUEST: 30000, // 30 seconds
  UPLOAD: 120000, // 2 minutes
  DOWNLOAD: 60000, // 1 minute
};
