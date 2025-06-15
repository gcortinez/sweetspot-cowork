import { AuditAction } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface AuditLogData {
  tenantId: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  details?: Record<string, any>;
}

export interface AuditLogQuery {
  tenantId: string;
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

export class AuditLogService {
  /**
   * Log an audit event
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          oldValues: data.oldValues || {},
          newValues: data.newValues || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          requestId: data.requestId,
          details: data.details || {},
          timestamp: new Date()
        }
      });
    } catch (error) {
      // Log errors should not break the main application flow
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Query audit logs with filters
   */
  async query(params: AuditLogQuery) {
    const where: any = {
      tenantId: params.tenantId
    };

    if (params.userId) where.userId = params.userId;
    if (params.action) where.action = params.action;
    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;
    if (params.ipAddress) where.ipAddress = params.ipAddress;

    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) where.timestamp.gte = params.startDate;
      if (params.endDate) where.timestamp.lte = params.endDate;
    }

    return await prisma.auditLog.findMany({
      where,
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
      take: params.limit || 100,
      skip: params.offset || 0
    });
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [
      totalLogs,
      actionStats,
      userStats,
      entityStats
    ] = await Promise.all([
      // Total logs count
      prisma.auditLog.count({ where }),
      
      // Actions breakdown
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } }
      }),
      
      // Top users by activity
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { ...where, userId: { not: null } },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      }),
      
      // Entity types breakdown
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: { entityType: true },
        orderBy: { _count: { entityType: 'desc' } }
      })
    ]);

    return {
      totalLogs,
      actionStats: actionStats.map(stat => ({
        action: stat.action,
        count: stat._count.action
      })),
      userStats: userStats.map(stat => ({
        userId: stat.userId,
        count: stat._count.userId
      })),
      entityStats: entityStats.map(stat => ({
        entityType: stat.entityType,
        count: stat._count.entityType
      }))
    };
  }

  /**
   * Log user authentication events
   */
  async logAuthentication(
    tenantId: string,
    userId: string,
    action: 'LOGIN' | 'LOGOUT',
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ) {
    await this.log({
      tenantId,
      userId,
      action,
      entityType: 'Authentication',
      entityId: userId,
      ipAddress,
      userAgent,
      details
    });
  }

  /**
   * Log data changes with before/after values
   */
  async logDataChange(
    tenantId: string,
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entityType: string,
    entityId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      tenantId,
      userId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log security-sensitive operations
   */
  async logSecurityEvent(
    tenantId: string,
    userId: string,
    action: AuditAction,
    description: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ) {
    await this.log({
      tenantId,
      userId,
      action,
      entityType: 'Security',
      details: {
        description,
        ...metadata
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Clean up old audit logs (for compliance/storage management)
   */
  async cleanupOldLogs(tenantId: string, olderThanDays: number = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        tenantId,
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    return result.count;
  }

  /**
   * Export audit logs for compliance
   */
  async exportLogs(params: AuditLogQuery) {
    const logs = await this.query({
      ...params,
      limit: undefined, // Export all matching logs
      offset: undefined
    });

    return logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      user: log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})` : 'System',
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      oldValues: log.oldValues,
      newValues: log.newValues,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent
    }));
  }
}

export const auditLogService = new AuditLogService();