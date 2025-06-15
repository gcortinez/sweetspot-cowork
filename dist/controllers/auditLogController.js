"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupAuditLogs = exports.getMyAuditLogs = exports.getEntityAuditLogs = exports.getUserAuditLogs = exports.exportAuditLogs = exports.getAuditLogStatistics = exports.getAuditLogs = void 0;
const zod_1 = require("zod");
const auditLogService_1 = require("../services/auditLogService");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const client_1 = require("@prisma/client");
const QueryAuditLogsSchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    action: zod_1.z.nativeEnum(client_1.AuditAction).optional(),
    entityType: zod_1.z.string().optional(),
    entityId: zod_1.z.string().optional(),
    startDate: zod_1.z.string().transform(date => new Date(date)).optional(),
    endDate: zod_1.z.string().transform(date => new Date(date)).optional(),
    ipAddress: zod_1.z.string().optional(),
    limit: zod_1.z.string().transform(Number).optional().default('100'),
    offset: zod_1.z.string().transform(Number).optional().default('0')
});
const ExportAuditLogsSchema = zod_1.z.object({
    startDate: zod_1.z.string().transform(date => new Date(date)),
    endDate: zod_1.z.string().transform(date => new Date(date)),
    action: zod_1.z.nativeEnum(client_1.AuditAction).optional(),
    entityType: zod_1.z.string().optional(),
    format: zod_1.z.enum(['json', 'csv']).optional().default('json')
});
const StatisticsQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().transform(date => new Date(date)).optional(),
    endDate: zod_1.z.string().transform(date => new Date(date)).optional()
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
const getAuditLogs = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const query = QueryAuditLogsSchema.parse(req.query);
        const logs = await auditLogService_1.auditLogService.query({
            tenantId,
            ...query
        });
        response_1.ApiResponse.success(res, logs, 'Audit logs retrieved successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getAuditLogs = getAuditLogs;
const getAuditLogStatistics = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const query = StatisticsQuerySchema.parse(req.query);
        const statistics = await auditLogService_1.auditLogService.getStatistics(tenantId, query.startDate, query.endDate);
        response_1.ApiResponse.success(res, statistics, 'Audit log statistics retrieved');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getAuditLogStatistics = getAuditLogStatistics;
const exportAuditLogs = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const query = ExportAuditLogsSchema.parse(req.body);
        const logs = await auditLogService_1.auditLogService.exportLogs({
            tenantId,
            startDate: query.startDate,
            endDate: query.endDate,
            action: query.action,
            entityType: query.entityType
        });
        if (query.format === 'csv') {
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
            res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
            res.send(csvData);
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.json"`);
            response_1.ApiResponse.success(res, logs, 'Audit logs exported successfully');
        }
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.exportAuditLogs = exportAuditLogs;
const getUserAuditLogs = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const { userId } = req.params;
        const query = QueryAuditLogsSchema.parse(req.query);
        const logs = await auditLogService_1.auditLogService.query({
            tenantId,
            userId,
            ...query
        });
        response_1.ApiResponse.success(res, logs, 'User audit logs retrieved successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getUserAuditLogs = getUserAuditLogs;
const getEntityAuditLogs = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        requireAdminRole(req);
        const { entityType, entityId } = req.params;
        const query = QueryAuditLogsSchema.parse(req.query);
        const logs = await auditLogService_1.auditLogService.query({
            tenantId,
            entityType,
            entityId,
            ...query
        });
        response_1.ApiResponse.success(res, logs, 'Entity audit logs retrieved successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getEntityAuditLogs = getEntityAuditLogs;
const getMyAuditLogs = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const userId = req.user.id;
        const query = QueryAuditLogsSchema.parse(req.query);
        const logs = await auditLogService_1.auditLogService.query({
            tenantId,
            userId,
            limit: Math.min(query.limit || 50, 100),
            offset: query.offset
        });
        response_1.ApiResponse.success(res, logs, 'Your activity log retrieved successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getMyAuditLogs = getMyAuditLogs;
const cleanupAuditLogs = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        if (req.user?.role !== 'SUPER_ADMIN') {
            throw new errors_1.ValidationError('Super admin access required');
        }
        const { olderThanDays } = req.body;
        if (!olderThanDays || olderThanDays < 30) {
            throw new errors_1.ValidationError('Must retain logs for at least 30 days');
        }
        const deletedCount = await auditLogService_1.auditLogService.cleanupOldLogs(tenantId, olderThanDays);
        response_1.ApiResponse.success(res, {
            deletedCount,
            olderThanDays
        }, `Cleaned up ${deletedCount} old audit logs`);
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.cleanupAuditLogs = cleanupAuditLogs;
//# sourceMappingURL=auditLogController.js.map