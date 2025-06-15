import { SecurityEventType, SecuritySeverity } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface SecurityEventData {
  tenantId: string;
  eventType: SecurityEventType;
  severity?: SecuritySeverity;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  performedById?: string;
  targetUserId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface SecurityEventQuery {
  tenantId: string;
  eventType?: SecurityEventType;
  severity?: SecuritySeverity;
  resolved?: boolean;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  performedById?: string;
  targetUserId?: string;
  limit?: number;
  offset?: number;
}

export class SecurityEventService {
  /**
   * Log a security event
   */
  async logEvent(data: SecurityEventData) {
    try {
      return await prisma.securityEvent.create({
        data: {
          tenantId: data.tenantId,
          eventType: data.eventType,
          severity: data.severity || SecuritySeverity.LOW,
          source: data.source,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          performedById: data.performedById,
          targetUserId: data.targetUserId,
          description: data.description,
          metadata: data.metadata || {},
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
      throw error;
    }
  }

  /**
   * Query security events
   */
  async query(params: SecurityEventQuery) {
    const where: any = {
      tenantId: params.tenantId
    };

    if (params.eventType) where.eventType = params.eventType;
    if (params.severity) where.severity = params.severity;
    if (params.resolved !== undefined) where.resolved = params.resolved;
    if (params.ipAddress) where.ipAddress = params.ipAddress;
    if (params.performedById) where.performedById = params.performedById;
    if (params.targetUserId) where.targetUserId = params.targetUserId;

    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) where.timestamp.gte = params.startDate;
      if (params.endDate) where.timestamp.lte = params.endDate;
    }

    return await prisma.securityEvent.findMany({
      where,
      include: {
        performedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        targetUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: params.limit || 100,
      skip: params.offset || 0
    });
  }

  /**
   * Resolve a security event
   */
  async resolveEvent(eventId: string, resolvedBy: string, tenantId: string) {
    return await prisma.securityEvent.update({
      where: { id: eventId, tenantId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy
      }
    });
  }

  /**
   * Get security event statistics
   */
  async getStatistics(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [
      totalEvents,
      unresolvedEvents,
      severityStats,
      typeStats,
      recentCritical
    ] = await Promise.all([
      // Total events
      prisma.securityEvent.count({ where }),
      
      // Unresolved events
      prisma.securityEvent.count({ 
        where: { ...where, resolved: false } 
      }),
      
      // Severity breakdown
      prisma.securityEvent.groupBy({
        by: ['severity'],
        where,
        _count: { severity: true }
      }),
      
      // Event type breakdown
      prisma.securityEvent.groupBy({
        by: ['eventType'],
        where,
        _count: { eventType: true },
        orderBy: { _count: { eventType: 'desc' } }
      }),
      
      // Recent critical events
      prisma.securityEvent.findMany({
        where: {
          ...where,
          severity: SecuritySeverity.CRITICAL,
          resolved: false
        },
        take: 10,
        orderBy: { timestamp: 'desc' }
      })
    ]);

    return {
      totalEvents,
      unresolvedEvents,
      severityStats: severityStats.map(stat => ({
        severity: stat.severity,
        count: stat._count.severity
      })),
      typeStats: typeStats.map(stat => ({
        eventType: stat.eventType,
        count: stat._count.eventType
      })),
      recentCritical
    };
  }

  /**
   * Log failed login attempts
   */
  async logFailedLogin(
    tenantId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ) {
    return await this.logEvent({
      tenantId,
      eventType: SecurityEventType.FAILED_LOGIN,
      severity: SecuritySeverity.LOW,
      source: 'authentication',
      ipAddress,
      userAgent,
      description: `Failed login attempt for email: ${email}`,
      metadata: { email, reason }
    });
  }

  /**
   * Log multiple failed login attempts (brute force detection)
   */
  async logMultipleFailedLogins(
    tenantId: string,
    email: string,
    attemptCount: number,
    ipAddress?: string,
    userAgent?: string
  ) {
    const severity = attemptCount >= 10 ? SecuritySeverity.HIGH : 
                    attemptCount >= 5 ? SecuritySeverity.MEDIUM : SecuritySeverity.LOW;

    return await this.logEvent({
      tenantId,
      eventType: SecurityEventType.MULTIPLE_FAILED_LOGINS,
      severity,
      source: 'authentication',
      ipAddress,
      userAgent,
      description: `${attemptCount} failed login attempts for email: ${email}`,
      metadata: { email, attemptCount }
    });
  }

  /**
   * Log successful login
   */
  async logSuccessfulLogin(
    tenantId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    loginMethod?: string
  ) {
    return await this.logEvent({
      tenantId,
      eventType: SecurityEventType.SUCCESSFUL_LOGIN,
      severity: SecuritySeverity.LOW,
      source: 'authentication',
      performedById: userId,
      ipAddress,
      userAgent,
      description: 'Successful user login',
      metadata: { loginMethod }
    });
  }

  /**
   * Log suspicious login (unusual location, time, etc.)
   */
  async logSuspiciousLogin(
    tenantId: string,
    userId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ) {
    return await this.logEvent({
      tenantId,
      eventType: SecurityEventType.SUSPICIOUS_LOGIN,
      severity: SecuritySeverity.MEDIUM,
      source: 'authentication',
      performedById: userId,
      ipAddress,
      userAgent,
      description: `Suspicious login detected: ${reason}`,
      metadata
    });
  }

  /**
   * Log unauthorized access attempts
   */
  async logUnauthorizedAccess(
    tenantId: string,
    resource: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.logEvent({
      tenantId,
      eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
      severity: SecuritySeverity.MEDIUM,
      source: 'authorization',
      performedById: userId,
      ipAddress,
      userAgent,
      description: `Unauthorized access attempt to: ${resource}`,
      metadata: { resource }
    });
  }

  /**
   * Log privilege escalation attempts
   */
  async logPrivilegeEscalation(
    tenantId: string,
    userId: string,
    attemptedAction: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    return await this.logEvent({
      tenantId,
      eventType: SecurityEventType.PRIVILEGE_ESCALATION,
      severity: SecuritySeverity.HIGH,
      source: 'authorization',
      performedById: userId,
      ipAddress,
      userAgent,
      description: `Privilege escalation attempt: ${attemptedAction}`,
      metadata: { attemptedAction }
    });
  }

  /**
   * Log data export events
   */
  async logDataExport(
    tenantId: string,
    userId: string,
    dataType: string,
    recordCount: number,
    ipAddress?: string,
    userAgent?: string
  ) {
    const severity = recordCount > 1000 ? SecuritySeverity.MEDIUM : SecuritySeverity.LOW;

    return await this.logEvent({
      tenantId,
      eventType: SecurityEventType.DATA_EXPORT,
      severity,
      source: 'data_access',
      performedById: userId,
      ipAddress,
      userAgent,
      description: `Data export: ${dataType} (${recordCount} records)`,
      metadata: { dataType, recordCount }
    });
  }

  /**
   * Log rate limit exceeded events
   */
  async logRateLimitExceeded(
    tenantId: string,
    endpoint: string,
    ipAddress?: string,
    userAgent?: string,
    userId?: string
  ) {
    return await this.logEvent({
      tenantId,
      eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: SecuritySeverity.LOW,
      source: 'rate_limiting',
      performedById: userId,
      ipAddress,
      userAgent,
      description: `Rate limit exceeded for endpoint: ${endpoint}`,
      metadata: { endpoint }
    });
  }

  /**
   * Log admin actions
   */
  async logAdminAction(
    tenantId: string,
    adminUserId: string,
    action: string,
    targetUserId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ) {
    return await this.logEvent({
      tenantId,
      eventType: SecurityEventType.ADMIN_ACTION,
      severity: SecuritySeverity.MEDIUM,
      source: 'administration',
      performedById: adminUserId,
      targetUserId,
      ipAddress,
      userAgent,
      description: `Admin action: ${action}`,
      metadata
    });
  }

  /**
   * Check for patterns that might indicate security threats
   */
  async detectThreats(tenantId: string, lookbackHours: number = 24) {
    const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
    
    const [
      failedLoginsByIP,
      suspiciousActivity,
      privilegeEscalations
    ] = await Promise.all([
      // Failed logins by IP
      prisma.securityEvent.groupBy({
        by: ['ipAddress'],
        where: {
          tenantId,
          eventType: SecurityEventType.FAILED_LOGIN,
          timestamp: { gte: since },
          ipAddress: { not: null }
        },
        _count: { ipAddress: true },
        having: { ipAddress: { _count: { gt: 10 } } }
      }),
      
      // Multiple suspicious activities
      prisma.securityEvent.count({
        where: {
          tenantId,
          eventType: {
            in: [
              SecurityEventType.SUSPICIOUS_LOGIN,
              SecurityEventType.UNAUTHORIZED_ACCESS,
              SecurityEventType.MALICIOUS_REQUEST
            ]
          },
          timestamp: { gte: since }
        }
      }),
      
      // Privilege escalation attempts
      prisma.securityEvent.count({
        where: {
          tenantId,
          eventType: SecurityEventType.PRIVILEGE_ESCALATION,
          timestamp: { gte: since }
        }
      })
    ]);

    const threats = [];

    if (failedLoginsByIP.length > 0) {
      threats.push({
        type: 'brute_force',
        severity: 'HIGH',
        description: `${failedLoginsByIP.length} IP addresses with excessive failed logins`,
        details: failedLoginsByIP
      });
    }

    if (suspiciousActivity > 5) {
      threats.push({
        type: 'suspicious_activity',
        severity: 'MEDIUM',
        description: `${suspiciousActivity} suspicious activities detected`,
        count: suspiciousActivity
      });
    }

    if (privilegeEscalations > 0) {
      threats.push({
        type: 'privilege_escalation',
        severity: 'CRITICAL',
        description: `${privilegeEscalations} privilege escalation attempts`,
        count: privilegeEscalations
      });
    }

    return threats;
  }
}

export const securityEventService = new SecurityEventService();