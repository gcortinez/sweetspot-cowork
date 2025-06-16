import { Response } from "express";
import { z } from "zod";
import { securityEventService } from "../services/securityEventService";
import { handleController } from "../utils/response";
import { ValidationError } from "../utils/errors";
import { AuthenticatedRequest } from "../types/api";
import { SecurityEventType, SecuritySeverity } from "@prisma/client";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const QuerySecurityEventsSchema = z.object({
  eventType: z.nativeEnum(SecurityEventType).optional(),
  severity: z.nativeEnum(SecuritySeverity).optional(),
  resolved: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  startDate: z
    .string()
    .transform((date) => new Date(date))
    .optional(),
  endDate: z
    .string()
    .transform((date) => new Date(date))
    .optional(),
  ipAddress: z.string().optional(),
  performedById: z.string().optional(),
  targetUserId: z.string().optional(),
  limit: z.string().transform(Number).optional().default("100"),
  offset: z.string().transform(Number).optional().default("0"),
});

const ResolveEventSchema = z.object({
  resolution: z.string().optional(),
});

const ThreatDetectionSchema = z.object({
  lookbackHours: z.number().min(1).max(168).optional().default(24),
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
// SECURITY EVENT CONTROLLERS
// ============================================================================

/**
 * Query security events with filters
 * GET /api/security/events
 */
export const getSecurityEvents = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const query = QuerySecurityEventsSchema.parse(req.query);

    const events = await securityEventService.query({
      tenantId,
      ...query,
    });

    return { data: events, message: "Security events retrieved successfully" };
  }, res);
};

/**
 * Get security event statistics
 * GET /api/security/events/statistics
 */
export const getSecurityEventStatistics = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const { startDate, endDate } = req.query;

    const statistics = await securityEventService.getStatistics(
      tenantId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    return { data: statistics, message: "Security event statistics retrieved" };
  }, res);
};

/**
 * Resolve a security event
 * PUT /api/security/events/:eventId/resolve
 */
export const resolveSecurityEvent = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const { eventId } = req.params;
    const resolvedBy = req.user!.id;

    const resolvedEvent = await securityEventService.resolveEvent(
      eventId,
      resolvedBy,
      tenantId
    );

    return { data: resolvedEvent, message: "Security event resolved" };
  }, res);
};

/**
 * Get unresolved security events (dashboard)
 * GET /api/security/events/unresolved
 */
export const getUnresolvedEvents = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const events = await securityEventService.query({
      tenantId,
      resolved: false,
      limit: 50,
    });

    return { data: events, message: "Unresolved security events retrieved" };
  }, res);
};

/**
 * Get critical security events
 * GET /api/security/events/critical
 */
export const getCriticalEvents = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const events = await securityEventService.query({
      tenantId,
      severity: SecuritySeverity.CRITICAL,
      resolved: false,
      limit: 20,
    });

    return { data: events, message: "Critical security events retrieved" };
  }, res);
};

/**
 * Get recent failed login attempts
 * GET /api/security/events/failed-logins
 */
export const getFailedLogins = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const { hours = "24" } = req.query;
    const startDate = new Date(
      Date.now() - parseInt(hours as string) * 60 * 60 * 1000
    );

    const events = await securityEventService.query({
      tenantId,
      eventType: SecurityEventType.FAILED_LOGIN,
      startDate,
      limit: 100,
    });

    return { data: events, message: "Failed login attempts retrieved" };
  }, res);
};

/**
 * Detect security threats using patterns
 * GET /api/security/events/threat-detection
 */
export const detectThreats = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const { lookbackHours = 24 } = req.query;

    const threats = await securityEventService.detectThreats(
      tenantId,
      parseInt(lookbackHours as string)
    );

    return {
      threats,
      lookbackHours,
      detectedAt: new Date(),
      message: "Threat detection completed",
    };
  }, res);
};

/**
 * Get security events by IP address
 * GET /api/security/events/by-ip/:ipAddress
 */
export const getEventsByIP = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const { ipAddress } = req.params;
    const { hours = "168" } = req.query; // Default to 1 week

    const startDate = new Date(
      Date.now() - parseInt(hours as string) * 60 * 60 * 1000
    );

    const events = await securityEventService.query({
      tenantId,
      ipAddress,
      startDate,
      limit: 200,
    });

    return {
      ipAddress,
      events,
      timeRange: `${hours} hours`,
      count: events.length,
      message: "Security events by IP retrieved",
    };
  }, res);
};

/**
 * Get security events for a specific user
 * GET /api/security/events/user/:userId
 */
export const getUserSecurityEvents = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const { userId } = req.params;
    const query = QuerySecurityEventsSchema.parse(req.query);

    const events = await securityEventService.query({
      tenantId,
      performedById: userId,
      ...query,
    });

    return { data: events, message: "User security events retrieved" };
  }, res);
};

/**
 * Get security dashboard summary
 * GET /api/security/events/dashboard
 */
export const getSecurityDashboard = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  return handleController(async () => {
    const tenantId = getTenantId(req);
    requireAdminRole(req);

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [todayStats, weekStats, recentCritical, threats] = await Promise.all([
      securityEventService.getStatistics(tenantId, last24Hours),
      securityEventService.getStatistics(tenantId, last7Days),
      securityEventService.query({
        tenantId,
        severity: SecuritySeverity.CRITICAL,
        resolved: false,
        limit: 5,
      }),
      securityEventService.detectThreats(tenantId, 24),
    ]);

    return {
      today: todayStats,
      thisWeek: weekStats,
      recentCritical,
      activeThreats: threats,
      lastUpdated: new Date(),
      message: "Security dashboard data retrieved",
    };
  }, res);
};
