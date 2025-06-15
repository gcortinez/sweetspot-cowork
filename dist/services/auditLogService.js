"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogService = exports.AuditLogService = void 0;
const prisma_1 = require("../lib/prisma");
class AuditLogService {
    async log(data) {
        try {
            await prisma_1.prisma.auditLog.create({
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
        }
        catch (error) {
            console.error('Failed to create audit log:', error);
        }
    }
    async query(params) {
        const where = {
            tenantId: params.tenantId
        };
        if (params.userId)
            where.userId = params.userId;
        if (params.action)
            where.action = params.action;
        if (params.entityType)
            where.entityType = params.entityType;
        if (params.entityId)
            where.entityId = params.entityId;
        if (params.ipAddress)
            where.ipAddress = params.ipAddress;
        if (params.startDate || params.endDate) {
            where.timestamp = {};
            if (params.startDate)
                where.timestamp.gte = params.startDate;
            if (params.endDate)
                where.timestamp.lte = params.endDate;
        }
        return await prisma_1.prisma.auditLog.findMany({
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
    async getStatistics(tenantId, startDate, endDate) {
        const where = { tenantId };
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate)
                where.timestamp.gte = startDate;
            if (endDate)
                where.timestamp.lte = endDate;
        }
        const [totalLogs, actionStats, userStats, entityStats] = await Promise.all([
            prisma_1.prisma.auditLog.count({ where }),
            prisma_1.prisma.auditLog.groupBy({
                by: ['action'],
                where,
                _count: { action: true },
                orderBy: { _count: { action: 'desc' } }
            }),
            prisma_1.prisma.auditLog.groupBy({
                by: ['userId'],
                where: { ...where, userId: { not: null } },
                _count: { userId: true },
                orderBy: { _count: { userId: 'desc' } },
                take: 10
            }),
            prisma_1.prisma.auditLog.groupBy({
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
    async logAuthentication(tenantId, userId, action, ipAddress, userAgent, details) {
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
    async logDataChange(tenantId, userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent) {
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
    async logSecurityEvent(tenantId, userId, action, description, ipAddress, userAgent, metadata) {
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
    async cleanupOldLogs(tenantId, olderThanDays = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const result = await prisma_1.prisma.auditLog.deleteMany({
            where: {
                tenantId,
                timestamp: {
                    lt: cutoffDate
                }
            }
        });
        return result.count;
    }
    async exportLogs(params) {
        const logs = await this.query({
            ...params,
            limit: undefined,
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
exports.AuditLogService = AuditLogService;
exports.auditLogService = new AuditLogService();
//# sourceMappingURL=auditLogService.js.map