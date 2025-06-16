import { Response } from 'express';
import { z } from 'zod';
import { auditLogService } from '../services/auditLogService';
import { ResponseHelper } from '../utils/response';
import { ApiResponse, AuthenticatedRequest, ErrorCode } from '../types/api';
import { ValidationError } from '../utils/errors';
import { AuditAction } from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const QueryAuditLogsSchema = z.object({
  userId: z.string().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().transform(date => new Date(date)).optional(),
  endDate: z.string().transform(date => new Date(date)).optional(),
  ipAddress: z.string().optional(),
  limit: z.string().transform(Number).optional().default('100'),
  offset: z.string().transform(Number).optional().default('0')
});

const ExportAuditLogsSchema = z.object({
  startDate: z.string().transform(date => new Date(date)),
  endDate: z.string().transform(date => new Date(date)),
  action: z.nativeEnum(AuditAction).optional(),
  entityType: z.string().optional(),
  format: z.enum(['json', 'csv']).optional().default('json')
});

const StatisticsQuerySchema = z.object({
  startDate: z.string().transform(date => new Date(date)).optional(),
  endDate: z.string().transform(date => new Date(date)).optional()
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getTenantId = (req: AuthenticatedRequest): string => {
  if (!req.user?.tenantId) {
    throw new ValidationError('Tenant context required');
  }
  return req.user.tenantId;
};

const requireAdminRole = (req: AuthenticatedRequest): void => {
  if (!req.user?.role || !['SUPER_ADMIN', 'COWORK_ADMIN'].includes(req.user.role)) {
    throw new ValidationError('Admin access required');
  }
};

// ============================================================================
// AUDIT LOG CONTROLLERS
// ============================================================================

/**
 * Query audit logs with filters
 * GET /api/security/audit-logs
 */
export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    requireAdminRole(req);
    
    const query = QueryAuditLogsSchema.parse(req.query);

    const logs = await auditLogService.query({
      tenantId,
      ...query
    });
    
    return ResponseHelper.success(res, logs, 'Audit logs retrieved successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

/**
 * Get audit log statistics
 * GET /api/security/audit-logs/statistics
 */
export const getAuditLogStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    requireAdminRole(req);
    
    const query = StatisticsQuerySchema.parse(req.query);

    const statistics = await auditLogService.getStatistics(
      tenantId,
      query.startDate,
      query.endDate
    );
    
    return ResponseHelper.success(res, statistics, 'Audit log statistics retrieved');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

/**
 * Export audit logs for compliance
 * POST /api/security/audit-logs/export
 */
export const exportAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    requireAdminRole(req);
    
    const query = ExportAuditLogsSchema.parse(req.body);

    const logs = await auditLogService.exportLogs({
      tenantId,
      startDate: query.startDate,
      endDate: query.endDate,
      action: query.action,
      entityType: query.entityType
    });

    if (query.format === 'csv') {
      // Convert to CSV format
      const headers = [
        'ID', 'Timestamp', 'User', 'Action', 'Entity Type', 
        'Entity ID', 'IP Address', 'Details'
      ];
      
      const csvData = [
        headers.join(','),
        ...logs.map(log => [
          log.id,
          log.timestamp,
          `"${log.user}"`,
          log.action,
          log.entityType,
          log.entityId || '',
          log.ipAddress || '',
          `"${JSON.stringify(log.details).replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 
        `attachment; filename="audit-logs-${Date.now()}.csv"`);
      res.send(csvData);
      return;
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 
        `attachment; filename="audit-logs-${Date.now()}.json"`);
      return ResponseHelper.success(res, logs, 'Audit logs exported successfully');
    }
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

/**
 * Get audit logs for a specific user
 * GET /api/security/audit-logs/user/:userId
 */
export const getUserAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    requireAdminRole(req);
    
    const { userId } = req.params;
    const query = QueryAuditLogsSchema.parse(req.query);

    const logs = await auditLogService.query({
      tenantId,
      userId,
      ...query
    });
    
    return ResponseHelper.success(res, logs, 'User audit logs retrieved successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

/**
 * Get audit logs for a specific entity
 * GET /api/security/audit-logs/entity/:entityType/:entityId
 */
export const getEntityAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    requireAdminRole(req);
    
    const { entityType, entityId } = req.params;
    const query = QueryAuditLogsSchema.parse(req.query);

    const logs = await auditLogService.query({
      tenantId,
      entityType,
      entityId,
      ...query
    });
    
    return ResponseHelper.success(res, logs, 'Entity audit logs retrieved successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

/**
 * Get my audit logs (user's own activity)
 * GET /api/security/audit-logs/my-activity
 */
export const getMyAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    
    const query = QueryAuditLogsSchema.parse(req.query);

    const logs = await auditLogService.query({
      tenantId,
      userId,
      limit: Math.min(query.limit || 50, 100), // Limit to 100 for regular users
      offset: query.offset
    });
    
    return ResponseHelper.success(res, logs, 'Your activity log retrieved successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

/**
 * Clean up old audit logs (admin only)
 * DELETE /api/security/audit-logs/cleanup
 */
export const cleanupAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    
    // Only super admins can clean up logs
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new ValidationError('Super admin access required');
    }
    
    const { olderThanDays } = req.body;
    
    if (!olderThanDays || olderThanDays < 30) {
      throw new ValidationError('Must retain logs for at least 30 days');
    }

    const deletedCount = await auditLogService.cleanupOldLogs(tenantId, olderThanDays);
    
    return ResponseHelper.success(res, {
      deletedCount,
      olderThanDays
    }, `Cleaned up ${deletedCount} old audit logs`);
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};