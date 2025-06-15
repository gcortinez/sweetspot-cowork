import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import { auditLogService } from './auditLogService';

export interface TwoFactorSetupData {
  secret: string;
  backupCodes: string[];
  qrCodeUrl: string;
  manualEntryKey: string;
}

export interface TwoFactorVerificationResult {
  success: boolean;
  usedBackupCode?: boolean;
  remainingBackupCodes?: number;
}

export class TwoFactorService {
  private readonly APP_NAME = 'SweetSpot Cowork';
  
  /**
   * Generate a new 2FA secret and setup data for a user
   */
  async setupTwoFactor(userId: string, tenantId: string): Promise<TwoFactorSetupData> {
    try {
      // Get user details
      const user = await prisma.user.findFirst({
        where: { id: userId, tenantId }
      });

      if (!user) {
        throw new ValidationError('User not found');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${this.APP_NAME}:${user.email}`,
        issuer: this.APP_NAME,
        length: 32
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Generate QR code URL
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      return {
        secret: secret.base32,
        backupCodes,
        qrCodeUrl,
        manualEntryKey: secret.base32
      };
    } catch (error) {
      throw new ValidationError(`Failed to setup 2FA: ${error.message}`);
    }
  }

  /**
   * Enable 2FA for a user after verifying the setup
   */
  async enableTwoFactor(
    userId: string, 
    tenantId: string, 
    secret: string, 
    token: string, 
    backupCodes: string[]
  ): Promise<void> {
    try {
      // Verify the token before enabling
      const isValid = this.verifyToken(secret, token);
      if (!isValid) {
        throw new ValidationError('Invalid verification code');
      }

      // Enable 2FA for the user
      await prisma.user.update({
        where: { id: userId, tenantId },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          twoFactorBackupCodes: backupCodes,
          lastTwoFactorVerified: new Date()
        }
      });

      // Log the action
      await auditLogService.log({
        tenantId,
        userId,
        action: 'ENABLE_2FA',
        entityType: 'User',
        entityId: userId,
        details: { message: '2FA enabled successfully' }
      });
    } catch (error) {
      throw new ValidationError(`Failed to enable 2FA: ${error.message}`);
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFactor(userId: string, tenantId: string, token: string): Promise<void> {
    try {
      const user = await prisma.user.findFirst({
        where: { id: userId, tenantId, twoFactorEnabled: true }
      });

      if (!user || !user.twoFactorSecret) {
        throw new ValidationError('2FA is not enabled for this user');
      }

      // Verify token before disabling
      const isValid = this.verifyToken(user.twoFactorSecret, token);
      if (!isValid) {
        throw new ValidationError('Invalid verification code');
      }

      // Disable 2FA
      await prisma.user.update({
        where: { id: userId, tenantId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: [],
          lastTwoFactorVerified: null
        }
      });

      // Log the action
      await auditLogService.log({
        tenantId,
        userId,
        action: 'DISABLE_2FA',
        entityType: 'User',
        entityId: userId,
        details: { message: '2FA disabled' }
      });
    } catch (error) {
      throw new ValidationError(`Failed to disable 2FA: ${error.message}`);
    }
  }

  /**
   * Verify a 2FA token or backup code
   */
  async verifyTwoFactor(
    userId: string, 
    tenantId: string, 
    token: string
  ): Promise<TwoFactorVerificationResult> {
    try {
      const user = await prisma.user.findFirst({
        where: { id: userId, tenantId, twoFactorEnabled: true }
      });

      if (!user || !user.twoFactorSecret) {
        throw new UnauthorizedError('2FA is not enabled for this user');
      }

      // First try to verify as TOTP token
      const isValidToken = this.verifyToken(user.twoFactorSecret, token);
      
      if (isValidToken) {
        // Update last verified timestamp
        await prisma.user.update({
          where: { id: userId, tenantId },
          data: { lastTwoFactorVerified: new Date() }
        });

        await auditLogService.log({
          tenantId,
          userId,
          action: 'VERIFY_2FA',
          entityType: 'User',
          entityId: userId,
          details: { method: 'totp' }
        });

        return { success: true };
      }

      // If TOTP fails, try backup codes
      const backupCodes = user.twoFactorBackupCodes as string[];
      if (backupCodes && backupCodes.includes(token)) {
        // Remove used backup code
        const remainingCodes = backupCodes.filter(code => code !== token);
        
        await prisma.user.update({
          where: { id: userId, tenantId },
          data: {
            twoFactorBackupCodes: remainingCodes,
            lastTwoFactorVerified: new Date()
          }
        });

        await auditLogService.log({
          tenantId,
          userId,
          action: 'VERIFY_2FA',
          entityType: 'User',
          entityId: userId,
          details: { 
            method: 'backup_code',
            remainingBackupCodes: remainingCodes.length
          }
        });

        return {
          success: true,
          usedBackupCode: true,
          remainingBackupCodes: remainingCodes.length
        };
      }

      // Both TOTP and backup code verification failed
      return { success: false };
    } catch (error) {
      throw new ValidationError(`Failed to verify 2FA: ${error.message}`);
    }
  }

  /**
   * Generate new backup codes for a user
   */
  async generateNewBackupCodes(userId: string, tenantId: string): Promise<string[]> {
    try {
      const user = await prisma.user.findFirst({
        where: { id: userId, tenantId, twoFactorEnabled: true }
      });

      if (!user) {
        throw new ValidationError('2FA is not enabled for this user');
      }

      const backupCodes = this.generateBackupCodes();

      await prisma.user.update({
        where: { id: userId, tenantId },
        data: { twoFactorBackupCodes: backupCodes }
      });

      await auditLogService.log({
        tenantId,
        userId,
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        details: { message: 'Generated new backup codes' }
      });

      return backupCodes;
    } catch (error) {
      throw new ValidationError(`Failed to generate backup codes: ${error.message}`);
    }
  }

  /**
   * Check if a user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string, tenantId: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { twoFactorEnabled: true }
    });

    return user?.twoFactorEnabled || false;
  }

  /**
   * Get 2FA status for a user
   */
  async getTwoFactorStatus(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
        lastTwoFactorVerified: true
      }
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    const backupCodes = user.twoFactorBackupCodes as string[];
    
    return {
      enabled: user.twoFactorEnabled,
      backupCodesRemaining: backupCodes ? backupCodes.length : 0,
      lastVerified: user.lastTwoFactorVerified
    };
  }

  /**
   * Verify a TOTP token against a secret
   */
  private verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow for time skew
    });
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Require 2FA verification for sensitive operations
   */
  async requireTwoFactorForOperation(
    userId: string, 
    tenantId: string, 
    operation: string
  ): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { 
        twoFactorEnabled: true, 
        lastTwoFactorVerified: true,
        role: true
      }
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    // If 2FA is not enabled, don't require it (this could be made configurable)
    if (!user.twoFactorEnabled) {
      return false;
    }

    // Check if user verified 2FA recently (within last 30 minutes for sensitive operations)
    const lastVerified = user.lastTwoFactorVerified;
    if (!lastVerified) {
      return true; // Require verification
    }

    const timeSinceVerification = Date.now() - lastVerified.getTime();
    const thirtyMinutes = 30 * 60 * 1000;

    // Require re-verification for admin operations or if too much time has passed
    const sensitiveOperations = ['DISABLE_2FA', 'USER_DELETE', 'SYSTEM_CONFIG', 'EXPORT_DATA'];
    if (sensitiveOperations.includes(operation) || timeSinceVerification > thirtyMinutes) {
      return true;
    }

    return false;
  }
}

export const twoFactorService = new TwoFactorService();