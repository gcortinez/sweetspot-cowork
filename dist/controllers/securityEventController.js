"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecurityDashboard = exports.getUserSecurityEvents = exports.getEventsByIP = exports.detectThreats = exports.getFailedLogins = exports.getCriticalEvents = exports.getUnresolvedEvents = exports.resolveSecurityEvent = exports.getSecurityEventStatistics = exports.getSecurityEvents = void 0;
const zod_1 = require("zod");
const securityEventService_1 = require("../services/securityEventService");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const client_1 = require("@prisma/client");
const QuerySecurityEventsSchema = zod_1.z.object({
    eventType: zod_1.z.nativeEnum(client_1.SecurityEventType).optional(),
    severity: zod_1.z.nativeEnum(client_1.SecuritySeverity).optional(),
    resolved: zod_1.z.string().transform(val => val === 'true').optional(),
    startDate: zod_1.z.string().transform(date => new Date(date)).optional(),
    endDate: zod_1.z.string().transform(date => new Date(date)).optional(),
    ipAddress: zod_1.z.string().optional(),
    performedById: zod_1.z.string().optional(),
    targetUserId: zod_1.z.string().optional(),
    limit: zod_1.z.string().transform(Number).optional().default('100'),
    offset: zod_1.z.string().transform(Number).optional().default('0')
});
const ResolveEventSchema = zod_1.z.object({
    resolution: zod_1.z.string().optional()
});
const ThreatDetectionSchema = zod_1.z.object({
    lookbackHours: zod_1.z.number().min(1).max(168).optional().default(24)
});
const getTenantId = (req) => {
    if (!req.user?.tenantId) {
        throw new errors_1.ValidationError('Tenant context required');
    }
    return req.user.tenantId;
};
const requireAdminRole = (req) => {
    if (!req.user?.role || !['SUPER_ADMIN', 'COWORK_ADMIN'].includes(req.user.role)) {
        throw new errors_1.ValidationError('Admin access required');
    }
};
const getSecurityEvents = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const query = QuerySecurityEventsSchema.parse(req.query);
        const events = await securityEventService_1.securityEventService.query({
            tenantId,
            ...query
        });
        response_1.ApiResponse.success(res, events, 'Security events retrieved successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getSecurityEvents = getSecurityEvents;
const getSecurityEventStatistics = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const { startDate, endDate } = req.query;
        const statistics = await securityEventService_1.securityEventService.getStatistics(tenantId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        response_1.ApiResponse.success(res, statistics, 'Security event statistics retrieved');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getSecurityEventStatistics = getSecurityEventStatistics;
const resolveSecurityEvent = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const { eventId } = req.params;
        const resolvedBy = req.user.id;
        const resolvedEvent = await securityEventService_1.securityEventService.resolveEvent(eventId, resolvedBy, tenantId);
        response_1.ApiResponse.success(res, resolvedEvent, 'Security event resolved');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.resolveSecurityEvent = resolveSecurityEvent;
const getUnresolvedEvents = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const events = await securityEventService_1.securityEventService.query({
            tenantId,
            resolved: false,
            limit: 50
        });
        response_1.ApiResponse.success(res, events, 'Unresolved security events retrieved');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getUnresolvedEvents = getUnresolvedEvents;
const getCriticalEvents = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const events = await securityEventService_1.securityEventService.query({
            tenantId,
            severity: client_1.SecuritySeverity.CRITICAL,
            resolved: false,
            limit: 20
        });
        response_1.ApiResponse.success(res, events, 'Critical security events retrieved');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getCriticalEvents = getCriticalEvents;
const getFailedLogins = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const { hours = '24' } = req.query;
        const startDate = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);
        const events = await securityEventService_1.securityEventService.query({
            tenantId,
            eventType: client_1.SecurityEventType.FAILED_LOGIN,
            startDate,
            limit: 100
        });
        response_1.ApiResponse.success(res, events, 'Failed login attempts retrieved');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getFailedLogins = getFailedLogins;
const detectThreats = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const { lookbackHours = 24 } = req.query;
        const threats = await securityEventService_1.securityEventService.detectThreats(tenantId, parseInt(lookbackHours));
        response_1.ApiResponse.success(res, {
            threats,
            lookbackHours,
            detectedAt: new Date()
        }, 'Threat detection completed');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.detectThreats = detectThreats;
const getEventsByIP = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const { ipAddress } = req.params;
        const { hours = '168' } = req.query;
        const startDate = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);
        const events = await securityEventService_1.securityEventService.query({
            tenantId,
            ipAddress,
            startDate,
            limit: 200
        });
        response_1.ApiResponse.success(res, {
            ipAddress,
            events,
            timeRange: `${hours} hours`,
            count: events.length
        }, 'Security events by IP retrieved');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getEventsByIP = getEventsByIP;
const getUserSecurityEvents = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const { userId } = req.params;
        const query = QuerySecurityEventsSchema.parse(req.query);
        const events = await securityEventService_1.securityEventService.query({
            tenantId,
            performedById: userId,
            ...query
        });
        response_1.ApiResponse.success(res, events, 'User security events retrieved');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getUserSecurityEvents = getUserSecurityEvents;
const getSecurityDashboard = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [todayStats, weekStats, recentCritical, threats] = await Promise.all([
            securityEventService_1.securityEventService.getStatistics(tenantId, last24Hours),
            securityEventService_1.securityEventService.getStatistics(tenantId, last7Days),
            securityEventService_1.securityEventService.query({
                tenantId,
                severity: client_1.SecuritySeverity.CRITICAL,
                resolved: false,
                limit: 5
            }),
            securityEventService_1.securityEventService.detectThreats(tenantId, 24)
        ]);
        response_1.ApiResponse.success(res, {
            today: todayStats,
            thisWeek: weekStats,
            recentCritical,
            activeThreats: threats,
            lastUpdated: new Date()
        }, 'Security dashboard data retrieved');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getSecurityDashboard = getSecurityDashboard;
//# sourceMappingURL=securityEventController.js.map