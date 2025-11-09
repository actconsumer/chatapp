/**
 * Device Entity
 * Represents a trusted device for a user
 */

export interface IDevice {
  id: string;
  userId: string;
  deviceId: string; // Unique identifier for the device
  deviceName: string; // e.g., "iPhone 13 Pro", "Chrome on Windows"
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'web';
  platform: string; // iOS, Android, Windows, macOS, Linux, Web
  appVersion?: string;
  
  // Trust status
  isTrusted: boolean;
  trustGrantedAt?: Date;
  
  // Device fingerprint
  fingerprint: {
    userAgent?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
  };
  
  // Security
  requiresPinOnStart: boolean; // If false, device is fully trusted
  lastVerifiedAt?: Date;
  
  // Tracking
  lastActiveAt: Date;
  lastIpAddress?: string;
  pushToken?: string; // For notifications
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  revokedAt?: Date;
}

export class Device implements IDevice {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'web';
  platform: string;
  appVersion?: string;
  isTrusted: boolean;
  trustGrantedAt?: Date;
  fingerprint: IDevice['fingerprint'];
  requiresPinOnStart: boolean;
  lastVerifiedAt?: Date;
  lastActiveAt: Date;
  lastIpAddress?: string;
  pushToken?: string;
  createdAt: Date;
  updatedAt: Date;
  revokedAt?: Date;

  constructor(data: Partial<IDevice>) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.deviceId = data.deviceId || '';
    this.deviceName = data.deviceName || 'Unknown Device';
    this.deviceType = data.deviceType || 'web';
    this.platform = data.platform || 'unknown';
    this.appVersion = data.appVersion;
    this.isTrusted = data.isTrusted || false;
    this.trustGrantedAt = data.trustGrantedAt;
    this.fingerprint = data.fingerprint || {};
    this.requiresPinOnStart = data.requiresPinOnStart !== undefined ? data.requiresPinOnStart : true;
    this.lastVerifiedAt = data.lastVerifiedAt;
    this.lastActiveAt = data.lastActiveAt || new Date();
    this.lastIpAddress = data.lastIpAddress;
    this.pushToken = data.pushToken;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.revokedAt = data.revokedAt;
  }

  markAsTrusted(): void {
    this.isTrusted = true;
    this.trustGrantedAt = new Date();
    this.requiresPinOnStart = false;
    this.updatedAt = new Date();
  }

  revokeTrust(): void {
    this.isTrusted = false;
    this.requiresPinOnStart = true;
    this.revokedAt = new Date();
    this.updatedAt = new Date();
  }

  updateActivity(ipAddress?: string): void {
    this.lastActiveAt = new Date();
    if (ipAddress) {
      this.lastIpAddress = ipAddress;
    }
    this.updatedAt = new Date();
  }

  verify(): void {
    this.lastVerifiedAt = new Date();
    this.updatedAt = new Date();
  }

  toJSON() {
    return { ...this };
  }
}
