/**
 * Two-Factor Authentication Entity
 * Handles TOTP-based 2FA configuration
 */

export interface ITwoFactorAuth {
  id: string;
  userId: string;
  secret: string;           // Base32 encoded TOTP secret
  isEnabled: boolean;
  backupCodes: IBackupCode[];
  createdAt: Date;
  enabledAt?: Date;
  lastUsedAt?: Date;
}

export interface IBackupCode {
  code: string;             // Hashed backup code
  isUsed: boolean;
  usedAt?: Date;
}

export class TwoFactorAuth implements ITwoFactorAuth {
  id: string;
  userId: string;
  secret: string;
  isEnabled: boolean;
  backupCodes: IBackupCode[];
  createdAt: Date;
  enabledAt?: Date;
  lastUsedAt?: Date;

  constructor(data: Partial<ITwoFactorAuth>) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.secret = data.secret || '';
    this.isEnabled = data.isEnabled || false;
    this.backupCodes = data.backupCodes || [];
    this.createdAt = data.createdAt || new Date();
    this.enabledAt = data.enabledAt;
    this.lastUsedAt = data.lastUsedAt;
  }

  enable(): void {
    this.isEnabled = true;
    this.enabledAt = new Date();
  }

  disable(): void {
    this.isEnabled = false;
  }

  updateLastUsed(): void {
    this.lastUsedAt = new Date();
  }

  hasUnusedBackupCodes(): boolean {
    return this.backupCodes.some(code => !code.isUsed);
  }

  getUnusedBackupCodesCount(): number {
    return this.backupCodes.filter(code => !code.isUsed).length;
  }

  toJSON() {
    const { secret, backupCodes, ...rest } = this;
    return {
      ...rest,
      hasBackupCodes: backupCodes.length > 0,
      unusedBackupCodesCount: this.getUnusedBackupCodesCount(),
    };
  }
}
