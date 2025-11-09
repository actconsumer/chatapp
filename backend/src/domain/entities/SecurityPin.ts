/**
 * Security PIN Entity
 * Represents the security PIN/passcode for accessing messages
 */

export interface ISecurityPin {
  id: string;
  userId: string;
  pinHash: string; // Hashed PIN for security
  salt: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt?: Date;
  failedAttempts: number;
  lockedUntil?: Date;
}

export class SecurityPin implements ISecurityPin {
  id: string;
  userId: string;
  pinHash: string;
  salt: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt?: Date;
  failedAttempts: number;
  lockedUntil?: Date;

  constructor(data: Partial<ISecurityPin>) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.pinHash = data.pinHash || '';
    this.salt = data.salt || '';
    this.isEnabled = data.isEnabled !== undefined ? data.isEnabled : false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastVerifiedAt = data.lastVerifiedAt;
    this.failedAttempts = data.failedAttempts || 0;
    this.lockedUntil = data.lockedUntil;
  }

  incrementFailedAttempts(): void {
    this.failedAttempts += 1;
    this.updatedAt = new Date();

    // Lock after 5 failed attempts for 15 minutes
    if (this.failedAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
  }

  resetFailedAttempts(): void {
    this.failedAttempts = 0;
    this.lockedUntil = undefined;
    this.lastVerifiedAt = new Date();
    this.updatedAt = new Date();
  }

  isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return new Date() < this.lockedUntil;
  }

  toJSON() {
    return { ...this };
  }
}
