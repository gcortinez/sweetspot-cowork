"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationStats = exports.acknowledgeNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getNotifications = exports.getAccessControlMetrics = exports.getConversionFunnel = exports.getHostPerformance = exports.getPeakAnalysis = exports.getVisitorTrends = exports.getVisitorAnalytics = exports.getVisitorStatistics = exports.processAccessCheckOut = exports.processAccessCheckIn = exports.verifyAccess = exports.useAccessCode = exports.validateAccessCode = exports.generateAccessCode = exports.convertPreRegistrationToVisitor = exports.approvePreRegistration = exports.createPreRegistration = exports.extendVisitorStay = exports.checkOutVisitor = exports.checkInVisitor = exports.getActiveVisitors = exports.getTodaysVisitors = exports.deleteVisitor = exports.updateVisitor = exports.getVisitor = exports.getVisitors = exports.createVisitor = void 0;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const visitorService_1 = require("../services/visitorService");
const visitorNotificationService_1 = require("../services/visitorNotificationService");
const visitorAnalyticsService_1 = require("../services/visitorAnalyticsService");
const accessControlIntegrationService_1 = require("../services/accessControlIntegrationService");
const client_1 = require("@prisma/client");
const createVisitorSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    company: zod_1.z.string().optional(),
    jobTitle: zod_1.z.string().optional(),
    documentType: zod_1.z.string().optional(),
    documentNumber: zod_1.z.string().optional(),
    hostUserId: zod_1.z.string(),
    purpose: zod_1.z.nativeEnum(client_1.VisitorPurpose),
    purposeDetails: zod_1.z.string().optional(),
    expectedDuration: zod_1.z.number().min(1).optional(),
    meetingRoom: zod_1.z.string().optional(),
    validFrom: zod_1.z.string().datetime().optional(),
    validUntil: zod_1.z.string().datetime().optional(),
    accessZones: zod_1.z.array(zod_1.z.string()).optional(),
    preRegistrationId: zod_1.z.string().optional(),
    healthDeclaration: zod_1.z.record(zod_1.z.any()).optional(),
    emergencyContact: zod_1.z.record(zod_1.z.any()).optional()
});
const updateVisitorSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).optional(),
    lastName: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    company: zod_1.z.string().optional(),
    jobTitle: zod_1.z.string().optional(),
    photoUrl: zod_1.z.string().optional(),
    documentType: zod_1.z.string().optional(),
    documentNumber: zod_1.z.string().optional(),
    purpose: zod_1.z.nativeEnum(client_1.VisitorPurpose).optional(),
    purposeDetails: zod_1.z.string().optional(),
    expectedDuration: zod_1.z.number().min(1).optional(),
    meetingRoom: zod_1.z.string().optional(),
    validUntil: zod_1.z.string().datetime().optional(),
    accessZones: zod_1.z.array(zod_1.z.string()).optional(),
    healthDeclaration: zod_1.z.record(zod_1.z.any()).optional(),
    emergencyContact: zod_1.z.record(zod_1.z.any()).optional()
});
const createPreRegistrationSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional(),
    company: zod_1.z.string().optional(),
    jobTitle: zod_1.z.string().optional(),
    hostUserId: zod_1.z.string(),
    expectedArrival: zod_1.z.string().datetime(),
    expectedDuration: zod_1.z.number().min(1).optional(),
    purpose: zod_1.z.nativeEnum(client_1.VisitorPurpose),
    purposeDetails: zod_1.z.string().optional(),
    meetingRoom: zod_1.z.string().optional(),
    accessZones: zod_1.z.array(zod_1.z.string()).optional(),
    parkingRequired: zod_1.z.boolean().optional(),
    requiresNDA: zod_1.z.boolean().optional(),
    requiresHealthCheck: zod_1.z.boolean().optional(),
    customRequirements: zod_1.z.array(zod_1.z.any()).optional()
});
const checkInSchema = zod_1.z.object({
    visitorId: zod_1.z.string(),
    checkInLocation: zod_1.z.string().optional(),
    photoUrl: zod_1.z.string().optional(),
    badgeNumber: zod_1.z.string().optional(),
    healthDeclaration: zod_1.z.record(zod_1.z.any()).optional(),
    termsAccepted: zod_1.z.boolean().optional(),
    dataConsent: zod_1.z.boolean().optional(),
    ndaSigned: zod_1.z.boolean().optional()
});
const checkOutSchema = zod_1.z.object({
    visitorId: zod_1.z.string(),
    checkOutLocation: zod_1.z.string().optional(),
    badgeReturned: zod_1.z.boolean().optional(),
    notes: zod_1.z.string().optional()
});
const generateAccessCodeSchema = zod_1.z.object({
    codeType: zod_1.z.nativeEnum(client_1.AccessCodeType),
    visitorId: zod_1.z.string().optional(),
    expiresAt: zod_1.z.string().datetime(),
    maxUses: zod_1.z.number().min(1).optional(),
    accessZones: zod_1.z.array(zod_1.z.string()).optional(),
    generatedFor: zod_1.z.string().optional(),
    timeRestrictions: zod_1.z.record(zod_1.z.any()).optional(),
    ipRestrictions: zod_1.z.array(zod_1.z.string()).optional()
});
const accessAttemptSchema = zod_1.z.object({
    accessType: zod_1.z.enum(['QR_CODE', 'ACCESS_CODE', 'BADGE', 'MANUAL']),
    accessData: zod_1.z.string(),
    location: zod_1.z.string().optional(),
    accessPoint: zod_1.z.string().optional(),
    deviceInfo: zod_1.z.record(zod_1.z.any()).optional(),
    ipAddress: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional()
});
const createVisitor = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const validatedData = createVisitorSchema.parse(req.body);
        const visitor = await visitorService_1.visitorService.createVisitor(tenantId, {
            ...validatedData,
            validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : undefined,
            validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined
        });
        logger_1.logger.info('Visitor created successfully', {
            tenantId,
            visitorId: visitor.id,
            hostUserId: validatedData.hostUserId
        });
        return response_1.ResponseHelper.success(res, visitor, 201);
    }
    catch (error) {
        logger_1.logger.error('Failed to create visitor', { tenantId: req.tenantId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid visitor data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to create visitor');
    }
};
exports.createVisitor = createVisitor;
const getVisitors = async (req, res) => {
    try {
        const { tenantId } = req;
        const { status, hostUserId, purpose, fromDate, toDate, search, includeExpired, skip, take } = req.query;
        const filters = {};
        if (status) {
            filters.status = Array.isArray(status) ? status : [status];
        }
        if (hostUserId)
            filters.hostUserId = hostUserId;
        if (purpose)
            filters.purpose = purpose;
        if (fromDate)
            filters.fromDate = new Date(fromDate);
        if (toDate)
            filters.toDate = new Date(toDate);
        if (search)
            filters.search = search;
        if (includeExpired)
            filters.includeExpired = includeExpired === 'true';
        const pagination = {
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined
        };
        const result = await visitorService_1.visitorService.getVisitors(tenantId, filters, pagination);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to get visitors', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get visitors');
    }
};
exports.getVisitors = getVisitors;
const getVisitor = async (req, res) => {
    try {
        const { tenantId } = req;
        const { visitorId } = req.params;
        const visitor = await visitorService_1.visitorService.getVisitorById(tenantId, visitorId);
        if (!visitor) {
            return response_1.ResponseHelper.notFound(res, 'Visitor not found');
        }
        return response_1.ResponseHelper.success(res, visitor);
    }
    catch (error) {
        logger_1.logger.error('Failed to get visitor', {
            tenantId: req.tenantId,
            visitorId: req.params.visitorId
        }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get visitor');
    }
};
exports.getVisitor = getVisitor;
const updateVisitor = async (req, res) => {
    try {
        const { tenantId } = req;
        const { visitorId } = req.params;
        const validatedData = updateVisitorSchema.parse(req.body);
        const updateData = {
            ...validatedData,
            validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined
        };
        const visitor = await visitorService_1.visitorService.updateVisitor(tenantId, visitorId, updateData);
        return response_1.ResponseHelper.success(res, visitor);
    }
    catch (error) {
        logger_1.logger.error('Failed to update visitor', {
            tenantId: req.tenantId,
            visitorId: req.params.visitorId
        }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid visitor data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to update visitor');
    }
};
exports.updateVisitor = updateVisitor;
const deleteVisitor = async (req, res) => {
    try {
        const { tenantId } = req;
        const { visitorId } = req.params;
        await visitorService_1.visitorService.deleteVisitor(tenantId, visitorId);
        return response_1.ResponseHelper.success(res, { message: 'Visitor cancelled successfully' });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete visitor', {
            tenantId: req.tenantId,
            visitorId: req.params.visitorId
        }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to delete visitor');
    }
};
exports.deleteVisitor = deleteVisitor;
const getTodaysVisitors = async (req, res) => {
    try {
        const { tenantId } = req;
        const { hostUserId } = req.query;
        const visitors = await visitorService_1.visitorService.getTodaysVisitors(tenantId, hostUserId);
        return response_1.ResponseHelper.success(res, visitors);
    }
    catch (error) {
        logger_1.logger.error('Failed to get today\'s visitors', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get today\'s visitors');
    }
};
exports.getTodaysVisitors = getTodaysVisitors;
const getActiveVisitors = async (req, res) => {
    try {
        const { tenantId } = req;
        const visitors = await visitorService_1.visitorService.getActiveVisitors(tenantId);
        return response_1.ResponseHelper.success(res, visitors);
    }
    catch (error) {
        logger_1.logger.error('Failed to get active visitors', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get active visitors');
    }
};
exports.getActiveVisitors = getActiveVisitors;
const checkInVisitor = async (req, res) => {
    try {
        const { tenantId } = req;
        const validatedData = checkInSchema.parse(req.body);
        const visitor = await visitorService_1.visitorService.checkInVisitor(tenantId, validatedData);
        return response_1.ResponseHelper.success(res, visitor);
    }
    catch (error) {
        logger_1.logger.error('Failed to check in visitor', { tenantId: req.tenantId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid check-in data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to check in visitor');
    }
};
exports.checkInVisitor = checkInVisitor;
const checkOutVisitor = async (req, res) => {
    try {
        const { tenantId } = req;
        const validatedData = checkOutSchema.parse(req.body);
        const visitor = await visitorService_1.visitorService.checkOutVisitor(tenantId, validatedData);
        return response_1.ResponseHelper.success(res, visitor);
    }
    catch (error) {
        logger_1.logger.error('Failed to check out visitor', { tenantId: req.tenantId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid check-out data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to check out visitor');
    }
};
exports.checkOutVisitor = checkOutVisitor;
const extendVisitorStay = async (req, res) => {
    try {
        const { tenantId } = req;
        const { visitorId } = req.params;
        const { newValidUntil, reason } = req.body;
        if (!newValidUntil) {
            return response_1.ResponseHelper.badRequest(res, 'newValidUntil is required');
        }
        const visitor = await visitorService_1.visitorService.extendVisitorStay(tenantId, visitorId, new Date(newValidUntil), reason);
        return response_1.ResponseHelper.success(res, visitor);
    }
    catch (error) {
        logger_1.logger.error('Failed to extend visitor stay', {
            tenantId: req.tenantId,
            visitorId: req.params.visitorId
        }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to extend visitor stay');
    }
};
exports.extendVisitorStay = extendVisitorStay;
const createPreRegistration = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const validatedData = createPreRegistrationSchema.parse(req.body);
        const preRegistration = await visitorService_1.visitorService.createPreRegistration(tenantId, userId, {
            ...validatedData,
            expectedArrival: new Date(validatedData.expectedArrival)
        });
        return response_1.ResponseHelper.success(res, preRegistration, 201);
    }
    catch (error) {
        logger_1.logger.error('Failed to create pre-registration', { tenantId: req.tenantId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid pre-registration data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to create pre-registration');
    }
};
exports.createPreRegistration = createPreRegistration;
const approvePreRegistration = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { preRegistrationId } = req.params;
        const { approvalNotes } = req.body;
        const preRegistration = await visitorService_1.visitorService.approvePreRegistration(tenantId, preRegistrationId, userId, approvalNotes);
        return response_1.ResponseHelper.success(res, preRegistration);
    }
    catch (error) {
        logger_1.logger.error('Failed to approve pre-registration', {
            tenantId: req.tenantId,
            preRegistrationId: req.params.preRegistrationId
        }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to approve pre-registration');
    }
};
exports.approvePreRegistration = approvePreRegistration;
const convertPreRegistrationToVisitor = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { preRegistrationId } = req.params;
        const visitor = await visitorService_1.visitorService.convertPreRegistrationToVisitor(tenantId, preRegistrationId, userId);
        return response_1.ResponseHelper.success(res, visitor, 201);
    }
    catch (error) {
        logger_1.logger.error('Failed to convert pre-registration', {
            tenantId: req.tenantId,
            preRegistrationId: req.params.preRegistrationId
        }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to convert pre-registration');
    }
};
exports.convertPreRegistrationToVisitor = convertPreRegistrationToVisitor;
const generateAccessCode = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const validatedData = generateAccessCodeSchema.parse(req.body);
        const accessCode = await visitorService_1.visitorService.generateAccessCode(tenantId, userId, {
            ...validatedData,
            expiresAt: new Date(validatedData.expiresAt)
        });
        return response_1.ResponseHelper.success(res, accessCode, 201);
    }
    catch (error) {
        logger_1.logger.error('Failed to generate access code', { tenantId: req.tenantId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid access code data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to generate access code');
    }
};
exports.generateAccessCode = generateAccessCode;
const validateAccessCode = async (req, res) => {
    try {
        const { tenantId } = req;
        const { code } = req.params;
        const { location, ipAddress } = req.query;
        const validation = await visitorService_1.visitorService.validateAccessCode(tenantId, code, location, ipAddress);
        return response_1.ResponseHelper.success(res, validation);
    }
    catch (error) {
        logger_1.logger.error('Failed to validate access code', {
            tenantId: req.tenantId,
            code: req.params.code
        }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to validate access code');
    }
};
exports.validateAccessCode = validateAccessCode;
const useAccessCode = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { code } = req.params;
        const { visitorId, location, ipAddress, deviceInfo } = req.body;
        const result = await visitorService_1.visitorService.useAccessCode(tenantId, code, userId, visitorId, location, ipAddress, deviceInfo);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to use access code', {
            tenantId: req.tenantId,
            code: req.params.code
        }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to use access code');
    }
};
exports.useAccessCode = useAccessCode;
const verifyAccess = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const validatedData = accessAttemptSchema.parse(req.body);
        const accessAttempt = {
            tenantId,
            userId,
            ...validatedData
        };
        const result = await accessControlIntegrationService_1.accessControlIntegrationService.verifyAccess(tenantId, accessAttempt);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to verify access', { tenantId: req.tenantId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid access attempt data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to verify access');
    }
};
exports.verifyAccess = verifyAccess;
const processAccessCheckIn = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { visitorId, location, accessPoint, badgeNumber, photoUrl, verificationMethod, verificationData, healthDeclaration, emergencyContact, termsAccepted, dataConsent } = req.body;
        const checkInData = {
            visitorId,
            location,
            accessPoint,
            badgeNumber,
            photoUrl,
            verificationMethod,
            verificationData,
            healthDeclaration,
            emergencyContact,
            termsAccepted,
            dataConsent
        };
        const result = await accessControlIntegrationService_1.accessControlIntegrationService.processCheckIn(tenantId, checkInData, userId);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to process access check-in', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to process access check-in');
    }
};
exports.processAccessCheckIn = processAccessCheckIn;
const processAccessCheckOut = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { visitorId, location, accessPoint, badgeReturned, feedback, rating, notes } = req.body;
        const checkOutData = {
            visitorId,
            location,
            accessPoint,
            badgeReturned,
            feedback,
            rating,
            notes
        };
        const result = await accessControlIntegrationService_1.accessControlIntegrationService.processCheckOut(tenantId, checkOutData, userId);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to process access check-out', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to process access check-out');
    }
};
exports.processAccessCheckOut = processAccessCheckOut;
const getVisitorStatistics = async (req, res) => {
    try {
        const { tenantId } = req;
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return response_1.ResponseHelper.badRequest(res, 'startDate and endDate are required');
        }
        const stats = await visitorService_1.visitorService.getVisitorStatistics(tenantId, new Date(startDate), new Date(endDate));
        return response_1.ResponseHelper.success(res, stats);
    }
    catch (error) {
        logger_1.logger.error('Failed to get visitor statistics', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get visitor statistics');
    }
};
exports.getVisitorStatistics = getVisitorStatistics;
const getVisitorAnalytics = async (req, res) => {
    try {
        const { tenantId } = req;
        const { startDate, endDate, period, skip, take } = req.query;
        if (!startDate || !endDate) {
            return response_1.ResponseHelper.badRequest(res, 'startDate and endDate are required');
        }
        const filters = {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            period: period
        };
        const pagination = {
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined
        };
        const result = await visitorAnalyticsService_1.visitorAnalyticsService.getAnalytics(tenantId, filters, pagination);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to get visitor analytics', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get visitor analytics');
    }
};
exports.getVisitorAnalytics = getVisitorAnalytics;
const getVisitorTrends = async (req, res) => {
    try {
        const { tenantId } = req;
        const { startDate, endDate, period } = req.query;
        if (!startDate || !endDate || !period) {
            return response_1.ResponseHelper.badRequest(res, 'startDate, endDate, and period are required');
        }
        const trends = await visitorAnalyticsService_1.visitorAnalyticsService.getVisitorTrends(tenantId, period, new Date(startDate), new Date(endDate));
        return response_1.ResponseHelper.success(res, trends);
    }
    catch (error) {
        logger_1.logger.error('Failed to get visitor trends', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get visitor trends');
    }
};
exports.getVisitorTrends = getVisitorTrends;
const getPeakAnalysis = async (req, res) => {
    try {
        const { tenantId } = req;
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return response_1.ResponseHelper.badRequest(res, 'startDate and endDate are required');
        }
        const analysis = await visitorAnalyticsService_1.visitorAnalyticsService.getPeakAnalysis(tenantId, new Date(startDate), new Date(endDate));
        return response_1.ResponseHelper.success(res, analysis);
    }
    catch (error) {
        logger_1.logger.error('Failed to get peak analysis', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get peak analysis');
    }
};
exports.getPeakAnalysis = getPeakAnalysis;
const getHostPerformance = async (req, res) => {
    try {
        const { tenantId } = req;
        const { startDate, endDate, hostUserId } = req.query;
        if (!startDate || !endDate) {
            return response_1.ResponseHelper.badRequest(res, 'startDate and endDate are required');
        }
        const performance = await visitorAnalyticsService_1.visitorAnalyticsService.getHostPerformance(tenantId, new Date(startDate), new Date(endDate), hostUserId);
        return response_1.ResponseHelper.success(res, performance);
    }
    catch (error) {
        logger_1.logger.error('Failed to get host performance', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get host performance');
    }
};
exports.getHostPerformance = getHostPerformance;
const getConversionFunnel = async (req, res) => {
    try {
        const { tenantId } = req;
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return response_1.ResponseHelper.badRequest(res, 'startDate and endDate are required');
        }
        const funnel = await visitorAnalyticsService_1.visitorAnalyticsService.getConversionFunnel(tenantId, new Date(startDate), new Date(endDate));
        return response_1.ResponseHelper.success(res, funnel);
    }
    catch (error) {
        logger_1.logger.error('Failed to get conversion funnel', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get conversion funnel');
    }
};
exports.getConversionFunnel = getConversionFunnel;
const getAccessControlMetrics = async (req, res) => {
    try {
        const { tenantId } = req;
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return response_1.ResponseHelper.badRequest(res, 'startDate and endDate are required');
        }
        const metrics = await accessControlIntegrationService_1.accessControlIntegrationService.getAccessControlMetrics(tenantId, new Date(startDate), new Date(endDate));
        return response_1.ResponseHelper.success(res, metrics);
    }
    catch (error) {
        logger_1.logger.error('Failed to get access control metrics', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get access control metrics');
    }
};
exports.getAccessControlMetrics = getAccessControlMetrics;
const getNotifications = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { type, status, urgency, unreadOnly, skip, take } = req.query;
        const filters = {
            recipientId: userId
        };
        if (type)
            filters.type = Array.isArray(type) ? type : [type];
        if (status)
            filters.status = Array.isArray(status) ? status : [status];
        if (urgency)
            filters.urgency = Array.isArray(urgency) ? urgency : [urgency];
        if (unreadOnly === 'true')
            filters.unreadOnly = true;
        const pagination = {
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined
        };
        const result = await visitorNotificationService_1.visitorNotificationService.getNotifications(tenantId, filters, pagination);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to get notifications', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get notifications');
    }
};
exports.getNotifications = getNotifications;
const markNotificationAsRead = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { notificationId } = req.params;
        const notification = await visitorNotificationService_1.visitorNotificationService.markAsRead(tenantId, notificationId, userId);
        return response_1.ResponseHelper.success(res, notification);
    }
    catch (error) {
        logger_1.logger.error('Failed to mark notification as read', {
            tenantId: req.tenantId,
            notificationId: req.params.notificationId
        }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to mark notification as read');
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const count = await visitorNotificationService_1.visitorNotificationService.markAllAsRead(tenantId, userId);
        return response_1.ResponseHelper.success(res, { message: `${count} notifications marked as read` });
    }
    catch (error) {
        logger_1.logger.error('Failed to mark all notifications as read', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to mark all notifications as read');
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
const acknowledgeNotification = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { notificationId } = req.params;
        const notification = await visitorNotificationService_1.visitorNotificationService.markAsAcknowledged(tenantId, notificationId, userId);
        return response_1.ResponseHelper.success(res, notification);
    }
    catch (error) {
        logger_1.logger.error('Failed to acknowledge notification', {
            tenantId: req.tenantId,
            notificationId: req.params.notificationId
        }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to acknowledge notification');
    }
};
exports.acknowledgeNotification = acknowledgeNotification;
const getNotificationStats = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { startDate, endDate } = req.query;
        const stats = await visitorNotificationService_1.visitorNotificationService.getNotificationStats(tenantId, userId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return response_1.ResponseHelper.success(res, stats);
    }
    catch (error) {
        logger_1.logger.error('Failed to get notification stats', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get notification stats');
    }
};
exports.getNotificationStats = getNotificationStats;
//# sourceMappingURL=visitorController.js.map