/**
 * Encryption Utility
 * End-to-end encryption helpers for messages
 */

import crypto from 'crypto';
import { logger } from './logger';

const ALGORITHM = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-character-secret-key!';

export class EncryptionService {
  private algorithm: string;
  private key: Buffer;

  constructor() {
    this.algorithm = ALGORITHM;
    // Ensure key is 32 bytes for AES-256
    this.key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
  }

  /**
   * Encrypt data
   */
  public encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv) as crypto.CipherGCM;
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data
   */
  public decrypt(encrypted: string, iv: string, tag: string): string {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(iv, 'hex')
      ) as crypto.DecipherGCM;
      
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash password with bcrypt-like salt
   */
  public hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
      .toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify password against hash
   */
  public verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
      .toString('hex');
    return hash === verifyHash;
  }

  /**
   * Generate random OTP code
   */
  public generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }
    
    return otp;
  }

  /**
   * Generate random token
   */
  public generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash data with SHA-256
   */
  public hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export const encryptionService = new EncryptionService();
