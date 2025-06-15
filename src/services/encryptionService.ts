import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  tag: string;
}

export interface DecryptionOptions {
  encryptedData: string;
  iv: string;
  tag: string;
}

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits

  /**
   * Get encryption key from environment variables
   */
  private getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // If key is hex-encoded, decode it
    if (key.length === this.keyLength * 2) {
      return Buffer.from(key, 'hex');
    }

    // If key is base64-encoded, decode it
    if (key.length === Math.ceil(this.keyLength * 4 / 3)) {
      return Buffer.from(key, 'base64');
    }

    // Otherwise, hash the key to ensure it's the right length
    return crypto.createHash('sha256').update(key).digest();
  }

  /**
   * Generate a secure encryption key
   */
  generateEncryptionKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string): EncryptionResult {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipherGCM(this.algorithm, key, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption failed', { error: (error as Error).message });
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(options: DecryptionOptions): string {
    try {
      const key = this.getEncryptionKey();
      const iv = Buffer.from(options.iv, 'hex');
      const tag = Buffer.from(options.tag, 'hex');
      
      const decipher = crypto.createDecipherGCM(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(options.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { error: (error as Error).message });
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512');
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':');
      const verifyHash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
      return hash === verifyHash.toString('hex');
    } catch (error) {
      logger.error('Hash verification failed', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Encrypt field for database storage
   */
  encryptField(value: string | null): string | null {
    if (!value) return null;
    
    const result = this.encrypt(value);
    return `${result.encryptedData}:${result.iv}:${result.tag}`;
  }

  /**
   * Decrypt field from database
   */
  decryptField(encryptedValue: string | null): string | null {
    if (!encryptedValue) return null;
    
    try {
      const [encryptedData, iv, tag] = encryptedValue.split(':');
      return this.decrypt({ encryptedData, iv, tag });
    } catch (error) {
      logger.error('Field decryption failed', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Encrypt object for secure storage
   */
  encryptObject(obj: Record<string, any>): string {
    const jsonString = JSON.stringify(obj);
    const result = this.encrypt(jsonString);
    return `${result.encryptedData}:${result.iv}:${result.tag}`;
  }

  /**
   * Decrypt object from secure storage
   */
  decryptObject<T>(encryptedValue: string): T | null {
    try {
      const [encryptedData, iv, tag] = encryptedValue.split(':');
      const decryptedString = this.decrypt({ encryptedData, iv, tag });
      return JSON.parse(decryptedString) as T;
    } catch (error) {
      logger.error('Object decryption failed', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * Encrypt sensitive fields in Prisma data
   */
  encryptPrismaFields<T extends Record<string, any>>(
    data: T,
    fieldsToEncrypt: string[]
  ): T {
    const encrypted = { ...data };
    
    fieldsToEncrypt.forEach(field => {
      if (encrypted[field] !== undefined && encrypted[field] !== null) {
        encrypted[field] = this.encryptField(encrypted[field]);
      }
    });
    
    return encrypted;
  }

  /**
   * Decrypt sensitive fields from Prisma data
   */
  decryptPrismaFields<T extends Record<string, any>>(
    data: T,
    fieldsToDecrypt: string[]
  ): T {
    const decrypted = { ...data };
    
    fieldsToDecrypt.forEach(field => {
      if (decrypted[field] !== undefined && decrypted[field] !== null) {
        decrypted[field] = this.decryptField(decrypted[field]);
      }
    });
    
    return decrypted;
  }

  /**
   * Create encrypted backup of sensitive data
   */
  createEncryptedBackup(data: any): string {
    const timestamp = new Date().toISOString();
    const backupData = {
      timestamp,
      data,
      checksum: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
    };
    
    return this.encryptObject(backupData);
  }

  /**
   * Restore from encrypted backup
   */
  restoreFromEncryptedBackup<T>(encryptedBackup: string): T | null {
    try {
      const backupData = this.decryptObject<{
        timestamp: string;
        data: T;
        checksum: string;
      }>(encryptedBackup);
      
      if (!backupData) return null;
      
      // Verify checksum
      const expectedChecksum = crypto.createHash('sha256')
        .update(JSON.stringify(backupData.data))
        .digest('hex');
      
      if (expectedChecksum !== backupData.checksum) {
        logger.error('Backup checksum verification failed');
        return null;
      }
      
      return backupData.data;
    } catch (error) {
      logger.error('Backup restoration failed', { error: (error as Error).message });
      return null;
    }
  }
}

export const encryptionService = new EncryptionService();