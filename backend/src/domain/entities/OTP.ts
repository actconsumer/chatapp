/**
 * OTP (One-Time Password) Domain Entity
 * Used for email verification, password reset, etc.
 */

export type OTPPurpose = 'email_verification' | 'password_reset' | 'two_factor_auth' | 'phone_verification';

export interface IOTP {
  id: string;
  userId?: string;
  email?: string;
  phoneNumber?: string;
  code: string;
  purpose: OTPPurpose;
  isUsed: boolean;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
}

export class OTP implements IOTP {
  id: string;
  userId?: string;
  email?: string;
  phoneNumber?: string;
  code: string;
  purpose: OTPPurpose;
  isUsed: boolean;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;

  constructor(data: Partial<IOTP>) {
    this.id = data.id || '';
    this.userId = data.userId;
    this.email = data.email;
    this.phoneNumber = data.phoneNumber;
    this.code = data.code || '';
    this.purpose = data.purpose || 'email_verification';
    this.isUsed = data.isUsed || false;
    this.attempts = data.attempts || 0;
    this.maxAttempts = data.maxAttempts || 5;
    this.createdAt = data.createdAt || new Date();
    this.expiresAt = data.expiresAt || new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    this.usedAt = data.usedAt;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  canAttempt(): boolean {
    return this.attempts < this.maxAttempts && !this.isUsed && !this.isExpired();
  }

  incrementAttempts(): void {
    this.attempts += 1;
  }

  markAsUsed(): void {
    this.isUsed = true;
    this.usedAt = new Date();
  }

  verify(code: string): boolean {
    if (!this.canAttempt()) {
      return false;
    }

    this.incrementAttempts();

    if (this.code === code) {
      this.markAsUsed();
      return true;
    }

    return false;
  }

  toJSON() {
    const { code, ...otp } = this;
    return otp;
  }
}
