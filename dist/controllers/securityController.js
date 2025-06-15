"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecurityDashboard = exports.testEncryption = exports.generateEncryptionKey = exports.exportAuditLogs = exports.getAuditLogs = exports.resolveSecurityEvent = exports.getSecurityEventStats = exports.getSecurityEvents = exports.checkIPWhitelist = exports.removeFromIPWhitelist = exports.addToIPWhitelist = exports.updateSessionConfig = exports.invalidateAllOtherSessions = exports.invalidateSession = exports.getUserSessions = void 0;
const sessionService_1 = require("../services/sessionService");
const encryptionService_1 = require("../services/encryptionService");
const auditLogService_1 = require("../services/auditLogService");
const securityEventService_1 = require("../services/securityEventService");
const ipWhitelistService_1 = require("../services/ipWhitelistService");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const zod_1 = require("zod");
const sessionConfigSchema = zod_1.z.object({
    accessTokenExpiry: zod_1.z.string().optional(),
    refreshTokenExpiry: zod_1.z.string().optional(),
    maxConcurrentSessions: zod_1.z.number().int().min(1).max(20).optional(),
    requireTwoFactor: zod_1.z.boolean().optional(),
    trackLocation: zod_1.z.boolean().optional()
});
const ipWhitelistSchema = zod_1.z.object({
    ipAddress: zod_1.z.string(),
    cidrRange: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    allowedFor: zod_1.z.array(zod_1.z.string()).optional(),
    expiresAt: zod_1.z.string().datetime().optional()
});
const securityEventQuerySchema = zod_1.z.object({
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    eventType: zod_1.z.string().optional(),
    severity: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    userId: zod_1.z.string().optional()
});
const getUserSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const sessions = await sessionService_1.sessionService.getUserActiveSessions(userId);
        return response_1.ResponseHelper.success(res, {
            sessions: sessions.map(session => ({
                id: session.id,
                deviceInfo: session.deviceInfo,
                ipAddress: session.ipAddress,
                lastActivity: session.lastActivity,
                createdAt: session.createdAt,
                isCurrent: req.headers.authorization?.includes(session.id) || false
            }))
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get user sessions', {
            userId: req.user?.id,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to retrieve sessions');
    }
};
exports.getUserSessions = getUserSessions;
const invalidateSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        await sessionService_1.sessionService.invalidateSession(sessionId, userId);
        await auditLogService_1.auditLogService.log({
            tenantId: req.user.tenantId,
            userId,
            action: 'DELETE',
            entityType: 'Session',
            entityId: sessionId,
            details: {
                action: 'Session invalidated by user'
            }
        });
        return response_1.ResponseHelper.success(res, {
            message: 'Session invalidated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to invalidate session', {
            sessionId: req.params.sessionId,
            userId: req.user?.id,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to invalidate session');
    }
};
exports.invalidateSession = invalidateSession;
const invalidateAllOtherSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentSessionId = req.headers['x-session-id'];
        await sessionService_1.sessionService.invalidateAllUserSessions(userId, currentSessionId);
        await auditLogService_1.auditLogService.log({
            tenantId: req.user.tenantId,
            userId,
            action: 'DELETE',
            entityType: 'Session',
            details: {
                action: 'All other sessions invalidated'
            }
        });
        return response_1.ResponseHelper.success(res, {
            message: 'All other sessions invalidated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to invalidate all other sessions', {
            userId: req.user?.id,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to invalidate sessions');
    }
};
exports.invalidateAllOtherSessions = invalidateAllOtherSessions;
const updateSessionConfig = async (req, res) => {
    try {
        const validatedData = sessionConfigSchema.parse(req.body);
        const userId = req.user.id;
        await auditLogService_1.auditLogService.log({
            tenantId: req.user.tenantId,
            userId,
            action: 'UPDATE',
            entityType: 'SessionConfig',
            newValues: validatedData,
            details: {
                action: 'Session configuration updated'
            }
        });
        return response_1.ResponseHelper.success(res, {
            message: 'Session configuration updated successfully',
            config: validatedData
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid session configuration', error.errors);
        }
        logger_1.logger.error('Failed to update session config', {
            userId: req.user?.id,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to update session configuration');
    }
};
exports.updateSessionConfig = updateSessionConfig;
const addToIPWhitelist = async (req, res) => {
    try {
        const validatedData = ipWhitelistSchema.parse(req.body);
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        await ipWhitelistService_1.ipWhitelistService.addToWhitelist(tenantId, validatedData.ipAddress, {
            cidrRange: validatedData.cidrRange,
            description: validatedData.description,
            allowedFor: validatedData.allowedFor,
            expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
            createdBy: userId
        });
        return response_1.ResponseHelper.success(res, {
            message: 'IP address added to whitelist successfully'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid IP whitelist data', error.errors);
        }
        logger_1.logger.error('Failed to add IP to whitelist', {
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to add IP to whitelist');
    }
};
exports.addToIPWhitelist = addToIPWhitelist;
const removeFromIPWhitelist = async (req, res) => {
    try {
        const { ipAddress } = req.params;
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        await ipWhitelistService_1.ipWhitelistService.removeFromWhitelist(tenantId, ipAddress, userId);
        return response_1.ResponseHelper.success(res, {
            message: 'IP address removed from whitelist successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to remove IP from whitelist', {
            ipAddress: req.params.ipAddress,
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to remove IP from whitelist');
    }
};
exports.removeFromIPWhitelist = removeFromIPWhitelist;
const checkIPWhitelist = async (req, res) => {
    try {
        const { ipAddress } = req.params;
        const tenantId = req.user.tenantId;
        const check = await ipWhitelistService_1.ipWhitelistService.isIPWhitelisted(tenantId, ipAddress);
        return response_1.ResponseHelper.success(res, {
            ipAddress,
            allowed: check.allowed,
            reason: check.reason,
            matchedRule: check.matchedRule
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to check IP whitelist', {
            ipAddress: req.params.ipAddress,
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to check IP whitelist');
    }
};
exports.checkIPWhitelist = checkIPWhitelist;
const getSecurityEvents = async (req, res) => {
    try {
        const query = securityEventQuerySchema.parse({
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            eventType: req.query.eventType,
            severity: req.query.severity,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            userId: req.query.userId
        });
        const tenantId = req.user.tenantId;
        const events = await securityEventService_1.securityEventService.getSecurityEvents(tenantId, query);
        return response_1.ResponseHelper.success(res, events);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid query parameters', error.errors);
        }
        logger_1.logger.error('Failed to get security events', {
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to retrieve security events');
    }
};
exports.getSecurityEvents = getSecurityEvents;
const getSecurityEventStats = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const timeframe = req.query.timeframe || '7d';
        const stats = await securityEventService_1.securityEventService.getSecurityEventStatistics(tenantId, timeframe);
        return response_1.ResponseHelper.success(res, stats);
    }
    catch (error) {
        logger_1.logger.error('Failed to get security event statistics', {
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to retrieve security statistics');
    }
};
exports.getSecurityEventStats = getSecurityEventStats;
const resolveSecurityEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { resolution, notes } = req.body;
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        await securityEventService_1.securityEventService.resolveSecurityEvent(eventId, userId, resolution, notes);
        await auditLogService_1.auditLogService.log({
            tenantId,
            userId,
            action: 'UPDATE',
            entityType: 'SecurityEvent',
            entityId: eventId,
            details: {
                action: 'Security event resolved',
                resolution,
                notes
            }
        });
        return response_1.ResponseHelper.success(res, {
            message: 'Security event resolved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to resolve security event', {
            eventId: req.params.eventId,
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to resolve security event');
    }
};
exports.resolveSecurityEvent = resolveSecurityEvent;
const getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const userId = req.query.userId;
        const action = req.query.action;
        const entityType = req.query.entityType;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const tenantId = req.user.tenantId;
        const logs = await auditLogService_1.auditLogService.getAuditLogs(tenantId, {
            page,
            limit,
            userId,
            action,
            entityType,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        });
        return response_1.ResponseHelper.success(res, logs);
    }
    catch (error) {
        logger_1.logger.error('Failed to get audit logs', {
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to retrieve audit logs');
    }
};
exports.getAuditLogs = getAuditLogs;
const exportAuditLogs = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        const exportData = await auditLogService_1.auditLogService.exportAuditLogs(tenantId, {
            format,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        });
        await auditLogService_1.auditLogService.log({
            tenantId,
            userId,
            action: 'EXPORT',
            entityType: 'AuditLog',
            details: {
                action: 'Audit logs exported',
                format,
                startDate,
                endDate
            }
        });
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.${format}"`);
        return res.send(exportData);
    }
    catch (error) {
        logger_1.logger.error('Failed to export audit logs', {
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to export audit logs');
    }
};
exports.exportAuditLogs = exportAuditLogs;
const generateEncryptionKey = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return response_1.ResponseHelper.forbidden(res, 'Super admin access required');
        }
        const key = encryptionService_1.encryptionService.generateEncryptionKey();
        await auditLogService_1.auditLogService.log({
            tenantId: req.user.tenantId,
            userId: req.user.id,
            action: 'CREATE',
            entityType: 'EncryptionKey',
            details: {
                action: 'New encryption key generated'
            }
        });
        return response_1.ResponseHelper.success(res, {
            key,
            message: 'New encryption key generated. Store this securely and update your environment variables.'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate encryption key', {
            userId: req.user?.id,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to generate encryption key');
    }
};
exports.generateEncryptionKey = generateEncryptionKey;
const testEncryption = async (req, res) => {
    try {
        const { testData } = req.body;
        if (!testData || typeof testData !== 'string') {
            return response_1.ResponseHelper.badRequest(res, 'Test data is required');
        }
        const encrypted = encryptionService_1.encryptionService.encrypt(testData);
        const decrypted = encryptionService_1.encryptionService.decrypt(encrypted);
        const success = decrypted === testData;
        await auditLogService_1.auditLogService.log({
            tenantId: req.user.tenantId,
            userId: req.user.id,
            action: 'TEST',
            entityType: 'Encryption',
            details: {
                action: 'Encryption functionality tested',
                success
            }
        });
        return response_1.ResponseHelper.success(res, {
            success,
            message: success ? 'Encryption test passed' : 'Encryption test failed',
            encrypted: encrypted.encryptedData.substring(0, 20) + '...'
        });
    }
    catch (error) {
        logger_1.logger.error('Encryption test failed', {
            userId: req.user?.id,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Encryption test failed');
    }
};
exports.testEncryption = testEncryption;
const getSecurityDashboard = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const timeframe = req.query.timeframe || '7d';
        const [securityStats, recentEvents, activeSessions, auditLogStats] = await Promise.all([
            securityEventService_1.securityEventService.getSecurityEventStatistics(tenantId, timeframe),
            securityEventService_1.securityEventService.getRecentSecurityEvents(tenantId, 10),
            sessionService_1.sessionService.getUserActiveSessions(req.user.id),
            auditLogService_1.auditLogService.getAuditLogStatistics(tenantId, timeframe)
        ]);
        return response_1.ResponseHelper.success(res, {
            timeframe,
            securityEvents: securityStats,
            recentEvents,
            activeSessions: {
                count: activeSessions.length,
                sessions: activeSessions.slice(0, 5)
            },
            auditLogs: auditLogStats,
            generatedAt: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get security dashboard data', {
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to retrieve security dashboard data');
    }
};
exports.getSecurityDashboard = getSecurityDashboard;
//# sourceMappingURL=securityController.js.map