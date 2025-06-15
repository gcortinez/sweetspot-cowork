"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessControlService = exports.AccessControlService = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const qrcode_1 = __importDefault(require("qrcode"));
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
class AccessControlService {
    JWT_SECRET = process.env.QR_JWT_SECRET || 'fallback-secret-key';
    QR_BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    async generateQRCode(tenantId, data) {
        try {
            const validFrom = new Date();
            const validUntil = new Date(validFrom.getTime() + (data.validFor * 60 * 60 * 1000));
            const payload = {
                tenantId,
                type: data.type,
                userId: data.userId,
                visitorId: data.visitorId,
                permissions: data.permissions,
                validFrom: validFrom.toISOString(),
                validUntil: validUntil.toISOString(),
                metadata: data.metadata || {},
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(validUntil.getTime() / 1000)
            };
            const token = jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, { algorithm: 'HS256' });
            const qrCode = await prisma_1.prisma.qRCode.create({
                data: {
                    tenantId,
                    code: token,
                    type: data.type,
                    userId: data.userId,
                    visitorId: data.visitorId,
                    permissions: data.permissions,
                    validFrom,
                    validUntil,
                    maxScans: data.maxScans,
                    currentScans: 0,
                    status: client_1.QRCodeStatus.ACTIVE,
                    metadata: data.metadata || {}
                }
            });
            const qrImageUrl = await qrcode_1.default.toDataURL(token, {
                errorCorrectionLevel: 'M',
                margin: 2,
                width: 256,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            return {
                id: qrCode.id,
                code: token,
                qrImageUrl,
                validFrom,
                validUntil,
                type: data.type,
                permissions: data.permissions
            };
        }
        catch (error) {
            throw new errors_1.ValidationError(`Failed to generate QR code: ${error.message}`);
        }
    }
    async scanQRCode(tenantId, scanData) {
        try {
            let payload;
            try {
                payload = jsonwebtoken_1.default.verify(scanData.qrCodeData, this.JWT_SECRET);
            }
            catch (error) {
                await this.logScanAttempt(tenantId, null, scanData, client_1.ScanResult.INVALID, 'Invalid QR code token');
                return {
                    success: false,
                    result: client_1.ScanResult.INVALID,
                    message: 'Invalid QR code',
                    accessGranted: false
                };
            }
            if (payload.tenantId !== tenantId) {
                await this.logScanAttempt(tenantId, null, scanData, client_1.ScanResult.INVALID, 'Tenant mismatch');
                return {
                    success: false,
                    result: client_1.ScanResult.INVALID,
                    message: 'QR code not valid for this location',
                    accessGranted: false
                };
            }
            const qrCode = await prisma_1.prisma.qRCode.findFirst({
                where: {
                    tenantId,
                    code: scanData.qrCodeData
                },
                include: {
                    user: true,
                    visitor: true
                }
            });
            if (!qrCode) {
                await this.logScanAttempt(tenantId, null, scanData, client_1.ScanResult.INVALID, 'QR code not found');
                return {
                    success: false,
                    result: client_1.ScanResult.INVALID,
                    message: 'QR code not found',
                    accessGranted: false
                };
            }
            if (qrCode.status !== client_1.QRCodeStatus.ACTIVE) {
                await this.logScanAttempt(tenantId, qrCode.id, scanData, client_1.ScanResult.DENIED, `QR code status: ${qrCode.status}`);
                return {
                    success: false,
                    result: client_1.ScanResult.DENIED,
                    message: `QR code is ${qrCode.status.toLowerCase()}`,
                    accessGranted: false
                };
            }
            if (new Date() > qrCode.validUntil) {
                await this.updateQRCodeStatus(qrCode.id, client_1.QRCodeStatus.EXPIRED);
                await this.logScanAttempt(tenantId, qrCode.id, scanData, client_1.ScanResult.EXPIRED, 'QR code expired');
                return {
                    success: false,
                    result: client_1.ScanResult.EXPIRED,
                    message: 'QR code has expired',
                    accessGranted: false
                };
            }
            if (qrCode.maxScans && qrCode.currentScans >= qrCode.maxScans) {
                await this.updateQRCodeStatus(qrCode.id, client_1.QRCodeStatus.USED_UP);
                await this.logScanAttempt(tenantId, qrCode.id, scanData, client_1.ScanResult.DENIED, 'Maximum scans reached');
                return {
                    success: false,
                    result: client_1.ScanResult.DENIED,
                    message: 'QR code has reached maximum usage',
                    accessGranted: false
                };
            }
            const accessValidation = await this.validateAccessRules(tenantId, qrCode, scanData.location);
            if (!accessValidation.allowed) {
                await this.logScanAttempt(tenantId, qrCode.id, scanData, client_1.ScanResult.RESTRICTED, accessValidation.reason);
                return {
                    success: false,
                    result: client_1.ScanResult.RESTRICTED,
                    message: accessValidation.reason,
                    accessGranted: false,
                    violations: accessValidation.violations
                };
            }
            await prisma_1.prisma.qRCode.update({
                where: { id: qrCode.id },
                data: {
                    currentScans: qrCode.currentScans + 1,
                    lastUsedAt: new Date()
                }
            });
            await this.logScanAttempt(tenantId, qrCode.id, scanData, client_1.ScanResult.SUCCESS, 'Access granted');
            if (scanData.location) {
                await this.updateOccupancy(tenantId, {
                    zoneId: scanData.location,
                    action: 'ENTRY',
                    timestamp: new Date()
                });
            }
            const userInfo = qrCode.user ? {
                id: qrCode.user.id,
                name: `${qrCode.user.firstName} ${qrCode.user.lastName}`,
                type: 'USER'
            } : qrCode.visitor ? {
                id: qrCode.visitor.id,
                name: qrCode.visitor.name,
                type: 'VISITOR'
            } : undefined;
            return {
                success: true,
                result: client_1.ScanResult.SUCCESS,
                message: 'Access granted',
                accessGranted: true,
                userInfo,
                permissions: qrCode.permissions
            };
        }
        catch (error) {
            await this.logScanAttempt(tenantId, null, scanData, client_1.ScanResult.DENIED, `System error: ${error.message}`);
            throw new errors_1.ValidationError(`Failed to scan QR code: ${error.message}`);
        }
    }
    async createAccessRule(tenantId, data) {
        try {
            return await prisma_1.prisma.accessRule.create({
                data: {
                    tenantId,
                    name: data.name,
                    description: data.description,
                    zoneId: data.zoneId,
                    membershipTypes: data.membershipTypes,
                    planTypes: data.planTypes,
                    userRoles: data.userRoles,
                    timeRestrictions: data.timeRestrictions,
                    dayRestrictions: data.dayRestrictions,
                    maxOccupancy: data.maxOccupancy,
                    requiresApproval: data.requiresApproval,
                    priority: data.priority,
                    validFrom: data.validFrom,
                    validTo: data.validTo,
                    isActive: true
                },
                include: {
                    zone: true
                }
            });
        }
        catch (error) {
            throw new errors_1.ValidationError(`Failed to create access rule: ${error.message}`);
        }
    }
    async getAccessRules(tenantId, zoneId) {
        try {
            return await prisma_1.prisma.accessRule.findMany({
                where: {
                    tenantId,
                    isActive: true,
                    ...(zoneId && { zoneId })
                },
                include: {
                    zone: true
                },
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'asc' }
                ]
            });
        }
        catch (error) {
            throw new errors_1.ValidationError(`Failed to fetch access rules: ${error.message}`);
        }
    }
    async updateOccupancy(tenantId, update) {
        try {
            const whereClause = { tenantId };
            if (update.zoneId)
                whereClause.zoneId = update.zoneId;
            if (update.spaceId)
                whereClause.spaceId = update.spaceId;
            const occupancy = await prisma_1.prisma.occupancyTracking.findFirst({
                where: whereClause
            });
            if (!occupancy) {
                return await prisma_1.prisma.occupancyTracking.create({
                    data: {
                        tenantId,
                        zoneId: update.zoneId,
                        spaceId: update.spaceId,
                        currentCount: update.action === 'ENTRY' ? 1 : 0,
                        maxCapacity: 100,
                        lastEntry: update.action === 'ENTRY' ? update.timestamp : null,
                        lastExit: update.action === 'EXIT' ? update.timestamp : null,
                        peakToday: update.action === 'ENTRY' ? 1 : 0
                    }
                });
            }
            const newCount = Math.max(0, occupancy.currentCount + (update.action === 'ENTRY' ? 1 : -1));
            return await prisma_1.prisma.occupancyTracking.update({
                where: { id: occupancy.id },
                data: {
                    currentCount: newCount,
                    lastEntry: update.action === 'ENTRY' ? update.timestamp : occupancy.lastEntry,
                    lastExit: update.action === 'EXIT' ? update.timestamp : occupancy.lastExit,
                    peakToday: Math.max(occupancy.peakToday, newCount),
                    updatedAt: update.timestamp
                }
            });
        }
        catch (error) {
            throw new errors_1.ValidationError(`Failed to update occupancy: ${error.message}`);
        }
    }
    async getCurrentOccupancy(tenantId, zoneId, spaceId) {
        try {
            const whereClause = { tenantId };
            if (zoneId)
                whereClause.zoneId = zoneId;
            if (spaceId)
                whereClause.spaceId = spaceId;
            return await prisma_1.prisma.occupancyTracking.findMany({
                where: whereClause,
                include: {
                    zone: true,
                    space: true
                }
            });
        }
        catch (error) {
            throw new errors_1.ValidationError(`Failed to get occupancy data: ${error.message}`);
        }
    }
    async validateAccessRules(tenantId, qrCode, location) {
        try {
            const rules = await this.getAccessRules(tenantId, location);
            const violations = [];
            let allowed = true;
            let reason = '';
            for (const rule of rules) {
                if (rule.timeRestrictions && Object.keys(rule.timeRestrictions).length > 0) {
                    const now = new Date();
                    const currentTime = now.getHours() * 60 + now.getMinutes();
                    const restrictions = rule.timeRestrictions;
                    if (restrictions.start && restrictions.end) {
                        const startTime = this.parseTime(restrictions.start);
                        const endTime = this.parseTime(restrictions.end);
                        if (currentTime < startTime || currentTime > endTime) {
                            violations.push(`Access outside allowed hours: ${restrictions.start}-${restrictions.end}`);
                            allowed = false;
                            reason = `Access not allowed at this time`;
                        }
                    }
                }
                if (rule.dayRestrictions && Array.isArray(rule.dayRestrictions)) {
                    const today = new Date().getDay();
                    if (!rule.dayRestrictions.includes(today)) {
                        violations.push(`Access not allowed on this day`);
                        allowed = false;
                        reason = `Access not allowed on this day`;
                    }
                }
                if (rule.maxOccupancy && location) {
                    const occupancy = await this.getCurrentOccupancy(tenantId, location);
                    const currentCount = occupancy.reduce((sum, occ) => sum + occ.currentCount, 0);
                    if (currentCount >= rule.maxOccupancy) {
                        violations.push(`Area at maximum capacity (${rule.maxOccupancy})`);
                        allowed = false;
                        reason = `Area is at maximum capacity`;
                    }
                }
                if (qrCode.user && (rule.membershipTypes.length > 0 || rule.planTypes.length > 0)) {
                    const userMemberships = await prisma_1.prisma.membership.findMany({
                        where: {
                            userId: qrCode.user.id,
                            status: 'ACTIVE'
                        },
                        include: {
                            plan: true
                        }
                    });
                    if (userMemberships.length === 0) {
                        violations.push(`No active membership found`);
                        allowed = false;
                        reason = `Active membership required`;
                    }
                }
            }
            return { allowed, reason, violations };
        }
        catch (error) {
            return { allowed: false, reason: `Validation error: ${error.message}`, violations: [] };
        }
    }
    async logScanAttempt(tenantId, qrCodeId, scanData, result, reason) {
        try {
            await prisma_1.prisma.qRCodeScan.create({
                data: {
                    tenantId,
                    qrCodeId: qrCodeId || '',
                    userId: scanData.scannedBy,
                    location: scanData.location,
                    deviceInfo: scanData.deviceInfo || {},
                    result,
                    reason,
                    metadata: {},
                    scannedAt: new Date()
                }
            });
        }
        catch (error) {
            console.error('Failed to log scan attempt:', error);
        }
    }
    async updateQRCodeStatus(qrCodeId, status) {
        try {
            await prisma_1.prisma.qRCode.update({
                where: { id: qrCodeId },
                data: { status }
            });
        }
        catch (error) {
            console.error('Failed to update QR code status:', error);
        }
    }
    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }
    async getUserQRCodes(tenantId, userId) {
        try {
            return await prisma_1.prisma.qRCode.findMany({
                where: {
                    tenantId,
                    userId,
                    status: client_1.QRCodeStatus.ACTIVE
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        catch (error) {
            throw new errors_1.ValidationError(`Failed to get user QR codes: ${error.message}`);
        }
    }
    async revokeQRCode(tenantId, qrCodeId, revokedBy) {
        try {
            const qrCode = await prisma_1.prisma.qRCode.findFirst({
                where: {
                    id: qrCodeId,
                    tenantId
                }
            });
            if (!qrCode) {
                throw new errors_1.NotFoundError('QR code not found');
            }
            return await prisma_1.prisma.qRCode.update({
                where: { id: qrCodeId },
                data: {
                    status: client_1.QRCodeStatus.REVOKED,
                    updatedAt: new Date()
                }
            });
        }
        catch (error) {
            throw new errors_1.ValidationError(`Failed to revoke QR code: ${error.message}`);
        }
    }
    async getAccessLogs(tenantId, filters) {
        try {
            const where = { tenantId };
            if (filters?.userId)
                where.userId = filters.userId;
            if (filters?.visitorId)
                where.visitorId = filters.visitorId;
            if (filters?.zoneId)
                where.zoneId = filters.zoneId;
            if (filters?.startDate || filters?.endDate) {
                where.timestamp = {};
                if (filters.startDate)
                    where.timestamp.gte = filters.startDate;
                if (filters.endDate)
                    where.timestamp.lte = filters.endDate;
            }
            return await prisma_1.prisma.accessLog.findMany({
                where,
                include: {
                    user: true,
                    visitor: true,
                    zone: true
                },
                orderBy: { timestamp: 'desc' },
                take: filters?.limit || 100
            });
        }
        catch (error) {
            throw new errors_1.ValidationError(`Failed to get access logs: ${error.message}`);
        }
    }
}
exports.AccessControlService = AccessControlService;
exports.accessControlService = new AccessControlService();
//# sourceMappingURL=accessControlService.js.map