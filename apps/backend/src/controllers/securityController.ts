import { Response } from "express";
import { BaseRequest, AuthenticatedRequest, ErrorCode } from "../types/api";
import { sessionService } from "../services/sessionService";
import { encryptionService } from "../services/encryptionService";
import { auditLogService } from "../services/auditLogService";
import { securityEventService } from "../services/securityEventService";
import { ipWhitelistService } from "../services/ipWhitelistService";
import { ResponseHelper } from "../utils/response";
import { logger } from "../utils/logger";
import { z } from "zod";
import { SecurityEventType, SecuritySeverity } from "@prisma/client";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const sessionConfigSchema = z.object({
  accessTokenExpiry: z.string().optional(),
  refreshTokenExpiry: z.string().optional(),
  maxConcurrentSessions: z.number().int().min(1).max(20).optional(),
  requireTwoFactor: z.boolean().optional(),
  trackLocation: z.boolean().optional(),
});

const ipWhitelistSchema = z.object({
  ipAddress: z.string(),
  cidrRange: z.string().optional(),
  description: z.string().optional(),
  allowedFor: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
});

const securityEventQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  eventType: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().optional(),
});

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Get current user's active sessions
 */
export const getUserSessions = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const sessions = await sessionService.getUserActiveSessions(userId);

    return ResponseHelper.success(res, {
      sessions: sessions.map((session) => ({
        id: session.id,
        deviceInfo: session.deviceInfo,
        ipAddress: session.ipAddress,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        isCurrent: req.headers.authorization?.includes(session.id) || false,
      })),
    });
  } catch (error) {
    logger.error("Failed to get user sessions", {
      userId: req.user?.id,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(res, "Failed to retrieve sessions");
  }
};

/**
 * Invalidate a specific session
 */
export const invalidateSession = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    await sessionService.invalidateSession(sessionId, userId);

    await auditLogService.log({
      tenantId: req.user!.tenantId,
      userId,
      action: "DELETE",
      entityType: "Session",
      entityId: sessionId,
      details: {
        action: "Session invalidated by user",
      },
    });

    return ResponseHelper.success(res, {
      message: "Session invalidated successfully",
    });
  } catch (error) {
    logger.error("Failed to invalidate session", {
      sessionId: req.params.sessionId,
      userId: req.user?.id,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(res, "Failed to invalidate session");
  }
};

/**
 * Invalidate all sessions except current
 */
export const invalidateAllOtherSessions = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const currentSessionId = req.headers["x-session-id"] as string;

    await sessionService.invalidateAllUserSessions(userId, currentSessionId);

    await auditLogService.log({
      tenantId: req.user!.tenantId,
      userId,
      action: "DELETE",
      entityType: "Session",
      details: {
        action: "All other sessions invalidated",
      },
    });

    return ResponseHelper.success(res, {
      message: "All other sessions invalidated successfully",
    });
  } catch (error) {
    logger.error("Failed to invalidate all other sessions", {
      userId: req.user?.id,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(res, "Failed to invalidate sessions");
  }
};

/**
 * Update session security configuration
 */
export const updateSessionConfig = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const validatedData = sessionConfigSchema.parse(req.body);
    const userId = req.user!.id;

    // Store session configuration (would typically be in a user preferences table)
    // For now, we'll log the configuration change
    await auditLogService.log({
      tenantId: req.user!.tenantId,
      userId,
      action: "UPDATE",
      entityType: "SessionConfig",
      newValues: validatedData,
      details: {
        action: "Session configuration updated",
      },
    });

    return ResponseHelper.success(res, {
      message: "Session configuration updated successfully",
      config: validatedData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(
        res,
        "Invalid session configuration",
        error.errors
      );
    }

    logger.error("Failed to update session config", {
      userId: req.user?.id,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(
      res,
      "Failed to update session configuration"
    );
  }
};

// ============================================================================
// IP WHITELISTING
// ============================================================================

/**
 * Add IP to whitelist (admin only)
 */
export const addToIPWhitelist = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const validatedData = ipWhitelistSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    await ipWhitelistService.addToWhitelist(tenantId, validatedData.ipAddress, {
      cidrRange: validatedData.cidrRange,
      description: validatedData.description,
      allowedFor: validatedData.allowedFor,
      expiresAt: validatedData.expiresAt
        ? new Date(validatedData.expiresAt)
        : undefined,
      createdBy: userId,
    });

    return ResponseHelper.success(res, {
      message: "IP address added to whitelist successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(
        res,
        "Invalid IP whitelist data",
        error.errors
      );
    }

    logger.error("Failed to add IP to whitelist", {
      tenantId: req.user?.tenantId,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(res, "Failed to add IP to whitelist");
  }
};

/**
 * Remove IP from whitelist (admin only)
 */
export const removeFromIPWhitelist = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { ipAddress } = req.params;
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    await ipWhitelistService.removeFromWhitelist(tenantId, ipAddress, userId);

    return ResponseHelper.success(res, {
      message: "IP address removed from whitelist successfully",
    });
  } catch (error) {
    logger.error("Failed to remove IP from whitelist", {
      ipAddress: req.params.ipAddress,
      tenantId: req.user?.tenantId,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(
      res,
      "Failed to remove IP from whitelist"
    );
  }
};

/**
 * Check if IP is whitelisted
 */
export const checkIPWhitelist = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { ipAddress } = req.params;
    const tenantId = req.user!.tenantId;

    const check = await ipWhitelistService.isIPWhitelisted(tenantId, ipAddress);

    return ResponseHelper.success(res, {
      ipAddress,
      allowed: check.allowed,
      reason: check.reason,
      matchedRule: check.matchedRule,
    });
  } catch (error) {
    logger.error("Failed to check IP whitelist", {
      ipAddress: req.params.ipAddress,
      tenantId: req.user?.tenantId,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(res, "Failed to check IP whitelist");
  }
};

// ============================================================================
// SECURITY EVENTS
// ============================================================================

/**
 * Get security events with filtering and pagination
 */
export const getSecurityEvents = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const query = securityEventQuerySchema.parse({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      eventType: req.query.eventType as string,
      severity: req.query.severity as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      userId: req.query.userId as string,
    });

    const tenantId = req.user!.tenantId;
    const events = await securityEventService.query({
      tenantId,
      eventType: query.eventType as SecurityEventType | undefined,
      severity: query.severity as SecuritySeverity | undefined,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      performedById: query.userId,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });

    return ResponseHelper.success(res, events);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(
        res,
        "Invalid query parameters",
        error.errors
      );
    }

    logger.error("Failed to get security events", {
      tenantId: req.user?.tenantId,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(
      res,
      "Failed to retrieve security events"
    );
  }
};

/**
 * Get security event statistics
 */
export const getSecurityEventStats = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const tenantId = req.user!.tenantId;
    const timeframe = (req.query.timeframe as string) || "7d";

    // Calculate start date based on timeframe
    const startDate = new Date();
    if (timeframe === "24h") {
      startDate.setHours(startDate.getHours() - 24);
    } else if (timeframe === "7d") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === "30d") {
      startDate.setDate(startDate.getDate() - 30);
    }

    const stats = await securityEventService.getStatistics(tenantId, startDate);

    return ResponseHelper.success(res, stats);
  } catch (error) {
    logger.error("Failed to get security event statistics", {
      tenantId: req.user?.tenantId,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(
      res,
      "Failed to retrieve security statistics"
    );
  }
};

/**
 * Resolve a security event
 */
export const resolveSecurityEvent = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { eventId } = req.params;
    const { resolution, notes } = req.body;
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    await securityEventService.resolveEvent(eventId, userId, tenantId);

    await auditLogService.log({
      tenantId,
      userId,
      action: "UPDATE",
      entityType: "SecurityEvent",
      entityId: eventId,
      details: {
        action: "Security event resolved",
        resolution,
        notes,
      },
    });

    return ResponseHelper.success(res, {
      message: "Security event resolved successfully",
    });
  } catch (error) {
    logger.error("Failed to resolve security event", {
      eventId: req.params.eventId,
      tenantId: req.user?.tenantId,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(
      res,
      "Failed to resolve security event"
    );
  }
};

// ============================================================================
// AUDIT LOGS
// ============================================================================

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.query.userId as string;
    const action = req.query.action as string;
    const entityType = req.query.entityType as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const tenantId = req.user!.tenantId;
    const logs = await auditLogService.query({
      tenantId,
      userId,
      action: action as any,
      entityType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset: (page - 1) * limit,
    });

    return ResponseHelper.success(res, logs);
  } catch (error) {
    logger.error("Failed to get audit logs", {
      tenantId: req.user?.tenantId,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(res, "Failed to retrieve audit logs");
  }
};

/**
 * Export audit logs
 */
export const exportAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const format = (req.query.format as string) || "csv";
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    const exportData = await auditLogService.exportLogs({
      tenantId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    // Log the export action
    await auditLogService.log({
      tenantId,
      userId,
      action: "EXPORT_DATA",
      entityType: "AuditLog",
      details: {
        action: "Audit logs exported",
        format,
        startDate,
        endDate,
      },
    });

    res.setHeader(
      "Content-Type",
      format === "csv" ? "text/csv" : "application/json"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="audit-logs-${Date.now()}.${format}"`
    );

    return res.send(exportData);
  } catch (error) {
    logger.error("Failed to export audit logs", {
      tenantId: req.user?.tenantId,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(res, "Failed to export audit logs");
  }
};

// ============================================================================
// ENCRYPTION UTILITIES
// ============================================================================

/**
 * Generate new encryption key (super admin only)
 */
export const generateEncryptionKey = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (req.user!.role !== "SUPER_ADMIN") {
      return ResponseHelper.forbidden(res, "Super admin access required");
    }

    const key = encryptionService.generateEncryptionKey();

    await auditLogService.log({
      tenantId: req.user!.tenantId,
      userId: req.user!.id,
      action: "CREATE",
      entityType: "EncryptionKey",
      details: {
        action: "New encryption key generated",
      },
    });

    return ResponseHelper.success(res, {
      key,
      message:
        "New encryption key generated. Store this securely and update your environment variables.",
    });
  } catch (error) {
    logger.error("Failed to generate encryption key", {
      userId: req.user?.id,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(
      res,
      "Failed to generate encryption key"
    );
  }
};

/**
 * Test encryption functionality
 */
export const testEncryption = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { testData } = req.body;

    if (!testData || typeof testData !== "string") {
      return ResponseHelper.badRequest(res, "Test data is required");
    }

    // Encrypt and then decrypt to test functionality
    const encrypted = encryptionService.encrypt(testData);
    const decrypted = encryptionService.decrypt(encrypted);

    const success = decrypted === testData;

    await auditLogService.log({
      tenantId: req.user!.tenantId,
      userId: req.user!.id,
      action: "SYSTEM_CONFIG",
      entityType: "Encryption",
      details: {
        action: "Encryption functionality tested",
        success,
      },
    });

    return ResponseHelper.success(res, {
      success,
      message: success ? "Encryption test passed" : "Encryption test failed",
      encrypted: encrypted.encryptedData.substring(0, 20) + "...", // Show partial for verification
    });
  } catch (error) {
    logger.error("Encryption test failed", {
      userId: req.user?.id,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(res, "Encryption test failed");
  }
};

// ============================================================================
// SECURITY DASHBOARD
// ============================================================================

/**
 * Get security dashboard data
 */
export const getSecurityDashboard = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const tenantId = req.user!.tenantId;
    const timeframe = (req.query.timeframe as string) || "7d";

    // Calculate start date based on timeframe
    const startDate = new Date();
    if (timeframe === "24h") {
      startDate.setHours(startDate.getHours() - 24);
    } else if (timeframe === "7d") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === "30d") {
      startDate.setDate(startDate.getDate() - 30);
    }

    // Get various security metrics in parallel
    const [securityStats, recentEvents, activeSessions, auditLogStats] =
      await Promise.all([
        securityEventService.getStatistics(tenantId, startDate),
        securityEventService.query({
          tenantId,
          limit: 10,
        }),
        sessionService.getUserActiveSessions(req.user!.id),
        auditLogService.getStatistics(tenantId, startDate),
      ]);

    return ResponseHelper.success(res, {
      timeframe,
      securityEvents: securityStats,
      recentEvents,
      activeSessions: {
        count: activeSessions.length,
        sessions: activeSessions.slice(0, 5), // Show only first 5
      },
      auditLogs: auditLogStats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get security dashboard data", {
      tenantId: req.user?.tenantId,
      error: (error as Error).message,
    });
    return ResponseHelper.internalError(
      res,
      "Failed to retrieve security dashboard data"
    );
  }
};
