"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAccessViolation = exports.getAccessViolations = exports.getQRCodeScans = exports.getAccessLogs = exports.updateOccupancy = exports.getCurrentOccupancy = exports.deleteAccessRule = exports.updateAccessRule = exports.getAccessRules = exports.createAccessRule = exports.updateAccessZone = exports.getAccessZones = exports.createAccessZone = exports.revokeQRCode = exports.getUserQRCodes = exports.scanQRCode = exports.generateQRCode = void 0;
const zod_1 = require("zod");
const accessControlService_1 = require("../services/accessControlService");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const prisma_1 = require("../lib/prisma");
const getTenantId = (req) => {
    if (!req.user?.tenantId) {
        throw new errors_1.ValidationError('Tenant context required');
    }
    return req.user.tenantId;
};
const CreateQRCodeSchema = zod_1.z.object({
    type: zod_1.z.enum(['MEMBER', 'VISITOR', 'TEMPORARY', 'SERVICE', 'EMERGENCY', 'ADMIN']),
    userId: zod_1.z.string().optional(),
    visitorId: zod_1.z.string().optional(),
    validFor: zod_1.z.number().min(1).max(168),
    permissions: zod_1.z.array(zod_1.z.string()),
    maxScans: zod_1.z.number().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
const ScanQRCodeSchema = zod_1.z.object({
    qrCodeData: zod_1.z.string().min(1),
    location: zod_1.z.string().optional(),
    deviceInfo: zod_1.z.record(zod_1.z.any()).optional(),
    scannedBy: zod_1.z.string().optional()
});
const CreateAccessRuleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    zoneId: zod_1.z.string().optional(),
    membershipTypes: zod_1.z.array(zod_1.z.string()),
    planTypes: zod_1.z.array(zod_1.z.string()),
    userRoles: zod_1.z.array(zod_1.z.string()),
    timeRestrictions: zod_1.z.record(zod_1.z.any()),
    dayRestrictions: zod_1.z.array(zod_1.z.number().min(0).max(6)),
    maxOccupancy: zod_1.z.number().optional(),
    requiresApproval: zod_1.z.boolean(),
    priority: zod_1.z.number(),
    validFrom: zod_1.z.string().optional(),
    validTo: zod_1.z.string().optional()
});
const CreateAccessZoneSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    zoneType: zod_1.z.enum(['GENERAL', 'MEETING_ROOM', 'PRIVATE_OFFICE', 'KITCHEN', 'PHONE_BOOTH', 'STORAGE', 'ADMIN', 'PARKING', 'ROOFTOP', 'RESTRICTED']),
    restrictions: zod_1.z.record(zod_1.z.any()).optional(),
    isActive: zod_1.z.boolean().optional()
});
const generateQRCode = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const validatedData = CreateQRCodeSchema.parse(req.body);
        if (validatedData.userId) {
        }
        if (validatedData.visitorId) {
        }
        const qrCode = await accessControlService_1.accessControlService.generateQRCode(tenantId, validatedData);
        response_1.ApiResponse.success(res, qrCode, 'QR code generated successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.generateQRCode = generateQRCode;
const scanQRCode = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const validatedData = ScanQRCodeSchema.parse(req.body);
        const result = await accessControlService_1.accessControlService.scanQRCode(tenantId, validatedData);
        if (result.success) {
            response_1.ApiResponse.success(res, result, 'QR code scanned successfully');
        }
        else {
            response_1.ApiResponse.error(res, new errors_1.ValidationError(result.message), 403);
        }
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.scanQRCode = scanQRCode;
const getUserQRCodes = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const userId = req.params.userId || req.user.id;
        const qrCodes = await accessControlService_1.accessControlService.getUserQRCodes(tenantId, userId);
        response_1.ApiResponse.success(res, qrCodes, 'QR codes retrieved successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getUserQRCodes = getUserQRCodes;
const revokeQRCode = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const { qrCodeId } = req.params;
        const revokedBy = req.user.id;
        const result = await accessControlService_1.accessControlService.revokeQRCode(tenantId, qrCodeId, revokedBy);
        response_1.ApiResponse.success(res, result, 'QR code revoked successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.revokeQRCode = revokeQRCode;
const createAccessZone = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const validatedData = CreateAccessZoneSchema.parse(req.body);
        const zone = await prisma_1.prisma.accessZone.create({
            data: {
                tenantId,
                name: validatedData.name,
                description: validatedData.description,
                zoneType: validatedData.zoneType,
                restrictions: validatedData.restrictions || {},
                isActive: validatedData.isActive ?? true
            }
        });
        response_1.ApiResponse.success(res, zone, 'Access zone created successfully', 201);
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.createAccessZone = createAccessZone;
const getAccessZones = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const zones = await prisma_1.prisma.accessZone.findMany({
            where: {
                tenantId,
                isActive: true
            },
            include: {
                accessRules: {
                    where: { isActive: true },
                    orderBy: { priority: 'desc' }
                },
                occupancyTracking: true
            },
            orderBy: { name: 'asc' }
        });
        response_1.ApiResponse.success(res, zones, 'Access zones retrieved successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getAccessZones = getAccessZones;
const updateAccessZone = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const { zoneId } = req.params;
        const validatedData = CreateAccessZoneSchema.partial().parse(req.body);
        const zone = await prisma_1.prisma.accessZone.update({
            where: {
                id: zoneId,
                tenantId
            },
            data: {
                ...validatedData,
                updatedAt: new Date()
            }
        });
        response_1.ApiResponse.success(res, zone, 'Access zone updated successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.updateAccessZone = updateAccessZone;
const createAccessRule = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const validatedData = CreateAccessRuleSchema.parse(req.body);
        const ruleData = {
            ...validatedData,
            validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : undefined,
            validTo: validatedData.validTo ? new Date(validatedData.validTo) : undefined
        };
        const rule = await accessControlService_1.accessControlService.createAccessRule(tenantId, ruleData);
        response_1.ApiResponse.success(res, rule, 'Access rule created successfully', 201);
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.createAccessRule = createAccessRule;
const getAccessRules = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const { zoneId } = req.query;
        const rules = await accessControlService_1.accessControlService.getAccessRules(tenantId, zoneId);
        response_1.ApiResponse.success(res, rules, 'Access rules retrieved successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getAccessRules = getAccessRules;
const updateAccessRule = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const { ruleId } = req.params;
        const validatedData = CreateAccessRuleSchema.partial().parse(req.body);
        const rule = await prisma_1.prisma.accessRule.update({
            where: {
                id: ruleId,
                tenantId
            },
            data: {
                ...validatedData,
                validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : undefined,
                validTo: validatedData.validTo ? new Date(validatedData.validTo) : undefined,
                updatedAt: new Date()
            },
            include: {
                zone: true
            }
        });
        response_1.ApiResponse.success(res, rule, 'Access rule updated successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.updateAccessRule = updateAccessRule;
const deleteAccessRule = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const { ruleId } = req.params;
        await prisma_1.prisma.accessRule.update({
            where: {
                id: ruleId,
                tenantId
            },
            data: {
                isActive: false,
                updatedAt: new Date()
            }
        });
        response_1.ApiResponse.success(res, null, 'Access rule deleted successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.deleteAccessRule = deleteAccessRule;
const getCurrentOccupancy = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const { zoneId, spaceId } = req.query;
        const occupancy = await accessControlService_1.accessControlService.getCurrentOccupancy(tenantId, zoneId, spaceId);
        response_1.ApiResponse.success(res, occupancy, 'Occupancy data retrieved successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getCurrentOccupancy = getCurrentOccupancy;
const updateOccupancy = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const { zoneId, spaceId, action } = req.body;
        if (!['ENTRY', 'EXIT'].includes(action)) {
            throw new errors_1.ValidationError('Action must be ENTRY or EXIT');
        }
        const result = await accessControlService_1.accessControlService.updateOccupancy(tenantId, {
            zoneId,
            spaceId,
            action,
            timestamp: new Date()
        });
        response_1.ApiResponse.success(res, result, 'Occupancy updated successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.updateOccupancy = updateOccupancy;
const getAccessLogs = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const { userId, visitorId, zoneId, startDate, endDate, limit } = req.query;
        const filters = {};
        if (userId)
            filters.userId = userId;
        if (visitorId)
            filters.visitorId = visitorId;
        if (zoneId)
            filters.zoneId = zoneId;
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (limit)
            filters.limit = parseInt(limit);
        const logs = await accessControlService_1.accessControlService.getAccessLogs(tenantId, filters);
        response_1.ApiResponse.success(res, logs, 'Access logs retrieved successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getAccessLogs = getAccessLogs;
const getQRCodeScans = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const { qrCodeId, userId, startDate, endDate, result, limit } = req.query;
        const where = { tenantId };
        if (qrCodeId)
            where.qrCodeId = qrCodeId;
        if (userId)
            where.userId = userId;
        if (result)
            where.result = result;
        if (startDate || endDate) {
            where.scannedAt = {};
            if (startDate)
                where.scannedAt.gte = new Date(startDate);
            if (endDate)
                where.scannedAt.lte = new Date(endDate);
        }
        const scans = await prisma_1.prisma.qRCodeScan.findMany({
            where,
            include: {
                qrCode: {
                    include: {
                        user: true,
                        visitor: true
                    }
                },
                user: true,
                visitor: true
            },
            orderBy: { scannedAt: 'desc' },
            take: limit ? parseInt(limit) : 100
        });
        response_1.ApiResponse.success(res, scans, 'QR code scans retrieved successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getQRCodeScans = getQRCodeScans;
const getAccessViolations = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const { userId, resolved, severity, limit } = req.query;
        const where = { tenantId };
        if (userId)
            where.userId = userId;
        if (resolved !== undefined)
            where.resolved = resolved === 'true';
        if (severity)
            where.severity = severity;
        const violations = await prisma_1.prisma.accessViolation.findMany({
            where,
            include: {
                user: true,
                visitor: true,
                rule: {
                    include: {
                        zone: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit ? parseInt(limit) : 100
        });
        response_1.ApiResponse.success(res, violations, 'Access violations retrieved successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getAccessViolations = getAccessViolations;
const resolveAccessViolation = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const { violationId } = req.params;
        const resolvedBy = req.user.id;
        const violation = await prisma_1.prisma.accessViolation.update({
            where: {
                id: violationId,
                tenantId
            },
            data: {
                resolved: true,
                resolvedBy,
                resolvedAt: new Date()
            },
            include: {
                user: true,
                visitor: true,
                rule: true
            }
        });
        response_1.ApiResponse.success(res, violation, 'Access violation resolved successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.resolveAccessViolation = resolveAccessViolation;
//# sourceMappingURL=accessControlController.js.map