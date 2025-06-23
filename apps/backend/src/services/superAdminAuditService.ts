import { AuditAction } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../types/api';

export interface SuperAdminAuditEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string | null;
  targetTenantId: string | null;
  details: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: Date;
}

export interface SecurityAlert {
  id: string;
  type: 'SUSPICIOUS_ACTIVITY' | 'MULTIPLE_FAILURES' | 'UNUSUAL_ACCESS' | 'PRIVILEGE_ESCALATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  details: Record<string, any>;
  affectedUser?: string;
  affectedTenant?: string;
  actionRequired: boolean;
  createdAt: Date;
}

export interface AuditStats {
  totalActions: number;
  todayActions: number;
  uniqueUsers: number;
  affectedTenants: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userEmail: string; count: number }>;
  securityAlerts: SecurityAlert[];
  riskScore: number;
}

/**
 * Super Admin Audit Service
 * Enhanced audit logging specifically for Super Admin operations
 */
export class SuperAdminAuditService {
  /**
   * Log a Super Admin action with enhanced security tracking
   */
  static async logSuperAdminAction(
    req: AuthenticatedRequest,
    action: string,
    resource: string,
    resourceId?: string,
    targetTenantId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      console.warn('Attempted to log Super Admin action from non-Super Admin user');
      return;
    }

    try {
      const severity = this.calculateActionSeverity(action, details);
      
      console.log('🔒 Logging Super Admin action:', {
        action,
        resource,
        user: req.user.email,
        severity,
        targetTenant: targetTenantId
      });

      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          tenantId: req.user.tenantId || 'SUPER_ADMIN',
          userId: req.user.id,
          action: action as AuditAction,
          entityType: resource,
          entityId: resourceId,
          details: {
            superAdminAction: true,
            targetTenantId,
            userEmail: req.user.email,
            severity,
            timestamp: new Date().toISOString(),
            ...details,
          },
          ipAddress: req.ip || req.socket?.remoteAddress,
          userAgent: req.headers['user-agent'],
          requestId: req.headers['x-request-id'] as string,
        }
      });

      // Check for security patterns after logging
      await this.checkSecurityPatterns(req.user.id, action);

    } catch (error) {
      console.error('Failed to log Super Admin action:', error);
      // Don't throw to avoid breaking main operation
    }
  }

  /**
   * Calculate severity based on action type
   */
  private static calculateActionSeverity(
    action: string, 
    details?: Record<string, any>
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalActions = [
      'SUPER_ADMIN_DELETE_COWORK',
      'SUPER_ADMIN_SUSPEND_COWORK', 
      'SUPER_ADMIN_BULK_DELETE',
      'SUPER_ADMIN_SYSTEM_CONFIG_CHANGE'
    ];

    const highActions = [
      'SUPER_ADMIN_CREATE_COWORK',
      'SUPER_ADMIN_UPDATE_COWORK',
      'SUPER_ADMIN_ACTIVATE_COWORK',
      'SUPER_ADMIN_ACCESS_USER_DATA'
    ];

    const mediumActions = [
      'SUPER_ADMIN_VIEW_COWORK',
      'SUPER_ADMIN_EXPORT_DATA',
      'SUPER_ADMIN_VIEW_ANALYTICS'
    ];

    if (criticalActions.includes(action)) return 'CRITICAL';
    if (highActions.includes(action)) return 'HIGH';
    if (mediumActions.includes(action)) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Check for suspicious security patterns
   */
  private static async checkSecurityPatterns(userId: string, currentAction: string): Promise<void> {
    try {
      const lastHour = new Date();
      lastHour.setHours(lastHour.getHours() - 1);

      // Check for rapid successive actions
      const recentActions = await prisma.auditLog.count({
        where: {
          userId,
          timestamp: { gte: lastHour },
          details: { path: ['superAdminAction'], equals: true }
        }
      });

      // Alert if more than 20 actions in an hour
      if (recentActions > 20) {
        await this.createSecurityAlert({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          title: 'Rapid Super Admin Activity',
          message: `User performed ${recentActions} Super Admin actions in the last hour`,
          details: { actionCount: recentActions, timeframe: '1 hour', lastAction: currentAction },
          affectedUser: userId,
          actionRequired: true,
        });
      }

      // Check for unusual time patterns (activity outside business hours)
      const currentHour = new Date().getHours();
      if (currentHour < 6 || currentHour > 22) { // Outside 6 AM - 10 PM
        await this.createSecurityAlert({
          type: 'UNUSUAL_ACCESS',
          severity: 'MEDIUM',
          title: 'Off-Hours Super Admin Activity',
          message: `Super Admin activity detected at ${new Date().toLocaleTimeString()}`,
          details: { hour: currentHour, action: currentAction },
          affectedUser: userId,
          actionRequired: false,
        });
      }

    } catch (error) {
      console.error('Error checking security patterns:', error);
    }
  }

  /**
   * Create a security alert
   */
  private static async createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'createdAt'>): Promise<void> {
    try {
      // For now, we'll log to audit system. In production, this could trigger notifications
      await prisma.auditLog.create({
        data: {
          tenantId: 'SECURITY_SYSTEM',
          action: 'SECURITY_ALERT' as AuditAction,
          entityType: 'SecurityAlert',
          details: {
            alertType: alert.type,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            details: alert.details,
            affectedUser: alert.affectedUser,
            affectedTenant: alert.affectedTenant,
            actionRequired: alert.actionRequired,
          },
          timestamp: new Date(),
        }
      });

      console.log(`🚨 Security Alert Created: ${alert.severity} - ${alert.title}`);
    } catch (error) {
      console.error('Failed to create security alert:', error);
    }
  }

  /**
   * Get comprehensive Super Admin audit statistics
   */
  static async getAuditStats(days: number = 30): Promise<AuditStats> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      console.log(`Getting Super Admin audit stats for last ${days} days...`);

      // Get basic counts
      const [totalActions, todayActions] = await Promise.all([
        prisma.auditLog.count({
          where: {
            timestamp: { gte: startDate },
            details: { path: ['superAdminAction'], equals: true }
          }
        }),
        prisma.auditLog.count({
          where: {
            timestamp: { gte: today },
            details: { path: ['superAdminAction'], equals: true }
          }
        })
      ]);

      // Get unique users and affected tenants
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          timestamp: { gte: startDate },
          details: { path: ['superAdminAction'], equals: true }
        },
        select: {
          details: true,
          action: true,
          user: { select: { email: true } }
        }
      });

      const uniqueUsers = new Set(auditLogs.map(log => {
        const details = log.details as any;
        return details?.userEmail;
      }).filter(Boolean)).size;
      
      const affectedTenants = new Set(
        auditLogs.map(log => {
          const details = log.details as any;
          return details?.targetTenantId;
        }).filter(Boolean)
      ).size;

      // Get top actions
      const actionCounts: Record<string, number> = {};
      auditLogs.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get top users
      const userCounts: Record<string, number> = {};
      auditLogs.forEach(log => {
        const details = log.details as any;
        const email = details?.userEmail;
        if (email) {
          userCounts[email] = (userCounts[email] || 0) + 1;
        }
      });

      const topUsers = Object.entries(userCounts)
        .map(([userEmail, count]) => ({ userEmail, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get recent security alerts
      const securityAlerts = await this.getSecurityAlerts(7);

      // Calculate risk score (0-100)
      const riskScore = this.calculateRiskScore({
        totalActions,
        todayActions,
        securityAlerts,
        days
      });

      return {
        totalActions,
        todayActions,
        uniqueUsers,
        affectedTenants,
        topActions,
        topUsers,
        securityAlerts,
        riskScore,
      };

    } catch (error) {
      console.error('Error getting audit stats:', error);
      throw new Error('Failed to get audit statistics');
    }
  }

  /**
   * Get security alerts from the last N days
   */
  static async getSecurityAlerts(days: number = 7): Promise<SecurityAlert[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const alertLogs = await prisma.auditLog.findMany({
        where: {
          timestamp: { gte: startDate },
          action: 'SECURITY_ALERT' as AuditAction,
          entityType: 'SecurityAlert'
        },
        orderBy: { timestamp: 'desc' },
        take: 50
      });

      return alertLogs.map(log => {
        const details = log.details as any;
        return {
          id: log.id,
          type: details?.alertType || 'SUSPICIOUS_ACTIVITY',
          severity: details?.severity || 'MEDIUM',
          title: details?.title || 'Security Alert',
          message: details?.message || 'Security event detected',
          details: details?.details || {},
          affectedUser: details?.affectedUser,
          affectedTenant: details?.affectedTenant,
          actionRequired: details?.actionRequired || false,
          createdAt: log.timestamp,
        };
      });

    } catch (error) {
      console.error('Error getting security alerts:', error);
      return [];
    }
  }

  /**
   * Calculate system risk score based on activity patterns
   */
  private static calculateRiskScore(data: {
    totalActions: number;
    todayActions: number;
    securityAlerts: SecurityAlert[];
    days: number;
  }): number {
    let score = 0;

    // Base score from activity volume
    const avgDailyActions = data.totalActions / data.days;
    if (data.todayActions > avgDailyActions * 2) score += 20; // High activity today
    if (data.todayActions > avgDailyActions * 3) score += 20; // Very high activity

    // Score from security alerts
    data.securityAlerts.forEach(alert => {
      switch (alert.severity) {
        case 'CRITICAL': score += 25; break;
        case 'HIGH': score += 15; break;
        case 'MEDIUM': score += 8; break;
        case 'LOW': score += 3; break;
      }
    });

    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Get detailed audit trail for a specific resource
   */
  static async getResourceAuditTrail(
    resourceType: string,
    resourceId: string,
    limit: number = 100
  ): Promise<SuperAdminAuditEntry[]> {
    try {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: resourceType,
          entityId: resourceId,
          details: { path: ['superAdminAction'], equals: true }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: limit
      });

      return auditLogs.map(log => {
        const details = log.details as any;
        return {
          id: log.id,
          userId: log.userId || '',
          userEmail: log.user?.email || 'Unknown',
          action: log.action,
          resource: log.entityType,
          resourceId: log.entityId,
          targetTenantId: details?.targetTenantId,
          details: (details || {}) as Record<string, any>,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          severity: details?.severity || 'LOW',
          createdAt: log.timestamp,
        };
      });

    } catch (error) {
      console.error('Error getting resource audit trail:', error);
      throw new Error('Failed to get audit trail');
    }
  }

  /**
   * Export audit logs for compliance
   */
  static async exportAuditLogs(
    startDate: Date,
    endDate: Date,
    format: 'JSON' | 'CSV' = 'JSON'
  ): Promise<string> {
    try {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          details: { path: ['superAdminAction'], equals: true }
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      if (format === 'CSV') {
        return this.formatAsCSV(auditLogs);
      } else {
        return JSON.stringify(auditLogs, null, 2);
      }

    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw new Error('Failed to export audit logs');
    }
  }

  /**
   * Format audit logs as CSV
   */
  private static formatAsCSV(logs: any[]): string {
    const headers = [
      'Timestamp',
      'User',
      'Action',
      'Resource',
      'Resource ID',
      'Target Tenant',
      'Severity',
      'IP Address',
      'Details'
    ];

    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})` : 'Unknown',
      log.action,
      log.entityType,
      log.entityId || '',
      log.details?.targetTenantId || '',
      log.details?.severity || 'LOW',
      log.ipAddress || '',
      JSON.stringify(log.details || {})
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }
}

// Define Super Admin specific audit actions
export const SUPER_ADMIN_ACTIONS = {
  // Cowork Management
  CREATE_COWORK: 'SUPER_ADMIN_CREATE_COWORK',
  UPDATE_COWORK: 'SUPER_ADMIN_UPDATE_COWORK',
  SUSPEND_COWORK: 'SUPER_ADMIN_SUSPEND_COWORK',
  ACTIVATE_COWORK: 'SUPER_ADMIN_ACTIVATE_COWORK',
  DELETE_COWORK: 'SUPER_ADMIN_DELETE_COWORK',

  // Data Access
  VIEW_COWORK_USERS: 'SUPER_ADMIN_VIEW_COWORK_USERS',
  VIEW_COWORK_CLIENTS: 'SUPER_ADMIN_VIEW_COWORK_CLIENTS',
  ACCESS_BILLING_DATA: 'SUPER_ADMIN_ACCESS_BILLING_DATA',
  VIEW_ANALYTICS: 'SUPER_ADMIN_VIEW_ANALYTICS',

  // System Operations
  EXPORT_DATA: 'SUPER_ADMIN_EXPORT_DATA',
  GENERATE_REPORT: 'SUPER_ADMIN_GENERATE_REPORT',
  SYSTEM_CONFIG_CHANGE: 'SUPER_ADMIN_SYSTEM_CONFIG_CHANGE',
  BULK_OPERATION: 'SUPER_ADMIN_BULK_OPERATION',

  // Security
  VIEW_AUDIT_LOGS: 'SUPER_ADMIN_VIEW_AUDIT_LOGS',
  SECURITY_SCAN: 'SUPER_ADMIN_SECURITY_SCAN',
  ACCESS_SENSITIVE_DATA: 'SUPER_ADMIN_ACCESS_SENSITIVE_DATA',
} as const;