import { QRCodeType, QRCodeStatus, ScanResult, ViolationType, ViolationSeverity, AccessAction } from '@prisma/client';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma';
import { ValidationError, NotFoundError, UnauthorizedError } from '../utils/errors';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CreateQRCodeRequest {
  type: QRCodeType;
  userId?: string;
  visitorId?: string;
  validFor: number; // Duration in hours
  permissions: string[];
  maxScans?: number;
  metadata?: Record<string, any>;
}

export interface GeneratedQRCode {
  id: string;
  code: string;
  qrImageUrl: string;
  validFrom: Date;
  validUntil: Date;
  type: QRCodeType;
  permissions: string[];
}

export interface ScanQRCodeRequest {
  qrCodeData: string;
  location?: string;
  deviceInfo?: Record<string, any>;
  scannedBy?: string; // User ID who scanned
}

export interface ScanResultData {
  success: boolean;
  result: ScanResult;
  message: string;
  accessGranted: boolean;
  userInfo?: {
    id: string;
    name: string;
    type: 'USER' | 'VISITOR';
  };
  permissions?: string[];
  violations?: string[];
}

export interface AccessRuleData {
  name: string;
  description?: string;
  zoneId?: string;
  membershipTypes: string[];
  planTypes: string[];
  userRoles: string[];
  timeRestrictions: Record<string, any>;
  dayRestrictions: number[];
  maxOccupancy?: number;
  requiresApproval: boolean;
  priority: number;
  validFrom?: Date;
  validTo?: Date;
}

export interface OccupancyUpdate {
  zoneId?: string;
  spaceId?: string;
  action: 'ENTRY' | 'EXIT';
  timestamp: Date;
}

// ============================================================================
// ACCESS CONTROL SERVICE
// ============================================================================

export class AccessControlService {
  private readonly JWT_SECRET = process.env.QR_JWT_SECRET || 'fallback-secret-key';
  private readonly QR_BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  // ============================================================================
  // QR CODE GENERATION
  // ============================================================================

  async generateQRCode(tenantId: string, data: CreateQRCodeRequest): Promise<GeneratedQRCode> {
    try {
      const validFrom = new Date();
      const validUntil = new Date(validFrom.getTime() + (data.validFor * 60 * 60 * 1000));

      // Create JWT payload with security features
      const payload = {
        tenantId,
        type: data.type,
        userId: data.userId,
        visitorId: data.visitorId,
        permissions: data.permissions,
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
        metadata: data.metadata || {},
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(validUntil.getTime() / 1000)
      };

      // Generate secure JWT token
      const token = jwt.sign(payload, this.JWT_SECRET, { algorithm: 'HS256' });

      // Save QR code to database
      const qrCode = await prisma.qRCode.create({
        data: {
          tenantId,
          code: token,
          type: data.type,
          userId: data.userId,
          visitorId: data.visitorId,
          permissions: data.permissions,
          validFrom,
          validUntil,
          maxScans: data.maxScans,
          currentScans: 0,
          status: QRCodeStatus.ACTIVE,
          metadata: data.metadata || {}
        }
      });

      // Generate QR code image
      const qrImageUrl = await QRCode.toDataURL(token, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 256,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        id: qrCode.id,
        code: token,
        qrImageUrl,
        validFrom,
        validUntil,
        type: data.type,
        permissions: data.permissions
      };
    } catch (error) {
      throw new ValidationError(`Failed to generate QR code: ${error.message}`);
    }
  }

  // ============================================================================
  // QR CODE VALIDATION & SCANNING
  // ============================================================================

  async scanQRCode(tenantId: string, scanData: ScanQRCodeRequest): Promise<ScanResultData> {
    try {
      // Verify JWT token
      let payload: any;
      try {
        payload = jwt.verify(scanData.qrCodeData, this.JWT_SECRET);
      } catch (error) {
        await this.logScanAttempt(tenantId, null, scanData, ScanResult.INVALID, 'Invalid QR code token');
        return {
          success: false,
          result: ScanResult.INVALID,
          message: 'Invalid QR code',
          accessGranted: false
        };
      }

      // Verify tenant match
      if (payload.tenantId !== tenantId) {
        await this.logScanAttempt(tenantId, null, scanData, ScanResult.INVALID, 'Tenant mismatch');
        return {
          success: false,
          result: ScanResult.INVALID,
          message: 'QR code not valid for this location',
          accessGranted: false
        };
      }

      // Find QR code in database
      const qrCode = await prisma.qRCode.findFirst({
        where: {
          tenantId,
          code: scanData.qrCodeData
        },
        include: {
          user: true,
          visitor: true
        }
      });

      if (!qrCode) {
        await this.logScanAttempt(tenantId, null, scanData, ScanResult.INVALID, 'QR code not found');
        return {
          success: false,
          result: ScanResult.INVALID,
          message: 'QR code not found',
          accessGranted: false
        };
      }

      // Check QR code status
      if (qrCode.status !== QRCodeStatus.ACTIVE) {
        await this.logScanAttempt(tenantId, qrCode.id, scanData, ScanResult.DENIED, `QR code status: ${qrCode.status}`);
        return {
          success: false,
          result: ScanResult.DENIED,
          message: `QR code is ${qrCode.status.toLowerCase()}`,
          accessGranted: false
        };
      }

      // Check expiration
      if (new Date() > qrCode.validUntil) {
        await this.updateQRCodeStatus(qrCode.id, QRCodeStatus.EXPIRED);
        await this.logScanAttempt(tenantId, qrCode.id, scanData, ScanResult.EXPIRED, 'QR code expired');
        return {
          success: false,
          result: ScanResult.EXPIRED,
          message: 'QR code has expired',
          accessGranted: false
        };
      }

      // Check scan limits
      if (qrCode.maxScans && qrCode.currentScans >= qrCode.maxScans) {
        await this.updateQRCodeStatus(qrCode.id, QRCodeStatus.USED_UP);
        await this.logScanAttempt(tenantId, qrCode.id, scanData, ScanResult.DENIED, 'Maximum scans reached');
        return {
          success: false,
          result: ScanResult.DENIED,
          message: 'QR code has reached maximum usage',
          accessGranted: false
        };
      }

      // Validate access rules
      const accessValidation = await this.validateAccessRules(tenantId, qrCode, scanData.location);
      if (!accessValidation.allowed) {
        await this.logScanAttempt(tenantId, qrCode.id, scanData, ScanResult.RESTRICTED, accessValidation.reason);
        return {
          success: false,
          result: ScanResult.RESTRICTED,
          message: accessValidation.reason,
          accessGranted: false,
          violations: accessValidation.violations
        };
      }

      // Update scan count
      await prisma.qRCode.update({
        where: { id: qrCode.id },
        data: {
          currentScans: qrCode.currentScans + 1,
          lastUsedAt: new Date()
        }
      });

      // Log successful scan
      await this.logScanAttempt(tenantId, qrCode.id, scanData, ScanResult.SUCCESS, 'Access granted');

      // Update occupancy if applicable
      if (scanData.location) {
        await this.updateOccupancy(tenantId, {
          zoneId: scanData.location,
          action: 'ENTRY',
          timestamp: new Date()
        });
      }

      // Prepare user info
      const userInfo = qrCode.user ? {
        id: qrCode.user.id,
        name: `${qrCode.user.firstName} ${qrCode.user.lastName}`,
        type: 'USER' as const
      } : qrCode.visitor ? {
        id: qrCode.visitor.id,
        name: qrCode.visitor.name,
        type: 'VISITOR' as const
      } : undefined;

      return {
        success: true,
        result: ScanResult.SUCCESS,
        message: 'Access granted',
        accessGranted: true,
        userInfo,
        permissions: qrCode.permissions as string[]
      };

    } catch (error) {
      await this.logScanAttempt(tenantId, null, scanData, ScanResult.DENIED, `System error: ${error.message}`);
      throw new ValidationError(`Failed to scan QR code: ${error.message}`);
    }
  }

  // ============================================================================
  // ACCESS RULES MANAGEMENT
  // ============================================================================

  async createAccessRule(tenantId: string, data: AccessRuleData) {
    try {
      return await prisma.accessRule.create({
        data: {
          tenantId,
          name: data.name,
          description: data.description,
          zoneId: data.zoneId,
          membershipTypes: data.membershipTypes,
          planTypes: data.planTypes,
          userRoles: data.userRoles,
          timeRestrictions: data.timeRestrictions,
          dayRestrictions: data.dayRestrictions,
          maxOccupancy: data.maxOccupancy,
          requiresApproval: data.requiresApproval,
          priority: data.priority,
          validFrom: data.validFrom,
          validTo: data.validTo,
          isActive: true
        },
        include: {
          zone: true
        }
      });
    } catch (error) {
      throw new ValidationError(`Failed to create access rule: ${error.message}`);
    }
  }

  async getAccessRules(tenantId: string, zoneId?: string) {
    try {
      return await prisma.accessRule.findMany({
        where: {
          tenantId,
          isActive: true,
          ...(zoneId && { zoneId })
        },
        include: {
          zone: true
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ]
      });
    } catch (error) {
      throw new ValidationError(`Failed to fetch access rules: ${error.message}`);
    }
  }

  // ============================================================================
  // OCCUPANCY TRACKING
  // ============================================================================

  async updateOccupancy(tenantId: string, update: OccupancyUpdate) {
    try {
      const whereClause: any = { tenantId };
      if (update.zoneId) whereClause.zoneId = update.zoneId;
      if (update.spaceId) whereClause.spaceId = update.spaceId;

      const occupancy = await prisma.occupancyTracking.findFirst({
        where: whereClause
      });

      if (!occupancy) {
        // Create new occupancy record if it doesn't exist
        return await prisma.occupancyTracking.create({
          data: {
            tenantId,
            zoneId: update.zoneId,
            spaceId: update.spaceId,
            currentCount: update.action === 'ENTRY' ? 1 : 0,
            maxCapacity: 100, // Default capacity, should be configurable
            lastEntry: update.action === 'ENTRY' ? update.timestamp : null,
            lastExit: update.action === 'EXIT' ? update.timestamp : null,
            peakToday: update.action === 'ENTRY' ? 1 : 0
          }
        });
      }

      // Update existing occupancy
      const newCount = Math.max(0, 
        occupancy.currentCount + (update.action === 'ENTRY' ? 1 : -1)
      );

      return await prisma.occupancyTracking.update({
        where: { id: occupancy.id },
        data: {
          currentCount: newCount,
          lastEntry: update.action === 'ENTRY' ? update.timestamp : occupancy.lastEntry,
          lastExit: update.action === 'EXIT' ? update.timestamp : occupancy.lastExit,
          peakToday: Math.max(occupancy.peakToday, newCount),
          updatedAt: update.timestamp
        }
      });
    } catch (error) {
      throw new ValidationError(`Failed to update occupancy: ${error.message}`);
    }
  }

  async getCurrentOccupancy(tenantId: string, zoneId?: string, spaceId?: string) {
    try {
      const whereClause: any = { tenantId };
      if (zoneId) whereClause.zoneId = zoneId;
      if (spaceId) whereClause.spaceId = spaceId;

      return await prisma.occupancyTracking.findMany({
        where: whereClause,
        include: {
          zone: true,
          space: true
        }
      });
    } catch (error) {
      throw new ValidationError(`Failed to get occupancy data: ${error.message}`);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async validateAccessRules(tenantId: string, qrCode: any, location?: string) {
    try {
      const rules = await this.getAccessRules(tenantId, location);
      const violations: string[] = [];
      let allowed = true;
      let reason = '';

      for (const rule of rules) {
        // Check time restrictions
        if (rule.timeRestrictions && Object.keys(rule.timeRestrictions).length > 0) {
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();
          const restrictions = rule.timeRestrictions as any;
          
          if (restrictions.start && restrictions.end) {
            const startTime = this.parseTime(restrictions.start);
            const endTime = this.parseTime(restrictions.end);
            
            if (currentTime < startTime || currentTime > endTime) {
              violations.push(`Access outside allowed hours: ${restrictions.start}-${restrictions.end}`);
              allowed = false;
              reason = `Access not allowed at this time`;
            }
          }
        }

        // Check day restrictions
        if (rule.dayRestrictions && Array.isArray(rule.dayRestrictions)) {
          const today = new Date().getDay();
          if (!rule.dayRestrictions.includes(today)) {
            violations.push(`Access not allowed on this day`);
            allowed = false;
            reason = `Access not allowed on this day`;
          }
        }

        // Check occupancy limits
        if (rule.maxOccupancy && location) {
          const occupancy = await this.getCurrentOccupancy(tenantId, location);
          const currentCount = occupancy.reduce((sum, occ) => sum + occ.currentCount, 0);
          
          if (currentCount >= rule.maxOccupancy) {
            violations.push(`Area at maximum capacity (${rule.maxOccupancy})`);
            allowed = false;
            reason = `Area is at maximum capacity`;
          }
        }

        // Check membership/plan requirements
        if (qrCode.user && (rule.membershipTypes.length > 0 || rule.planTypes.length > 0)) {
          const userMemberships = await prisma.membership.findMany({
            where: {
              userId: qrCode.user.id,
              status: 'ACTIVE'
            },
            include: {
              plan: true
            }
          });

          if (userMemberships.length === 0) {
            violations.push(`No active membership found`);
            allowed = false;
            reason = `Active membership required`;
          }
        }
      }

      return { allowed, reason, violations };
    } catch (error) {
      return { allowed: false, reason: `Validation error: ${error.message}`, violations: [] };
    }
  }

  private async logScanAttempt(
    tenantId: string, 
    qrCodeId: string | null, 
    scanData: ScanQRCodeRequest, 
    result: ScanResult, 
    reason?: string
  ) {
    try {
      await prisma.qRCodeScan.create({
        data: {
          tenantId,
          qrCodeId: qrCodeId || '',
          userId: scanData.scannedBy,
          location: scanData.location,
          deviceInfo: scanData.deviceInfo || {},
          result,
          reason,
          metadata: {},
          scannedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log scan attempt:', error);
    }
  }

  private async updateQRCodeStatus(qrCodeId: string, status: QRCodeStatus) {
    try {
      await prisma.qRCode.update({
        where: { id: qrCodeId },
        data: { status }
      });
    } catch (error) {
      console.error('Failed to update QR code status:', error);
    }
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // ============================================================================
  // QR CODE MANAGEMENT
  // ============================================================================

  async getUserQRCodes(tenantId: string, userId: string) {
    try {
      return await prisma.qRCode.findMany({
        where: {
          tenantId,
          userId,
          status: QRCodeStatus.ACTIVE
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      throw new ValidationError(`Failed to get user QR codes: ${error.message}`);
    }
  }

  async revokeQRCode(tenantId: string, qrCodeId: string, revokedBy: string) {
    try {
      const qrCode = await prisma.qRCode.findFirst({
        where: {
          id: qrCodeId,
          tenantId
        }
      });

      if (!qrCode) {
        throw new NotFoundError('QR code not found');
      }

      return await prisma.qRCode.update({
        where: { id: qrCodeId },
        data: {
          status: QRCodeStatus.REVOKED,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      throw new ValidationError(`Failed to revoke QR code: ${error.message}`);
    }
  }

  async getAccessLogs(tenantId: string, filters?: {
    userId?: string;
    visitorId?: string;
    zoneId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    try {
      const where: any = { tenantId };
      
      if (filters?.userId) where.userId = filters.userId;
      if (filters?.visitorId) where.visitorId = filters.visitorId;
      if (filters?.zoneId) where.zoneId = filters.zoneId;
      if (filters?.startDate || filters?.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
      }

      return await prisma.accessLog.findMany({
        where,
        include: {
          user: true,
          visitor: true,
          zone: true
        },
        orderBy: { timestamp: 'desc' },
        take: filters?.limit || 100
      });
    } catch (error) {
      throw new ValidationError(`Failed to get access logs: ${error.message}`);
    }
  }
}

export const accessControlService = new AccessControlService();