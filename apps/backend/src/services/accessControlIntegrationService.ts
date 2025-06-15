import { prisma } from '../lib/prisma';
import {
  AccessAction,
  ScanResult,
  QRCodeStatus,
  ViolationType,
  ViolationSeverity,
  VisitorStatus,
  VisitorAction,
  CodeStatus,
  Prisma
} from '@prisma/client';
import { logger } from '../utils/logger';
import { visitorService } from './visitorService';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface AccessAttempt {
  tenantId: string;
  userId?: string;
  visitorId?: string;
  accessType: 'QR_CODE' | 'ACCESS_CODE' | 'BADGE' | 'MANUAL';
  accessData: string; // QR code, access code, badge number, etc.
  location?: string;
  accessPoint?: string;
  deviceInfo?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface AccessResult {
  success: boolean;
  accessGranted: boolean;
  result: ScanResult;
  reason?: string;
  visitor?: any;
  accessZones?: string[];
  validUntil?: Date;
  restrictions?: any;
}

export interface AccessPolicy {
  tenantId: string;
  name: string;
  description?: string;
  rules: AccessPolicyRule[];
  priority: number;
  isActive: boolean;
}

export interface AccessPolicyRule {
  type: 'TIME_BASED' | 'ZONE_BASED' | 'ROLE_BASED' | 'VISITOR_TYPE';
  conditions: any;
  action: 'ALLOW' | 'DENY' | 'REQUIRE_APPROVAL';
  message?: string;
}

export interface AccessViolationData {
  id: string;
  tenantId: string;
  userId?: string;
  visitorId?: string;
  violationType: ViolationType;
  description: string;
  severity: ViolationSeverity;
  location?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  metadata: any;
  createdAt: Date;
}

export interface CheckInData {
  visitorId: string;
  location?: string;
  accessPoint?: string;
  badgeNumber?: string;
  photoUrl?: string;
  verificationMethod: 'QR_CODE' | 'ACCESS_CODE' | 'MANUAL';
  verificationData?: string;
  healthDeclaration?: any;
  emergencyContact?: any;
  termsAccepted?: boolean;
  dataConsent?: boolean;
}

export interface CheckOutData {
  visitorId: string;
  location?: string;
  accessPoint?: string;
  badgeReturned?: boolean;
  feedback?: string;
  rating?: number;
  notes?: string;
}

// ============================================================================
// ACCESS CONTROL INTEGRATION SERVICE
// ============================================================================

class AccessControlIntegrationService {

  // ============================================================================
  // ACCESS VERIFICATION
  // ============================================================================

  async verifyAccess(
    tenantId: string,
    attempt: AccessAttempt
  ): Promise<AccessResult> {
    try {
      logger.info('Access verification started', { 
        tenantId, 
        accessType: attempt.accessType, 
        location: attempt.location 
      });

      let result: AccessResult;

      switch (attempt.accessType) {
        case 'QR_CODE':
          result = await this.verifyQRCodeAccess(tenantId, attempt);
          break;
        case 'ACCESS_CODE':
          result = await this.verifyAccessCodeAccess(tenantId, attempt);
          break;
        case 'BADGE':
          result = await this.verifyBadgeAccess(tenantId, attempt);
          break;
        case 'MANUAL':
          result = await this.verifyManualAccess(tenantId, attempt);
          break;
        default:
          result = {
            success: false,
            accessGranted: false,
            result: ScanResult.INVALID,
            reason: 'Unknown access type'
          };
      }

      // Log access attempt
      await this.logAccessAttempt(tenantId, attempt, result);

      // Check for violations
      if (!result.accessGranted) {
        await this.handleAccessViolation(tenantId, attempt, result);
      }

      logger.info('Access verification completed', { 
        tenantId, 
        success: result.success, 
        accessGranted: result.accessGranted 
      });

      return result;
    } catch (error) {
      logger.error('Access verification failed', { tenantId, attempt }, error as Error);
      
      return {
        success: false,
        accessGranted: false,
        result: ScanResult.INVALID,
        reason: 'Verification error'
      };
    }
  }

  private async verifyQRCodeAccess(
    tenantId: string,
    attempt: AccessAttempt
  ): Promise<AccessResult> {
    try {
      // Find visitor by QR code
      const visitor = await prisma.visitor.findFirst({
        where: {
          tenantId,
          qrCode: attempt.accessData,
          status: { in: [VisitorStatus.APPROVED, VisitorStatus.CHECKED_IN] }
        },
        include: {
          host: true
        }
      });

      if (!visitor) {
        return {
          success: true,
          accessGranted: false,
          result: ScanResult.INVALID,
          reason: 'Visitor not found or invalid QR code'
        };
      }

      // Check time validity
      const now = new Date();
      if (now < visitor.validFrom || now > visitor.validUntil) {
        return {
          success: true,
          accessGranted: false,
          result: ScanResult.EXPIRED,
          reason: 'QR code expired or not yet valid'
        };
      }

      // Check access zones
      const hasZoneAccess = await this.checkZoneAccess(
        tenantId,
        visitor.accessZones as string[],
        attempt.location
      );

      if (!hasZoneAccess) {
        return {
          success: true,
          accessGranted: false,
          result: ScanResult.RESTRICTED,
          reason: 'Access to this zone not permitted'
        };
      }

      // Check visitor policies
      const policyResult = await this.checkVisitorPolicies(tenantId, visitor, attempt);
      if (!policyResult.allowed) {
        return {
          success: true,
          accessGranted: false,
          result: ScanResult.DENIED,
          reason: policyResult.reason
        };
      }

      return {
        success: true,
        accessGranted: true,
        result: ScanResult.SUCCESS,
        visitor,
        accessZones: visitor.accessZones as string[],
        validUntil: visitor.validUntil,
        restrictions: policyResult.restrictions
      };
    } catch (error) {
      logger.error('QR code verification failed', { tenantId, attempt }, error as Error);
      throw error;
    }
  }

  private async verifyAccessCodeAccess(
    tenantId: string,
    attempt: AccessAttempt
  ): Promise<AccessResult> {
    try {
      // Use visitor service to validate access code
      const validation = await visitorService.validateAccessCode(
        tenantId,
        attempt.accessData,
        attempt.location,
        attempt.ipAddress
      );

      if (!validation.valid) {
        return {
          success: true,
          accessGranted: false,
          result: ScanResult.DENIED,
          reason: validation.reason
        };
      }

      const accessCode = validation.accessCode!;

      // Get associated visitor if any
      let visitor = null;
      if (accessCode.visitorId) {
        visitor = await prisma.visitor.findUnique({
          where: { id: accessCode.visitorId },
          include: { host: true }
        });
      }

      // Use the access code
      const usageResult = await visitorService.useAccessCode(
        tenantId,
        attempt.accessData,
        attempt.userId,
        attempt.visitorId,
        attempt.location,
        attempt.ipAddress,
        attempt.deviceInfo
      );

      if (!usageResult.success) {
        return {
          success: true,
          accessGranted: false,
          result: ScanResult.DENIED,
          reason: usageResult.reason
        };
      }

      return {
        success: true,
        accessGranted: true,
        result: ScanResult.SUCCESS,
        visitor,
        accessZones: accessCode.accessZones,
        validUntil: accessCode.expiresAt
      };
    } catch (error) {
      logger.error('Access code verification failed', { tenantId, attempt }, error as Error);
      throw error;
    }
  }

  private async verifyBadgeAccess(
    tenantId: string,
    attempt: AccessAttempt
  ): Promise<AccessResult> {
    try {
      // Find active badge
      const badge = await prisma.visitorBadge.findFirst({
        where: {
          tenantId,
          badgeNumber: attempt.accessData,
          isActive: true
        },
        include: {
          visitor: {
            include: {
              host: true
            }
          }
        }
      });

      if (!badge || !badge.visitor) {
        return {
          success: true,
          accessGranted: false,
          result: ScanResult.INVALID,
          reason: 'Badge not found or inactive'
        };
      }

      const visitor = badge.visitor;

      // Check if visitor is checked in
      if (visitor.status !== VisitorStatus.CHECKED_IN) {
        return {
          success: true,
          accessGranted: false,
          result: ScanResult.DENIED,
          reason: 'Visitor not checked in'
        };
      }

      // Check time validity
      const now = new Date();
      if (now < visitor.validFrom || now > visitor.validUntil) {
        return {
          success: true,
          accessGranted: false,
          result: ScanResult.EXPIRED,
          reason: 'Visit period expired'
        };
      }

      // Check zone access
      const hasZoneAccess = await this.checkZoneAccess(
        tenantId,
        visitor.accessZones as string[],
        attempt.location
      );

      if (!hasZoneAccess) {
        return {
          success: true,
          accessGranted: false,
          result: ScanResult.RESTRICTED,
          reason: 'Access to this zone not permitted'
        };
      }

      return {
        success: true,
        accessGranted: true,
        result: ScanResult.SUCCESS,
        visitor,
        accessZones: visitor.accessZones as string[],
        validUntil: visitor.validUntil
      };
    } catch (error) {
      logger.error('Badge verification failed', { tenantId, attempt }, error as Error);
      throw error;
    }
  }

  private async verifyManualAccess(
    tenantId: string,
    attempt: AccessAttempt
  ): Promise<AccessResult> {
    try {
      // For manual access, we need to verify the user performing the action
      if (!attempt.userId) {
        return {
          success: true,
          accessGranted: false,
          result: ScanResult.DENIED,
          reason: 'Manual access requires authenticated user'
        };
      }

      // Verify user has authority to grant manual access
      const user = await prisma.user.findFirst({
        where: {
          id: attempt.userId,
          tenantId,
          role: { in: ['COWORK_ADMIN', 'CLIENT_ADMIN'] }
        }
      });

      if (!user) {
        return {
          success: true,
          accessGranted: false,
          result: ScanResult.DENIED,
          reason: 'User not authorized for manual access'
        };
      }

      // Get visitor if specified
      let visitor = null;
      if (attempt.visitorId) {
        visitor = await prisma.visitor.findFirst({
          where: {
            id: attempt.visitorId,
            tenantId
          },
          include: { host: true }
        });
      }

      return {
        success: true,
        accessGranted: true,
        result: ScanResult.SUCCESS,
        visitor,
        reason: 'Manual access granted by authorized user'
      };
    } catch (error) {
      logger.error('Manual access verification failed', { tenantId, attempt }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // CHECK-IN/CHECK-OUT INTEGRATION
  // ============================================================================

  async processCheckIn(
    tenantId: string,
    data: CheckInData,
    performedBy?: string
  ): Promise<{ success: boolean; visitor?: any; reason?: string }> {
    try {
      // Verify access first
      const accessAttempt: AccessAttempt = {
        tenantId,
        visitorId: data.visitorId,
        accessType: data.verificationMethod,
        accessData: data.verificationData || '',
        location: data.location,
        accessPoint: data.accessPoint
      };

      const accessResult = await this.verifyAccess(tenantId, accessAttempt);

      if (!accessResult.accessGranted) {
        return {
          success: false,
          reason: accessResult.reason
        };
      }

      // Perform check-in using visitor service
      const visitor = await visitorService.checkInVisitor(tenantId, {
        visitorId: data.visitorId,
        checkInLocation: data.location,
        badgeNumber: data.badgeNumber,
        photoUrl: data.photoUrl,
        healthDeclaration: data.healthDeclaration,
        termsAccepted: data.termsAccepted,
        dataConsent: data.dataConsent
      });

      // Log successful check-in
      await this.logVisitorAction(
        tenantId,
        data.visitorId,
        VisitorAction.CHECKED_IN,
        performedBy,
        `Checked in via ${data.verificationMethod}`,
        data.location
      );

      logger.info('Visitor checked in successfully', { 
        tenantId, 
        visitorId: data.visitorId, 
        location: data.location 
      });

      return {
        success: true,
        visitor
      };
    } catch (error) {
      logger.error('Check-in processing failed', { tenantId, data }, error as Error);
      return {
        success: false,
        reason: 'Check-in processing error'
      };
    }
  }

  async processCheckOut(
    tenantId: string,
    data: CheckOutData,
    performedBy?: string
  ): Promise<{ success: boolean; visitor?: any; reason?: string }> {
    try {
      // Perform check-out using visitor service
      const visitor = await visitorService.checkOutVisitor(tenantId, {
        visitorId: data.visitorId,
        checkOutLocation: data.location,
        badgeReturned: data.badgeReturned,
        notes: data.notes
      });

      // Log successful check-out
      await this.logVisitorAction(
        tenantId,
        data.visitorId,
        VisitorAction.CHECKED_OUT,
        performedBy,
        data.notes || 'Checked out',
        data.location
      );

      // Handle feedback and rating
      if (data.feedback || data.rating) {
        await this.recordVisitorFeedback(
          tenantId,
          data.visitorId,
          data.feedback,
          data.rating
        );
      }

      logger.info('Visitor checked out successfully', { 
        tenantId, 
        visitorId: data.visitorId, 
        location: data.location 
      });

      return {
        success: true,
        visitor
      };
    } catch (error) {
      logger.error('Check-out processing failed', { tenantId, data }, error as Error);
      return {
        success: false,
        reason: 'Check-out processing error'
      };
    }
  }

  // ============================================================================
  // ACCESS POLICY MANAGEMENT
  // ============================================================================

  private async checkZoneAccess(
    tenantId: string,
    allowedZones: string[],
    requestedLocation?: string
  ): Promise<boolean> {
    if (!requestedLocation || allowedZones.length === 0) {
      return true; // No restrictions
    }

    // Check if requested location is in allowed zones
    return allowedZones.some(zone => 
      requestedLocation.toLowerCase().includes(zone.toLowerCase())
    );
  }

  private async checkVisitorPolicies(
    tenantId: string,
    visitor: any,
    attempt: AccessAttempt
  ): Promise<{ allowed: boolean; reason?: string; restrictions?: any }> {
    try {
      // Get active visitor policies
      const policies = await prisma.visitorPolicy.findMany({
        where: {
          tenantId,
          isActive: true
        },
        orderBy: { priority: 'desc' }
      });

      for (const policy of policies) {
        // Check if visitor requires approval
        if (policy.requiresApproval && visitor.status === VisitorStatus.PENDING) {
          return {
            allowed: false,
            reason: 'Visitor requires approval'
          };
        }

        // Check if pre-registration is required
        if (policy.requiresPreRegistration && !visitor.isPreRegistered) {
          return {
            allowed: false,
            reason: 'Pre-registration required'
          };
        }

        // Check maximum duration
        const now = new Date();
        const visitDuration = (now.getTime() - visitor.validFrom.getTime()) / (1000 * 60);
        if (visitDuration > policy.maxDuration) {
          return {
            allowed: false,
            reason: 'Maximum visit duration exceeded'
          };
        }

        // Check if escort is required
        if (policy.requiresEscort && !attempt.userId) {
          return {
            allowed: false,
            reason: 'Escort required for this visitor'
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Policy check failed', { tenantId, visitorId: visitor.id }, error as Error);
      return {
        allowed: false,
        reason: 'Policy verification error'
      };
    }
  }

  // ============================================================================
  // VIOLATION HANDLING
  // ============================================================================

  private async handleAccessViolation(
    tenantId: string,
    attempt: AccessAttempt,
    result: AccessResult
  ): Promise<void> {
    try {
      let violationType: ViolationType;
      let severity: ViolationSeverity = ViolationSeverity.LOW;

      // Determine violation type and severity
      switch (result.result) {
        case ScanResult.EXPIRED:
          violationType = ViolationType.EXPIRED_MEMBERSHIP;
          severity = ViolationSeverity.MEDIUM;
          break;
        case ScanResult.INVALID:
          violationType = ViolationType.INVALID_CREDENTIALS;
          severity = ViolationSeverity.HIGH;
          break;
        case ScanResult.RESTRICTED:
          violationType = ViolationType.UNAUTHORIZED_ACCESS;
          severity = ViolationSeverity.HIGH;
          break;
        case ScanResult.CAPACITY_FULL:
          violationType = ViolationType.CAPACITY_EXCEEDED;
          severity = ViolationSeverity.LOW;
          break;
        case ScanResult.VIOLATION:
          violationType = ViolationType.MULTIPLE_ENTRIES;
          severity = ViolationSeverity.CRITICAL;
          break;
        default:
          violationType = ViolationType.INVALID_CREDENTIALS;
          severity = ViolationSeverity.MEDIUM;
      }

      // Create violation record
      await prisma.accessViolation.create({
        data: {
          tenantId,
          userId: attempt.userId,
          visitorId: attempt.visitorId,
          ruleId: 'default', // TODO: Link to specific rule
          violationType,
          description: result.reason || 'Access denied',
          severity,
          location: attempt.location,
          metadata: {
            accessType: attempt.accessType,
            accessData: attempt.accessData,
            ipAddress: attempt.ipAddress,
            userAgent: attempt.userAgent,
            timestamp: new Date().toISOString()
          }
        }
      });

      logger.warn('Access violation recorded', { 
        tenantId, 
        violationType, 
        severity, 
        location: attempt.location 
      });
    } catch (error) {
      logger.error('Failed to handle access violation', { tenantId, attempt }, error as Error);
    }
  }

  // ============================================================================
  // LOGGING AND AUDIT
  // ============================================================================

  private async logAccessAttempt(
    tenantId: string,
    attempt: AccessAttempt,
    result: AccessResult
  ): Promise<void> {
    try {
      await prisma.accessLog.create({
        data: {
          tenantId,
          userId: attempt.userId,
          visitorId: attempt.visitorId,
          action: result.accessGranted ? AccessAction.ENTRY : AccessAction.ACCESS_DENIED,
          location: attempt.location,
          metadata: {
            accessType: attempt.accessType,
            accessData: attempt.accessData,
            result: result.result,
            reason: result.reason,
            ipAddress: attempt.ipAddress,
            userAgent: attempt.userAgent,
            deviceInfo: attempt.deviceInfo
          }
        }
      });
    } catch (error) {
      logger.error('Failed to log access attempt', { tenantId, attempt }, error as Error);
    }
  }

  private async logVisitorAction(
    tenantId: string,
    visitorId: string,
    action: VisitorAction,
    performedBy?: string,
    details?: string,
    location?: string
  ): Promise<void> {
    try {
      await prisma.visitorLog.create({
        data: {
          tenantId,
          visitorId,
          action,
          performedBy,
          details,
          location,
          metadata: {
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      logger.error('Failed to log visitor action', { 
        tenantId, 
        visitorId, 
        action 
      }, error as Error);
    }
  }

  private async recordVisitorFeedback(
    tenantId: string,
    visitorId: string,
    feedback?: string,
    rating?: number
  ): Promise<void> {
    try {
      // Store feedback in visitor logs
      await prisma.visitorLog.create({
        data: {
          tenantId,
          visitorId,
          action: VisitorAction.CHECKED_OUT,
          details: 'Visitor feedback recorded',
          metadata: {
            feedback,
            rating,
            timestamp: new Date().toISOString()
          }
        }
      });

      logger.info('Visitor feedback recorded', { 
        tenantId, 
        visitorId, 
        rating 
      });
    } catch (error) {
      logger.error('Failed to record visitor feedback', { 
        tenantId, 
        visitorId 
      }, error as Error);
    }
  }

  // ============================================================================
  // SYSTEM INTEGRATION
  // ============================================================================

  async syncWithAccessControlSystem(
    tenantId: string,
    systemType: 'CARD_READER' | 'TURNSTILE' | 'DOOR_LOCK' | 'GATE',
    deviceId: string,
    eventData: any
  ): Promise<{ success: boolean; action?: string; reason?: string }> {
    try {
      // This is where you would integrate with physical access control systems
      // For now, we'll simulate the integration
      
      logger.info('Access control system sync', { 
        tenantId, 
        systemType, 
        deviceId, 
        eventData 
      });

      // Parse event data and create appropriate access attempt
      const accessAttempt: AccessAttempt = {
        tenantId,
        accessType: this.mapSystemEventToAccessType(eventData),
        accessData: eventData.credential || eventData.code || eventData.badge,
        location: eventData.location || `Device ${deviceId}`,
        accessPoint: deviceId,
        deviceInfo: {
          systemType,
          deviceId,
          timestamp: eventData.timestamp
        }
      };

      // Verify access
      const result = await this.verifyAccess(tenantId, accessAttempt);

      // Send response back to access control system
      const action = result.accessGranted ? 'GRANT_ACCESS' : 'DENY_ACCESS';

      return {
        success: true,
        action,
        reason: result.reason
      };
    } catch (error) {
      logger.error('Access control system sync failed', { 
        tenantId, 
        systemType, 
        deviceId 
      }, error as Error);
      
      return {
        success: false,
        reason: 'System sync error'
      };
    }
  }

  private mapSystemEventToAccessType(eventData: any): 'QR_CODE' | 'ACCESS_CODE' | 'BADGE' | 'MANUAL' {
    if (eventData.qrCode) return 'QR_CODE';
    if (eventData.accessCode || eventData.pin) return 'ACCESS_CODE';
    if (eventData.badge || eventData.card) return 'BADGE';
    return 'MANUAL';
  }

  // ============================================================================
  // ANALYTICS AND REPORTING
  // ============================================================================

  async getAccessControlMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalAttempts: number;
    successfulAccess: number;
    deniedAccess: number;
    violations: number;
    averageAccessTime: number;
    peakAccessHours: Array<{ hour: number; count: number }>;
    accessByType: Array<{ type: string; count: number }>;
    violationsByType: Array<{ type: ViolationType; count: number; severity: ViolationSeverity }>;
  }> {
    try {
      // Get access logs
      const accessLogs = await prisma.accessLog.findMany({
        where: {
          tenantId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Get violations
      const violations = await prisma.accessViolation.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalAttempts = accessLogs.length;
      const successfulAccess = accessLogs.filter(log => 
        log.action === AccessAction.ENTRY
      ).length;
      const deniedAccess = totalAttempts - successfulAccess;

      // Calculate peak hours
      const hourCounts = new Array(24).fill(0);
      accessLogs.forEach(log => {
        const hour = log.timestamp.getHours();
        hourCounts[hour]++;
      });

      const peakAccessHours = hourCounts
        .map((count, hour) => ({ hour, count }))
        .filter(h => h.count > 0)
        .sort((a, b) => b.count - a.count);

      // Group by access type
      const accessByType = new Map<string, number>();
      accessLogs.forEach(log => {
        const metadata = log.metadata as any;
        const type = metadata?.accessType || 'UNKNOWN';
        accessByType.set(type, (accessByType.get(type) || 0) + 1);
      });

      // Group violations by type
      const violationsByType = new Map<ViolationType, { count: number; severity: ViolationSeverity }>();
      violations.forEach(violation => {
        const existing = violationsByType.get(violation.violationType) || { count: 0, severity: violation.severity };
        existing.count++;
        violationsByType.set(violation.violationType, existing);
      });

      return {
        totalAttempts,
        successfulAccess,
        deniedAccess,
        violations: violations.length,
        averageAccessTime: 0, // TODO: Calculate from device integration
        peakAccessHours,
        accessByType: Array.from(accessByType.entries()).map(([type, count]) => ({ type, count })),
        violationsByType: Array.from(violationsByType.entries()).map(([type, data]) => ({ 
          type, 
          count: data.count, 
          severity: data.severity 
        }))
      };
    } catch (error) {
      logger.error('Failed to get access control metrics', { 
        tenantId, 
        startDate, 
        endDate 
      }, error as Error);
      throw error;
    }
  }
}

export const accessControlIntegrationService = new AccessControlIntegrationService();