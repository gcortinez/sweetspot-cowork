"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityEventService = exports.SecurityEventService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
class SecurityEventService {
    async logEvent(data) {
        try {
            return await prisma_1.prisma.securityEvent.create({
                data: {
                    tenantId: data.tenantId,
                    eventType: data.eventType,
                    severity: data.severity || client_1.SecuritySeverity.LOW,
                    source: data.source,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                    performedById: data.performedById,
                    targetUserId: data.targetUserId,
                    description: data.description,
                    metadata: data.metadata || {},
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            console.error('Failed to log security event:', error);
            throw error;
        }
    }
    async query(params) {
        const where = {
            tenantId: params.tenantId
        };
        if (params.eventType)
            where.eventType = params.eventType;
        if (params.severity)
            where.severity = params.severity;
        if (params.resolved !== undefined)
            where.resolved = params.resolved;
        if (params.ipAddress)
            where.ipAddress = params.ipAddress;
        if (params.performedById)
            where.performedById = params.performedById;
        if (params.targetUserId)
            where.targetUserId = params.targetUserId;
        if (params.startDate || params.endDate) {
            where.timestamp = {};
            if (params.startDate)
                where.timestamp.gte = params.startDate;
            if (params.endDate)
                where.timestamp.lte = params.endDate;
        }
        return await prisma_1.prisma.securityEvent.findMany({
            where,
            include: {
                performedBy: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                },
                targetUser: {
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
    async resolveEvent(eventId, resolvedBy, tenantId) {
        return await prisma_1.prisma.securityEvent.update({
            where: { id: eventId, tenantId },
            data: {
                resolved: true,
                resolvedAt: new Date(),
                resolvedBy
            }
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
        const [totalEvents, unresolvedEvents, severityStats, typeStats, recentCritical] = await Promise.all([
            prisma_1.prisma.securityEvent.count({ where }),
            prisma_1.prisma.securityEvent.count({
                where: { ...where, resolved: false }
            }),
            prisma_1.prisma.securityEvent.groupBy({
                by: ['severity'],
                where,
                _count: { severity: true }
            }),
            prisma_1.prisma.securityEvent.groupBy({
                by: ['eventType'],
                where,
                _count: { eventType: true },
                orderBy: { _count: { eventType: 'desc' } }
            }),
            prisma_1.prisma.securityEvent.findMany({
                where: {
                    ...where,
                    severity: client_1.SecuritySeverity.CRITICAL,
                    resolved: false
                },
                take: 10,
                orderBy: { timestamp: 'desc' }
            })
        ]);
        return {
            totalEvents,
            unresolvedEvents,
            severityStats: severityStats.map(stat => ({
                severity: stat.severity,
                count: stat._count.severity
            })),
            typeStats: typeStats.map(stat => ({
                eventType: stat.eventType,
                count: stat._count.eventType
            })),
            recentCritical
        };
    }
    async logFailedLogin(tenantId, email, ipAddress, userAgent, reason) {
        return await this.logEvent({
            tenantId,
            eventType: client_1.SecurityEventType.FAILED_LOGIN,
            severity: client_1.SecuritySeverity.LOW,
            source: 'authentication',
            ipAddress,
            userAgent,
            description: `Failed login attempt for email: ${email}`,
            metadata: { email, reason }
        });
    }
    async logMultipleFailedLogins(tenantId, email, attemptCount, ipAddress, userAgent) {
        const severity = attemptCount >= 10 ? client_1.SecuritySeverity.HIGH :
            attemptCount >= 5 ? client_1.SecuritySeverity.MEDIUM : client_1.SecuritySeverity.LOW;
        return await this.logEvent({
            tenantId,
            eventType: client_1.SecurityEventType.MULTIPLE_FAILED_LOGINS,
            severity,
            source: 'authentication',
            ipAddress,
            userAgent,
            description: `${attemptCount} failed login attempts for email: ${email}`,
            metadata: { email, attemptCount }
        });
    }
    async logSuccessfulLogin(tenantId, userId, ipAddress, userAgent, loginMethod) {
        return await this.logEvent({
            tenantId,
            eventType: client_1.SecurityEventType.SUCCESSFUL_LOGIN,
            severity: client_1.SecuritySeverity.LOW,
            source: 'authentication',
            performedById: userId,
            ipAddress,
            userAgent,
            description: 'Successful user login',
            metadata: { loginMethod }
        });
    }
    async logSuspiciousLogin(tenantId, userId, reason, ipAddress, userAgent, metadata) {
        return await this.logEvent({
            tenantId,
            eventType: client_1.SecurityEventType.SUSPICIOUS_LOGIN,
            severity: client_1.SecuritySeverity.MEDIUM,
            source: 'authentication',
            performedById: userId,
            ipAddress,
            userAgent,
            description: `Suspicious login detected: ${reason}`,
            metadata
        });
    }
    async logUnauthorizedAccess(tenantId, resource, userId, ipAddress, userAgent) {
        return await this.logEvent({
            tenantId,
            eventType: client_1.SecurityEventType.UNAUTHORIZED_ACCESS,
            severity: client_1.SecuritySeverity.MEDIUM,
            source: 'authorization',
            performedById: userId,
            ipAddress,
            userAgent,
            description: `Unauthorized access attempt to: ${resource}`,
            metadata: { resource }
        });
    }
    async logPrivilegeEscalation(tenantId, userId, attemptedAction, ipAddress, userAgent) {
        return await this.logEvent({
            tenantId,
            eventType: client_1.SecurityEventType.PRIVILEGE_ESCALATION,
            severity: client_1.SecuritySeverity.HIGH,
            source: 'authorization',
            performedById: userId,
            ipAddress,
            userAgent,
            description: `Privilege escalation attempt: ${attemptedAction}`,
            metadata: { attemptedAction }
        });
    }
    async logDataExport(tenantId, userId, dataType, recordCount, ipAddress, userAgent) {
        const severity = recordCount > 1000 ? client_1.SecuritySeverity.MEDIUM : client_1.SecuritySeverity.LOW;
        return await this.logEvent({
            tenantId,
            eventType: client_1.SecurityEventType.DATA_EXPORT,
            severity,
            source: 'data_access',
            performedById: userId,
            ipAddress,
            userAgent,
            description: `Data export: ${dataType} (${recordCount} records)`,
            metadata: { dataType, recordCount }
        });
    }
    async logRateLimitExceeded(tenantId, endpoint, ipAddress, userAgent, userId) {
        return await this.logEvent({
            tenantId,
            eventType: client_1.SecurityEventType.RATE_LIMIT_EXCEEDED,
            severity: client_1.SecuritySeverity.LOW,
            source: 'rate_limiting',
            performedById: userId,
            ipAddress,
            userAgent,
            description: `Rate limit exceeded for endpoint: ${endpoint}`,
            metadata: { endpoint }
        });
    }
    async logAdminAction(tenantId, adminUserId, action, targetUserId, ipAddress, userAgent, metadata) {
        return await this.logEvent({
            tenantId,
            eventType: client_1.SecurityEventType.ADMIN_ACTION,
            severity: client_1.SecuritySeverity.MEDIUM,
            source: 'administration',
            performedById: adminUserId,
            targetUserId,
            ipAddress,
            userAgent,
            description: `Admin action: ${action}`,
            metadata
        });
    }
    async detectThreats(tenantId, lookbackHours = 24) {
        const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
        const [failedLoginsByIP, suspiciousActivity, privilegeEscalations] = await Promise.all([
            prisma_1.prisma.securityEvent.groupBy({
                by: ['ipAddress'],
                where: {
                    tenantId,
                    eventType: client_1.SecurityEventType.FAILED_LOGIN,
                    timestamp: { gte: since },
                    ipAddress: { not: null }
                },
                _count: { ipAddress: true },
                having: { ipAddress: { _count: { gt: 10 } } }
            }),
            prisma_1.prisma.securityEvent.count({
                where: {
                    tenantId,
                    eventType: {
                        in: [
                            client_1.SecurityEventType.SUSPICIOUS_LOGIN,
                            client_1.SecurityEventType.UNAUTHORIZED_ACCESS,
                            client_1.SecurityEventType.MALICIOUS_REQUEST
                        ]
                    },
                    timestamp: { gte: since }
                }
            }),
            prisma_1.prisma.securityEvent.count({
                where: {
                    tenantId,
                    eventType: client_1.SecurityEventType.PRIVILEGE_ESCALATION,
                    timestamp: { gte: since }
                }
            })
        ]);
        const threats = [];
        if (failedLoginsByIP.length > 0) {
            threats.push({
                type: 'brute_force',
                severity: 'HIGH',
                description: `${failedLoginsByIP.length} IP addresses with excessive failed logins`,
                details: failedLoginsByIP
            });
        }
        if (suspiciousActivity > 5) {
            threats.push({
                type: 'suspicious_activity',
                severity: 'MEDIUM',
                description: `${suspiciousActivity} suspicious activities detected`,
                count: suspiciousActivity
            });
        }
        if (privilegeEscalations > 0) {
            threats.push({
                type: 'privilege_escalation',
                severity: 'CRITICAL',
                description: `${privilegeEscalations} privilege escalation attempts`,
                count: privilegeEscalations
            });
        }
        return threats;
    }
}
exports.SecurityEventService = SecurityEventService;
exports.securityEventService = new SecurityEventService();
//# sourceMappingURL=securityEventService.js.map