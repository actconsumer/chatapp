/**
 * Security Key Entity
 * Manages device-specific encryption keys for E2E encryption
 */

export type KeyType = 'identity' | 'prekey' | 'signed_prekey';
export type KeyStatus = 'active' | 'revoked' | 'expired';

export interface ISecurityKey {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  keyType: KeyType;
  publicKey: string;        // Base64 encoded public key
  privateKeyEncrypted: string; // Encrypted with user's master key
  keyFingerprint: string;   // SHA-256 hash of public key
  status: KeyStatus;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
}

export interface IDeviceSession {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'web';
  platform: string;
  lastActive: Date;
  ipAddress?: string;
  userAgent?: string;
  publicKey: string;
  isCurrentDevice: boolean;
}

export class SecurityKey implements ISecurityKey {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  keyType: KeyType;
  publicKey: string;
  privateKeyEncrypted: string;
  keyFingerprint: string;
  status: KeyStatus;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;

  constructor(data: Partial<ISecurityKey>) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.deviceId = data.deviceId || '';
    this.deviceName = data.deviceName || '';
    this.keyType = data.keyType || 'identity';
    this.publicKey = data.publicKey || '';
    this.privateKeyEncrypted = data.privateKeyEncrypted || '';
    this.keyFingerprint = data.keyFingerprint || '';
    this.status = data.status || 'active';
    this.expiresAt = data.expiresAt;
    this.createdAt = data.createdAt || new Date();
    this.lastUsedAt = data.lastUsedAt;
    this.revokedAt = data.revokedAt;
  }

  isActive(): boolean {
    if (this.status !== 'active') return false;
    if (this.expiresAt && new Date() > this.expiresAt) {
      this.status = 'expired';
      return false;
    }
    return true;
  }

  revoke(): void {
    this.status = 'revoked';
    this.revokedAt = new Date();
  }

  updateLastUsed(): void {
    this.lastUsedAt = new Date();
  }

  toJSON() {
    const { privateKeyEncrypted, ...rest } = this;
    return rest;
  }
}

/**
 * Message Encryption Key
 * Stores encrypted message keys for multi-device access
 */
export interface IMessageKey {
  id: string;
  messageId: string;
  chatId: string;
  senderId: string;
  encryptedKey: string;     // Message encryption key, encrypted for each recipient device
  recipientDeviceId: string;
  keyVersion: number;
  createdAt: Date;
}

export class MessageKey implements IMessageKey {
  id: string;
  messageId: string;
  chatId: string;
  senderId: string;
  encryptedKey: string;
  recipientDeviceId: string;
  keyVersion: number;
  createdAt: Date;

  constructor(data: Partial<IMessageKey>) {
    this.id = data.id || '';
    this.messageId = data.messageId || '';
    this.chatId = data.chatId || '';
    this.senderId = data.senderId || '';
    this.encryptedKey = data.encryptedKey || '';
    this.recipientDeviceId = data.recipientDeviceId || '';
    this.keyVersion = data.keyVersion || 1;
    this.createdAt = data.createdAt || new Date();
  }

  toJSON() {
    return { ...this };
  }
}
