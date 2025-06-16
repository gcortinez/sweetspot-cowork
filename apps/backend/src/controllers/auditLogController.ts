import { Response } from "express";
import { z } from "zod";
import { auditLogService } from "../services/auditLogService";
import { ResponseHelper } from "../utils/response";
import { ApiResponse, AuthenticatedRequest, ErrorCode } from "../types/api";
import { ValidationError } from "../utils/errors";
import { AuditAction } from "@prisma/client";
import { handleController } from "../utils/response";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const QueryAuditLogsSchema = z.object({
  userId: z.string().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  ipAddress: z.string().optional(),
  page: z.string().transform(Number).optional().default("1"),
  limit: z.string().transform(Number).optional().default("50"),
});

const ExportAuditLogsSchema = z.object({
  startDate: z.string().transform((date) => new Date(date)),
  endDate: z.string().transform((date) => new Date(date)),
  action: z.nativeEnum(AuditAction).optional(),
  entityType: z.string().optional(),
  format: z.enum(["json", "csv"]).optional().default("json"),
});

const StatisticsQuerySchema = z.object({
  startDate: z
    .string()
    .transform((date) => new Date(date))
    .optional(),
  endDate: z
    .string()
    .transform((date) => new Date(date))
    .optional(),
});

const cleanupLogsSchema = z.object({
  olderThanDays: z.number().positive().min(30).default(365),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getTenantId = (req: AuthenticatedRequest): string => {
  if (!req.user?.tenantId) {
    throw new ValidationError("Tenant context required");
  }
  return req.user.tenantId;
};

const requireAdminRole = (req: AuthenticatedRequest): void => {
  if (
    !req.user?.role ||
    !["SUPER_ADMIN", "COWORK_ADMIN"].includes(req.user.role)
  ) {
    throw new ValidationError("Admin access required");
  }
};

// ============================================================================
// AUDIT LOG CONTROLLERS
// ============================================================================

/**
 * Query audit logs with filters
 * GET /api/security/audit-logs
 */
export const getAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const query = QueryAuditLogsSchema.parse(req.query);
    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;

    const logs = await auditLogService.query({
      tenantId,
      userId: query.userId,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      ipAddress: query.ipAddress,
      limit,
      offset,
    });

    // Get total count for pagination
    const totalCount = await auditLogService
      .query({
        tenantId,
        userId: query.userId,
        action: query.action,
        entityType: query.entityType,
        entityId: query.entityId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        ipAddress: query.ipAddress,
        limit: undefined,
        offset: undefined,
      })
      .then((results) => results.length);

    return {
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }, res);
};

/**
 * Get audit log statistics
 * GET /api/security/audit-logs/statistics
 */
export const getAuditLogStatistics = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const query = StatisticsQuerySchema.parse(req.query);

    const statistics = await auditLogService.getStatistics(
      tenantId,
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined
    );

    return {
      success: true,
      data: statistics,
    };
  }, res);
};

/**
 * Export audit logs for compliance
 * POST /api/security/audit-logs/export
 */
export const exportAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const query = QueryAuditLogsSchema.parse(req.query);

    const exportData = await auditLogService.exportLogs({
      tenantId,
      userId: query.userId,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      ipAddress: query.ipAddress,
    });

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="audit-logs-${
        new Date().toISOString().split("T")[0]
      }.csv"`
    );

    // Convert to CSV format
    const headers = [
      "ID",
      "Timestamp",
      "User",
      "Action",
      "Entity Type",
      "Entity ID",
      "IP Address",
      "Details",
    ];
    const csvRows = [headers.join(",")];

    exportData.forEach((log) => {
      const row = [
        log.id,
        log.timestamp,
        log.user,
        log.action,
        log.entityType,
        log.entityId || "",
        log.ipAddress || "",
        JSON.stringify(log.details || {}),
      ];
      csvRows.push(
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
      );
    });

    return csvRows.join("\n");
  }, res);
};

/**
 * Get audit logs for a specific user
 * GET /api/security/audit-logs/user/:userId
 */
export const getUserAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const { userId } = req.params;
    const query = QueryAuditLogsSchema.parse(req.query);
    const offset = (query.page - 1) * query.limit;

    const logs = await auditLogService.query({
      tenantId,
      userId,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      ipAddress: query.ipAddress,
      limit: query.limit,
      offset,
    });

    return {
      success: true,
      data: logs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: logs.length,
      },
    };
  }, res);
};

/**
 * Get audit logs for a specific entity
 * GET /api/security/audit-logs/entity/:entityType/:entityId
 */
export const getEntityAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const { entityType, entityId } = req.params;
    const query = QueryAuditLogsSchema.parse(req.query);
    const offset = (query.page - 1) * query.limit;

    const logs = await auditLogService.query({
      tenantId,
      entityType,
      entityId,
      action: query.action,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      ipAddress: query.ipAddress,
      limit: query.limit,
      offset,
    });

    return {
      success: true,
      data: logs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: logs.length,
      },
    };
  }, res);
};

/**
 * Get my audit logs (user's own activity)
 * GET /api/security/audit-logs/my-activity
 */
export const getMyAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;

    const query = QueryAuditLogsSchema.parse(req.query);
    const offset = (query.page - 1) * query.limit;

    const logs = await auditLogService.query({
      tenantId,
      userId,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      ipAddress: query.ipAddress,
      limit: query.limit,
      offset,
    });

    return {
      success: true,
      data: logs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: logs.length,
      },
    };
  }, res);
};

/**
 * Clean up old audit logs (admin only)
 * DELETE /api/security/audit-logs/cleanup
 */
export const cleanupAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);

    // Only super admins can clean up logs
    if (req.user?.role !== "SUPER_ADMIN") {
      throw new ValidationError("Super admin access required");
    }

    const validatedData = cleanupLogsSchema.parse(req.body);

    const deletedCount = await auditLogService.cleanupOldLogs(
      tenantId,
      validatedData.olderThanDays
    );

    // Log the cleanup action itself
    await auditLogService.logSecurityEvent(
      tenantId,
      req.user.id,
      "DELETE",
      `Cleaned up ${deletedCount} audit logs older than ${validatedData.olderThanDays} days`,
      req.ip,
      req.get("user-agent")
    );

    return {
      success: true,
      deletedCount,
      message: `Successfully cleaned up ${deletedCount} audit logs`,
    };
  }, res);
};

/**
 * Get recent security events
 * GET /api/audit-logs/security-events
 */
export const getSecurityEvents = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);

    // Only admins can view security events
    if (req.user.role !== "COWORK_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      throw new ValidationError("Insufficient permissions");
    }

    const query = QueryAuditLogsSchema.parse(req.query);
    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;

    // Query security-related events
    const securityLogs = await auditLogService.query({
      tenantId,
      entityType: "Security",
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit,
      offset,
    });

    // Also get authentication events
    const authLogs = await auditLogService.query({
      tenantId,
      entityType: "Authentication",
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit,
      offset,
    });

    const allSecurityEvents = [...securityLogs, ...authLogs]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    return {
      success: true,
      data: allSecurityEvents,
      pagination: {
        page,
        limit,
        total: allSecurityEvents.length,
      },
    };
  }, res);
};
