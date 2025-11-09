/**
 * User Domain Entity
 * Core business entity representing a user in the system
 */

export interface IUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  avatar?: string;
  bio?: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  isOnline: boolean;
  lastSeen: Date;
  
  // Privacy Settings
  privacySettings: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    showProfilePhoto: 'everyone' | 'contacts' | 'nobody';
    whoCanAddToGroups: 'everyone' | 'contacts';
  };
  
  // Security
  twoFactorEnabled: boolean;
  securityPinConfigured: boolean;
  refreshTokens: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IUserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface IUserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    messageNotifications: boolean;
    groupNotifications: boolean;
    callNotifications: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
  privacy: IUser['privacySettings'];
}

export class User implements IUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  avatar?: string;
  bio?: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  isOnline: boolean;
  lastSeen: Date;
  privacySettings: IUser['privacySettings'];
  twoFactorEnabled: boolean;
  securityPinConfigured: boolean;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(data: Partial<IUser>) {
    this.id = data.id || '';
    this.email = data.email || '';
    this.username = data.username || '';
    this.displayName = data.displayName || '';
    this.passwordHash = data.passwordHash || '';
    this.avatar = data.avatar;
    this.bio = data.bio;
    this.phoneNumber = data.phoneNumber;
    this.isEmailVerified = data.isEmailVerified || false;
    this.isPhoneVerified = data.isPhoneVerified || false;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.isOnline = data.isOnline || false;
    this.lastSeen = data.lastSeen || new Date();
    this.privacySettings = data.privacySettings || {
      showOnlineStatus: true,
      showLastSeen: true,
      showProfilePhoto: 'everyone',
      whoCanAddToGroups: 'everyone',
    };
    this.twoFactorEnabled = data.twoFactorEnabled || false;
    this.securityPinConfigured = data.securityPinConfigured || false;
    this.refreshTokens = data.refreshTokens || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.deletedAt = data.deletedAt;
  }

  toProfile(): IUserProfile {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      displayName: this.displayName,
      avatar: this.avatar,
      bio: this.bio,
      isOnline: this.isOnline,
      lastSeen: this.lastSeen,
    };
  }

  toJSON() {
    const { passwordHash, refreshTokens, ...user } = this;
    return user;
  }
}
