"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessControlIntegrationService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const visitorService_1 = require("./visitorService");
class AccessControlIntegrationService {
    async verifyAccess(tenantId, attempt) {
        try {
            logger_1.logger.info('Access verification started', {
                tenantId,
                accessType: attempt.accessType,
                location: attempt.location
            });
            let result;
            switch (attempt.accessType) {
                case 'QR_CODE':
                    result = await this.verifyQRCodeAccess(tenantId, attempt);
                    break;
                case 'ACCESS_CODE':
                    result = await this.verifyAccessCodeAccess(tenantId, attempt);
                    break;
                case 'BADGE':
                    result = await this.verifyBadgeAccess(tenantId, attempt);
                    break;
                case 'MANUAL':
                    result = await this.verifyManualAccess(tenantId, attempt);
                    break;
                default:
                    result = {
                        success: false,
                        accessGranted: false,
                        result: client_1.ScanResult.INVALID,
                        reason: 'Unknown access type'
                    };
            }
            await this.logAccessAttempt(tenantId, attempt, result);
            if (!result.accessGranted) {
                await this.handleAccessViolation(tenantId, attempt, result);
            }
            logger_1.logger.info('Access verification completed', {
                tenantId,
                success: result.success,
                accessGranted: result.accessGranted
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Access verification failed', { tenantId, attempt }, error);
            return {
                success: false,
                accessGranted: false,
                result: client_1.ScanResult.INVALID,
                reason: 'Verification error'
            };
        }
    }
    async verifyQRCodeAccess(tenantId, attempt) {
        try {
            const visitor = await prisma_1.prisma.visitor.findFirst({
                where: {
                    tenantId,
                    qrCode: attempt.accessData,
                    status: { in: [client_1.VisitorStatus.APPROVED, client_1.VisitorStatus.CHECKED_IN] }
                },
                include: {
                    host: true
                }
            });
            if (!visitor) {
                return {
                    success: true,
                    accessGranted: false,
                    result: client_1.ScanResult.INVALID,
                    reason: 'Visitor not found or invalid QR code'
                };
            }
            const now = new Date();
            if (now < visitor.validFrom || now > visitor.validUntil) {
                return {
                    success: true,
                    accessGranted: false,
                    result: client_1.ScanResult.EXPIRED,
                    reason: 'QR code expired or not yet valid'
                };
            }
            const hasZoneAccess = await this.checkZoneAccess(tenantId, visitor.accessZones, attempt.location);
            if (!hasZoneAccess) {
                return {
                    success: true,
                    accessGranted: false,
                    result: client_1.ScanResult.RESTRICTED,
                    reason: 'Access to this zone not permitted'
                };
            }
            const policyResult = await this.checkVisitorPolicies(tenantId, visitor, attempt);
            if (!policyResult.allowed) {
                return {
                    success: true,
                    accessGranted: false,
                    result: client_1.ScanResult.DENIED,
                    reason: policyResult.reason
                };
            }
            return {
                success: true,
                accessGranted: true,
                result: client_1.ScanResult.SUCCESS,
                visitor,
                accessZones: visitor.accessZones,
                validUntil: visitor.validUntil,
                restrictions: policyResult.restrictions
            };
        }
        catch (error) {
            logger_1.logger.error('QR code verification failed', { tenantId, attempt }, error);
            throw error;
        }
    }
    async verifyAccessCodeAccess(tenantId, attempt) {
        try {
            const validation = await visitorService_1.visitorService.validateAccessCode(tenantId, attempt.accessData, attempt.location, attempt.ipAddress);
            if (!validation.valid) {
                return {
                    success: true,
                    accessGranted: false,
                    result: client_1.ScanResult.DENIED,
                    reason: validation.reason
                };
            }
            const accessCode = validation.accessCode;
            let visitor = null;
            if (accessCode.visitorId) {
                visitor = await prisma_1.prisma.visitor.findUnique({
                    where: { id: accessCode.visitorId },
                    include: { host: true }
                });
            }
            const usageResult = await visitorService_1.visitorService.useAccessCode(tenantId, attempt.accessData, attempt.userId, attempt.visitorId, attempt.location, attempt.ipAddress, attempt.deviceInfo);
            if (!usageResult.success) {
                return {
                    success: true,
                    accessGranted: false,
                    result: client_1.ScanResult.DENIED,
                    reason: usageResult.reason
                };
            }
            return {
                success: true,
                accessGranted: true,
                result: client_1.ScanResult.SUCCESS,
                visitor,
                accessZones: accessCode.accessZones,
                validUntil: accessCode.expiresAt
            };
        }
        catch (error) {
            logger_1.logger.error('Access code verification failed', { tenantId, attempt }, error);
            throw error;
        }
    }
    async verifyBadgeAccess(tenantId, attempt) {
        try {
            const badge = await prisma_1.prisma.visitorBadge.findFirst({
                where: {
                    tenantId,
                    badgeNumber: attempt.accessData,
                    isActive: true
                },
                include: {
                    visitor: {
                        include: {
                            host: true
                        }
                    }
                }
            });
            if (!badge || !badge.visitor) {
                return {
                    success: true,
                    accessGranted: false,
                    result: client_1.ScanResult.INVALID,
                    reason: 'Badge not found or inactive'
                };
            }
            const visitor = badge.visitor;
            if (visitor.status !== client_1.VisitorStatus.CHECKED_IN) {
                return {
                    success: true,
                    accessGranted: false,
                    result: client_1.ScanResult.DENIED,
                    reason: 'Visitor not checked in'
                };
            }
            const now = new Date();
            if (now < visitor.validFrom || now > visitor.validUntil) {
                return {
                    success: true,
                    accessGranted: false,
                    result: client_1.ScanResult.EXPIRED,
                    reason: 'Visit period expired'
                };
            }
            const hasZoneAccess = await this.checkZoneAccess(tenantId, visitor.accessZones, attempt.location);
            if (!hasZoneAccess) {
                return {
                    success: true,
                    accessGranted: false,
                    result: client_1.ScanResult.RESTRICTED,
                    reason: 'Access to this zone not permitted'
                };
            }
            return {
                success: true,
                accessGranted: true,
                result: client_1.ScanResult.SUCCESS,
                visitor,
                accessZones: visitor.accessZones,
                validUntil: visitor.validUntil
            };
        }
        catch (error) {
            logger_1.logger.error('Badge verification failed', { tenantId, attempt }, error);
            throw error;
        }
    }
    async verifyManualAccess(tenantId, attempt) {
        try {
            if (!attempt.userId) {
                return {
                    success: true,
                    accessGranted: false,
                    result: client_1.ScanResult.DENIED,
                    reason: 'Manual access requires authenticated user'
                };
            }
            const user = await prisma_1.prisma.user.findFirst({
                where: {
                    id: attempt.userId,
                    tenantId,
                    role: { in: ['COWORK_ADMIN', 'CLIENT_ADMIN'] }
                }
            });
            if (!user) {
                return {
                    success: true,
                    accessGranted: false,
                    result: client_1.ScanResult.DENIED,
                    reason: 'User not authorized for manual access'
                };
            }
            let visitor = null;
            if (attempt.visitorId) {
                visitor = await prisma_1.prisma.visitor.findFirst({
                    where: {
                        id: attempt.visitorId,
                        tenantId
                    },
                    include: { host: true }
                });
            }
            return {
                success: true,
                accessGranted: true,
                result: client_1.ScanResult.SUCCESS,
                visitor,
                reason: 'Manual access granted by authorized user'
            };
        }
        catch (error) {
            logger_1.logger.error('Manual access verification failed', { tenantId, attempt }, error);
            throw error;
        }
    }
    async processCheckIn(tenantId, data, performedBy) {
        try {
            const accessAttempt = {
                tenantId,
                visitorId: data.visitorId,
                accessType: data.verificationMethod,
                accessData: data.verificationData || '',
                location: data.location,
                accessPoint: data.accessPoint
            };
            const accessResult = await this.verifyAccess(tenantId, accessAttempt);
            if (!accessResult.accessGranted) {
                return {
                    success: false,
                    reason: accessResult.reason
                };
            }
            const visitor = await visitorService_1.visitorService.checkInVisitor(tenantId, {
                visitorId: data.visitorId,
                checkInLocation: data.location,
                badgeNumber: data.badgeNumber,
                photoUrl: data.photoUrl,
                healthDeclaration: data.healthDeclaration,
                termsAccepted: data.termsAccepted,
                dataConsent: data.dataConsent
            });
            await this.logVisitorAction(tenantId, data.visitorId, client_1.VisitorAction.CHECKED_IN, performedBy, `Checked in via ${data.verificationMethod}`, data.location);
            logger_1.logger.info('Visitor checked in successfully', {
                tenantId,
                visitorId: data.visitorId,
                location: data.location
            });
            return {
                success: true,
                visitor
            };
        }
        catch (error) {
            logger_1.logger.error('Check-in processing failed', { tenantId, data }, error);
            return {
                success: false,
                reason: 'Check-in processing error'
            };
        }
    }
    async processCheckOut(tenantId, data, performedBy) {
        try {
            const visitor = await visitorService_1.visitorService.checkOutVisitor(tenantId, {
                visitorId: data.visitorId,
                checkOutLocation: data.location,
                badgeReturned: data.badgeReturned,
                notes: data.notes
            });
            await this.logVisitorAction(tenantId, data.visitorId, client_1.VisitorAction.CHECKED_OUT, performedBy, data.notes || 'Checked out', data.location);
            if (data.feedback || data.rating) {
                await this.recordVisitorFeedback(tenantId, data.visitorId, data.feedback, data.rating);
            }
            logger_1.logger.info('Visitor checked out successfully', {
                tenantId,
                visitorId: data.visitorId,
                location: data.location
            });
            return {
                success: true,
                visitor
            };
        }
        catch (error) {
            logger_1.logger.error('Check-out processing failed', { tenantId, data }, error);
            return {
                success: false,
                reason: 'Check-out processing error'
            };
        }
    }
    async checkZoneAccess(tenantId, allowedZones, requestedLocation) {
        if (!requestedLocation || allowedZones.length === 0) {
            return true;
        }
        return allowedZones.some(zone => requestedLocation.toLowerCase().includes(zone.toLowerCase()));
    }
    async checkVisitorPolicies(tenantId, visitor, attempt) {
        try {
            const policies = await prisma_1.prisma.visitorPolicy.findMany({
                where: {
                    tenantId,
                    isActive: true
                },
                orderBy: { priority: 'desc' }
            });
            for (const policy of policies) {
                if (policy.requiresApproval && visitor.status === client_1.VisitorStatus.PENDING) {
                    return {
                        allowed: false,
                        reason: 'Visitor requires approval'
                    };
                }
                if (policy.requiresPreRegistration && !visitor.isPreRegistered) {
                    return {
                        allowed: false,
                        reason: 'Pre-registration required'
                    };
                }
                const now = new Date();
                const visitDuration = (now.getTime() - visitor.validFrom.getTime()) / (1000 * 60);
                if (visitDuration > policy.maxDuration) {
                    return {
                        allowed: false,
                        reason: 'Maximum visit duration exceeded'
                    };
                }
                if (policy.requiresEscort && !attempt.userId) {
                    return {
                        allowed: false,
                        reason: 'Escort required for this visitor'
                    };
                }
            }
            return { allowed: true };
        }
        catch (error) {
            logger_1.logger.error('Policy check failed', { tenantId, visitorId: visitor.id }, error);
            return {
                allowed: false,
                reason: 'Policy verification error'
            };
        }
    }
    async handleAccessViolation(tenantId, attempt, result) {
        try {
            let violationType;
            let severity = client_1.ViolationSeverity.LOW;
            switch (result.result) {
                case client_1.ScanResult.EXPIRED:
                    violationType = client_1.ViolationType.EXPIRED_MEMBERSHIP;
                    severity = client_1.ViolationSeverity.MEDIUM;
                    break;
                case client_1.ScanResult.INVALID:
                    violationType = client_1.ViolationType.INVALID_CREDENTIALS;
                    severity = client_1.ViolationSeverity.HIGH;
                    break;
                case client_1.ScanResult.RESTRICTED:
                    violationType = client_1.ViolationType.UNAUTHORIZED_ACCESS;
                    severity = client_1.ViolationSeverity.HIGH;
                    break;
                case client_1.ScanResult.CAPACITY_FULL:
                    violationType = client_1.ViolationType.CAPACITY_EXCEEDED;
                    severity = client_1.ViolationSeverity.LOW;
                    break;
                case client_1.ScanResult.VIOLATION:
                    violationType = client_1.ViolationType.MULTIPLE_ENTRIES;
                    severity = client_1.ViolationSeverity.CRITICAL;
                    break;
                default:
                    violationType = client_1.ViolationType.INVALID_CREDENTIALS;
                    severity = client_1.ViolationSeverity.MEDIUM;
            }
            await prisma_1.prisma.accessViolation.create({
                data: {
                    tenantId,
                    userId: attempt.userId,
                    visitorId: attempt.visitorId,
                    ruleId: 'default',
                    violationType,
                    description: result.reason || 'Access denied',
                    severity,
                    location: attempt.location,
                    metadata: {
                        accessType: attempt.accessType,
                        accessData: attempt.accessData,
                        ipAddress: attempt.ipAddress,
                        userAgent: attempt.userAgent,
                        timestamp: new Date().toISOString()
                    }
                }
            });
            logger_1.logger.warn('Access violation recorded', {
                tenantId,
                violationType,
                severity,
                location: attempt.location
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to handle access violation', { tenantId, attempt }, error);
        }
    }
    async logAccessAttempt(tenantId, attempt, result) {
        try {
            await prisma_1.prisma.accessLog.create({
                data: {
                    tenantId,
                    userId: attempt.userId,
                    visitorId: attempt.visitorId,
                    action: result.accessGranted ? client_1.AccessAction.ENTRY : client_1.AccessAction.ACCESS_DENIED,
                    location: attempt.location,
                    metadata: {
                        accessType: attempt.accessType,
                        accessData: attempt.accessData,
                        result: result.result,
                        reason: result.reason,
                        ipAddress: attempt.ipAddress,
                        userAgent: attempt.userAgent,
                        deviceInfo: attempt.deviceInfo
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to log access attempt', { tenantId, attempt }, error);
        }
    }
    async logVisitorAction(tenantId, visitorId, action, performedBy, details, location) {
        try {
            await prisma_1.prisma.visitorLog.create({
                data: {
                    tenantId,
                    visitorId,
                    action,
                    performedBy,
                    details,
                    location,
                    metadata: {
                        timestamp: new Date().toISOString()
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to log visitor action', {
                tenantId,
                visitorId,
                action
            }, error);
        }
    }
    async recordVisitorFeedback(tenantId, visitorId, feedback, rating) {
        try {
            await prisma_1.prisma.visitorLog.create({
                data: {
                    tenantId,
                    visitorId,
                    action: client_1.VisitorAction.CHECKED_OUT,
                    details: 'Visitor feedback recorded',
                    metadata: {
                        feedback,
                        rating,
                        timestamp: new Date().toISOString()
                    }
                }
            });
            logger_1.logger.info('Visitor feedback recorded', {
                tenantId,
                visitorId,
                rating
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to record visitor feedback', {
                tenantId,
                visitorId
            }, error);
        }
    }
    async syncWithAccessControlSystem(tenantId, systemType, deviceId, eventData) {
        try {
            logger_1.logger.info('Access control system sync', {
                tenantId,
                systemType,
                deviceId,
                eventData
            });
            const accessAttempt = {
                tenantId,
                accessType: this.mapSystemEventToAccessType(eventData),
                accessData: eventData.credential || eventData.code || eventData.badge,
                location: eventData.location || `Device ${deviceId}`,
                accessPoint: deviceId,
                deviceInfo: {
                    systemType,
                    deviceId,
                    timestamp: eventData.timestamp
                }
            };
            const result = await this.verifyAccess(tenantId, accessAttempt);
            const action = result.accessGranted ? 'GRANT_ACCESS' : 'DENY_ACCESS';
            return {
                success: true,
                action,
                reason: result.reason
            };
        }
        catch (error) {
            logger_1.logger.error('Access control system sync failed', {
                tenantId,
                systemType,
                deviceId
            }, error);
            return {
                success: false,
                reason: 'System sync error'
            };
        }
    }
    mapSystemEventToAccessType(eventData) {
        if (eventData.qrCode)
            return 'QR_CODE';
        if (eventData.accessCode || eventData.pin)
            return 'ACCESS_CODE';
        if (eventData.badge || eventData.card)
            return 'BADGE';
        return 'MANUAL';
    }
    async getAccessControlMetrics(tenantId, startDate, endDate) {
        try {
            const accessLogs = await prisma_1.prisma.accessLog.findMany({
                where: {
                    tenantId,
                    timestamp: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            const violations = await prisma_1.prisma.accessViolation.findMany({
                where: {
                    tenantId,
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            const totalAttempts = accessLogs.length;
            const successfulAccess = accessLogs.filter(log => log.action === client_1.AccessAction.ENTRY).length;
            const deniedAccess = totalAttempts - successfulAccess;
            const hourCounts = new Array(24).fill(0);
            accessLogs.forEach(log => {
                const hour = log.timestamp.getHours();
                hourCounts[hour]++;
            });
            const peakAccessHours = hourCounts
                .map((count, hour) => ({ hour, count }))
                .filter(h => h.count > 0)
                .sort((a, b) => b.count - a.count);
            const accessByType = new Map();
            accessLogs.forEach(log => {
                const metadata = log.metadata;
                const type = metadata?.accessType || 'UNKNOWN';
                accessByType.set(type, (accessByType.get(type) || 0) + 1);
            });
            const violationsByType = new Map();
            violations.forEach(violation => {
                const existing = violationsByType.get(violation.violationType) || { count: 0, severity: violation.severity };
                existing.count++;
                violationsByType.set(violation.violationType, existing);
            });
            return {
                totalAttempts,
                successfulAccess,
                deniedAccess,
                violations: violations.length,
                averageAccessTime: 0,
                peakAccessHours,
                accessByType: Array.from(accessByType.entries()).map(([type, count]) => ({ type, count })),
                violationsByType: Array.from(violationsByType.entries()).map(([type, data]) => ({
                    type,
                    count: data.count,
                    severity: data.severity
                }))
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get access control metrics', {
                tenantId,
                startDate,
                endDate
            }, error);
            throw error;
        }
    }
}
exports.accessControlIntegrationService = new AccessControlIntegrationService();
//# sourceMappingURL=accessControlIntegrationService.js.map