import { Response } from 'express';
import { z } from 'zod';
import { ResponseHelper } from '../utils/response';
import { BaseRequest, AuthenticatedRequest, ErrorCode, HttpStatusCode } from '../types/api';
import { logger } from '../utils/logger';
import { visitorService } from '../services/visitorService';
import { visitorNotificationService } from '../services/visitorNotificationService';
import { visitorAnalyticsService } from '../services/visitorAnalyticsService';
import { accessControlIntegrationService } from '../services/accessControlIntegrationService';
import {
  VisitorStatus,
  VisitorPurpose,
  PreRegistrationStatus,
  AccessCodeType,
  NotificationType,
  NotificationUrgency,
  AnalyticsPeriod
} from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createVisitorSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
  hostUserId: z.string(),
  purpose: z.nativeEnum(VisitorPurpose),
  purposeDetails: z.string().optional(),
  expectedDuration: z.number().min(1).optional(),
  meetingRoom: z.string().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  accessZones: z.array(z.string()).optional(),
  preRegistrationId: z.string().optional(),
  healthDeclaration: z.record(z.any()).optional(),
  emergencyContact: z.record(z.any()).optional()
});

const updateVisitorSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  photoUrl: z.string().optional(),
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
  purpose: z.nativeEnum(VisitorPurpose).optional(),
  purposeDetails: z.string().optional(),
  expectedDuration: z.number().min(1).optional(),
  meetingRoom: z.string().optional(),
  validUntil: z.string().datetime().optional(),
  accessZones: z.array(z.string()).optional(),
  healthDeclaration: z.record(z.any()).optional(),
  emergencyContact: z.record(z.any()).optional()
});

const createPreRegistrationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  hostUserId: z.string(),
  expectedArrival: z.string().datetime(),
  expectedDuration: z.number().min(1).optional(),
  purpose: z.nativeEnum(VisitorPurpose),
  purposeDetails: z.string().optional(),
  meetingRoom: z.string().optional(),
  accessZones: z.array(z.string()).optional(),
  parkingRequired: z.boolean().optional(),
  requiresNDA: z.boolean().optional(),
  requiresHealthCheck: z.boolean().optional(),
  customRequirements: z.array(z.any()).optional()
});

const checkInSchema = z.object({
  visitorId: z.string(),
  checkInLocation: z.string().optional(),
  photoUrl: z.string().optional(),
  badgeNumber: z.string().optional(),
  healthDeclaration: z.record(z.any()).optional(),
  termsAccepted: z.boolean().optional(),
  dataConsent: z.boolean().optional(),
  ndaSigned: z.boolean().optional()
});

const checkOutSchema = z.object({
  visitorId: z.string(),
  checkOutLocation: z.string().optional(),
  badgeReturned: z.boolean().optional(),
  notes: z.string().optional()
});

const generateAccessCodeSchema = z.object({
  codeType: z.nativeEnum(AccessCodeType),
  visitorId: z.string().optional(),
  expiresAt: z.string().datetime(),
  maxUses: z.number().min(1).optional(),
  accessZones: z.array(z.string()).optional(),
  generatedFor: z.string().optional(),
  timeRestrictions: z.record(z.any()).optional(),
  ipRestrictions: z.array(z.string()).optional()
});

const accessAttemptSchema = z.object({
  accessType: z.enum(['QR_CODE', 'ACCESS_CODE', 'BADGE', 'MANUAL']),
  accessData: z.string(),
  location: z.string().optional(),
  accessPoint: z.string().optional(),
  deviceInfo: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
});

// ============================================================================
// VISITOR MANAGEMENT ENDPOINTS
// ============================================================================

export const createVisitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const validatedData = createVisitorSchema.parse(req.body);

    const visitor = await visitorService.createVisitor(tenantId, {
      ...validatedData,
      validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : undefined,
      validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined
    });

    logger.info('Visitor created successfully', { 
      tenantId, 
      visitorId: visitor.id, 
      hostUserId: validatedData.hostUserId 
    });

    return ResponseHelper.success(res, visitor, 'Visitor created successfully', HttpStatusCode.CREATED);
  } catch (error) {
    logger.error('Failed to create visitor', { tenantId: req.tenantId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid visitor data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to create visitor');
  }
};

export const getVisitors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { 
      status, 
      hostUserId, 
      purpose, 
      fromDate, 
      toDate, 
      search, 
      includeExpired,
      skip, 
      take 
    } = req.query;

    const filters: any = {};
    if (status) {
      filters.status = Array.isArray(status) ? status : [status];
    }
    if (hostUserId) filters.hostUserId = hostUserId as string;
    if (purpose) filters.purpose = purpose;
    if (fromDate) filters.fromDate = new Date(fromDate as string);
    if (toDate) filters.toDate = new Date(toDate as string);
    if (search) filters.search = search as string;
    if (includeExpired) filters.includeExpired = includeExpired === 'true';

    const pagination = {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined
    };

    const result = await visitorService.getVisitors(tenantId, filters, pagination);

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to get visitors', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get visitors');
  }
};

export const getVisitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { visitorId } = req.params;

    const visitor = await visitorService.getVisitorById(tenantId, visitorId);

    if (!visitor) {
      return ResponseHelper.notFound(res, 'Visitor not found');
    }

    return ResponseHelper.success(res, visitor);
  } catch (error) {
    logger.error('Failed to get visitor', { 
      tenantId: req.tenantId, 
      visitorId: req.params.visitorId 
    }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get visitor');
  }
};

export const updateVisitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { visitorId } = req.params;
    const validatedData = updateVisitorSchema.parse(req.body);

    const updateData = {
      ...validatedData,
      validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined
    };

    const visitor = await visitorService.updateVisitor(tenantId, visitorId, updateData);

    return ResponseHelper.success(res, visitor);
  } catch (error) {
    logger.error('Failed to update visitor', { 
      tenantId: req.tenantId, 
      visitorId: req.params.visitorId 
    }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid visitor data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to update visitor');
  }
};

export const deleteVisitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { visitorId } = req.params;

    await visitorService.deleteVisitor(tenantId, visitorId);

    return ResponseHelper.success(res, { message: 'Visitor cancelled successfully' });
  } catch (error) {
    logger.error('Failed to delete visitor', { 
      tenantId: req.tenantId, 
      visitorId: req.params.visitorId 
    }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to delete visitor');
  }
};

export const getTodaysVisitors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { hostUserId } = req.query;

    const visitors = await visitorService.getTodaysVisitors(
      tenantId, 
      hostUserId as string
    );

    return ResponseHelper.success(res, visitors);
  } catch (error) {
    logger.error('Failed to get today\'s visitors', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get today\'s visitors');
  }
};

export const getActiveVisitors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;

    const visitors = await visitorService.getActiveVisitors(tenantId);

    return ResponseHelper.success(res, visitors);
  } catch (error) {
    logger.error('Failed to get active visitors', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get active visitors');
  }
};

// ============================================================================
// CHECK-IN/CHECK-OUT ENDPOINTS
// ============================================================================

export const checkInVisitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const validatedData = checkInSchema.parse(req.body);

    const visitor = await visitorService.checkInVisitor(tenantId, validatedData);

    return ResponseHelper.success(res, visitor);
  } catch (error) {
    logger.error('Failed to check in visitor', { tenantId: req.tenantId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid check-in data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to check in visitor');
  }
};

export const checkOutVisitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const validatedData = checkOutSchema.parse(req.body);

    const visitor = await visitorService.checkOutVisitor(tenantId, validatedData);

    return ResponseHelper.success(res, visitor);
  } catch (error) {
    logger.error('Failed to check out visitor', { tenantId: req.tenantId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid check-out data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to check out visitor');
  }
};

export const extendVisitorStay = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { visitorId } = req.params;
    const { newValidUntil, reason } = req.body;

    if (!newValidUntil) {
      return ResponseHelper.badRequest(res, 'newValidUntil is required');
    }

    const visitor = await visitorService.extendVisitorStay(
      tenantId,
      visitorId,
      new Date(newValidUntil),
      reason
    );

    return ResponseHelper.success(res, visitor);
  } catch (error) {
    logger.error('Failed to extend visitor stay', { 
      tenantId: req.tenantId, 
      visitorId: req.params.visitorId 
    }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to extend visitor stay');
  }
};

// ============================================================================
// PRE-REGISTRATION ENDPOINTS
// ============================================================================

export const createPreRegistration = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const validatedData = createPreRegistrationSchema.parse(req.body);

    const preRegistration = await visitorService.createPreRegistration(tenantId, userId, {
      ...validatedData,
      expectedArrival: new Date(validatedData.expectedArrival)
    });

    return ResponseHelper.success(res, preRegistration, 'Pre-registration created successfully', HttpStatusCode.CREATED);
  } catch (error) {
    logger.error('Failed to create pre-registration', { tenantId: req.tenantId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid pre-registration data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to create pre-registration');
  }
};

export const approvePreRegistration = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { preRegistrationId } = req.params;
    const { approvalNotes } = req.body;

    const preRegistration = await visitorService.approvePreRegistration(
      tenantId,
      preRegistrationId,
      userId,
      approvalNotes
    );

    return ResponseHelper.success(res, preRegistration);
  } catch (error) {
    logger.error('Failed to approve pre-registration', { 
      tenantId: req.tenantId, 
      preRegistrationId: req.params.preRegistrationId 
    }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to approve pre-registration');
  }
};

export const convertPreRegistrationToVisitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { preRegistrationId } = req.params;

    const visitor = await visitorService.convertPreRegistrationToVisitor(
      tenantId,
      preRegistrationId,
      userId
    );

    return ResponseHelper.success(res, visitor, 'Visitor converted from pre-registration successfully', HttpStatusCode.CREATED);
  } catch (error) {
    logger.error('Failed to convert pre-registration', { 
      tenantId: req.tenantId, 
      preRegistrationId: req.params.preRegistrationId 
    }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to convert pre-registration');
  }
};

// ============================================================================
// ACCESS CODE ENDPOINTS
// ============================================================================

export const generateAccessCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const validatedData = generateAccessCodeSchema.parse(req.body);

    const accessCode = await visitorService.generateAccessCode(tenantId, userId, {
      ...validatedData,
      expiresAt: new Date(validatedData.expiresAt)
    });

    return ResponseHelper.success(res, accessCode, 'Access code generated successfully', HttpStatusCode.CREATED);
  } catch (error) {
    logger.error('Failed to generate access code', { tenantId: req.tenantId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid access code data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to generate access code');
  }
};

export const validateAccessCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { code } = req.params;
    const { location, ipAddress } = req.query;

    const validation = await visitorService.validateAccessCode(
      tenantId,
      code,
      location as string,
      ipAddress as string
    );

    return ResponseHelper.success(res, validation);
  } catch (error) {
    logger.error('Failed to validate access code', { 
      tenantId: req.tenantId, 
      code: req.params.code 
    }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to validate access code');
  }
};

export const useAccessCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { code } = req.params;
    const { visitorId, location, ipAddress, deviceInfo } = req.body;

    const result = await visitorService.useAccessCode(
      tenantId,
      code,
      userId,
      visitorId,
      location,
      ipAddress,
      deviceInfo
    );

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to use access code', { 
      tenantId: req.tenantId, 
      code: req.params.code 
    }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to use access code');
  }
};

// ============================================================================
// ACCESS CONTROL ENDPOINTS
// ============================================================================

export const verifyAccess = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const validatedData = accessAttemptSchema.parse(req.body);

    const accessAttempt = {
      tenantId,
      userId,
      ...validatedData
    };

    const result = await accessControlIntegrationService.verifyAccess(tenantId, accessAttempt);

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to verify access', { tenantId: req.tenantId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid access attempt data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to verify access');
  }
};

export const processAccessCheckIn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { 
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
    } = req.body;

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

    const result = await accessControlIntegrationService.processCheckIn(
      tenantId,
      checkInData,
      userId
    );

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to process access check-in', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to process access check-in');
  }
};

export const processAccessCheckOut = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { 
      visitorId, 
      location, 
      accessPoint, 
      badgeReturned,
      feedback,
      rating,
      notes
    } = req.body;

    const checkOutData = {
      visitorId,
      location,
      accessPoint,
      badgeReturned,
      feedback,
      rating,
      notes
    };

    const result = await accessControlIntegrationService.processCheckOut(
      tenantId,
      checkOutData,
      userId
    );

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to process access check-out', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to process access check-out');
  }
};

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

export const getVisitorStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return ResponseHelper.badRequest(res, 'startDate and endDate are required');
    }

    const stats = await visitorService.getVisitorStatistics(
      tenantId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    return ResponseHelper.success(res, stats);
  } catch (error) {
    logger.error('Failed to get visitor statistics', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get visitor statistics');
  }
};

export const getVisitorAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate, period, skip, take } = req.query;

    if (!startDate || !endDate) {
      return ResponseHelper.badRequest(res, 'startDate and endDate are required');
    }

    const filters = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      period: period as AnalyticsPeriod
    };

    const pagination = {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined
    };

    const result = await visitorAnalyticsService.getAnalytics(tenantId, filters, pagination);

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to get visitor analytics', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get visitor analytics');
  }
};

export const getVisitorTrends = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate, period } = req.query;

    if (!startDate || !endDate || !period) {
      return ResponseHelper.badRequest(res, 'startDate, endDate, and period are required');
    }

    const trends = await visitorAnalyticsService.getVisitorTrends(
      tenantId,
      period as AnalyticsPeriod,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    return ResponseHelper.success(res, trends);
  } catch (error) {
    logger.error('Failed to get visitor trends', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get visitor trends');
  }
};

export const getPeakAnalysis = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return ResponseHelper.badRequest(res, 'startDate and endDate are required');
    }

    const analysis = await visitorAnalyticsService.getPeakAnalysis(
      tenantId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    return ResponseHelper.success(res, analysis);
  } catch (error) {
    logger.error('Failed to get peak analysis', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get peak analysis');
  }
};

export const getHostPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate, hostUserId } = req.query;

    if (!startDate || !endDate) {
      return ResponseHelper.badRequest(res, 'startDate and endDate are required');
    }

    const performance = await visitorAnalyticsService.getHostPerformance(
      tenantId,
      new Date(startDate as string),
      new Date(endDate as string),
      hostUserId as string
    );

    return ResponseHelper.success(res, performance);
  } catch (error) {
    logger.error('Failed to get host performance', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get host performance');
  }
};

export const getConversionFunnel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return ResponseHelper.badRequest(res, 'startDate and endDate are required');
    }

    const funnel = await visitorAnalyticsService.getConversionFunnel(
      tenantId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    return ResponseHelper.success(res, funnel);
  } catch (error) {
    logger.error('Failed to get conversion funnel', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get conversion funnel');
  }
};

export const getAccessControlMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return ResponseHelper.badRequest(res, 'startDate and endDate are required');
    }

    const metrics = await accessControlIntegrationService.getAccessControlMetrics(
      tenantId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    return ResponseHelper.success(res, metrics);
  } catch (error) {
    logger.error('Failed to get access control metrics', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get access control metrics');
  }
};

// ============================================================================
// NOTIFICATION ENDPOINTS
// ============================================================================

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { type, status, urgency, unreadOnly, skip, take } = req.query;

    const filters: any = {
      recipientId: userId
    };

    if (type) filters.type = Array.isArray(type) ? type : [type];
    if (status) filters.status = Array.isArray(status) ? status : [status];
    if (urgency) filters.urgency = Array.isArray(urgency) ? urgency : [urgency];
    if (unreadOnly === 'true') filters.unreadOnly = true;

    const pagination = {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined
    };

    const result = await visitorNotificationService.getNotifications(tenantId, filters, pagination);

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to get notifications', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get notifications');
  }
};

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { notificationId } = req.params;

    const notification = await visitorNotificationService.markAsRead(tenantId, notificationId, userId);

    return ResponseHelper.success(res, notification);
  } catch (error) {
    logger.error('Failed to mark notification as read', { 
      tenantId: req.tenantId, 
      notificationId: req.params.notificationId 
    }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to mark notification as read');
  }
};

export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;

    const count = await visitorNotificationService.markAllAsRead(tenantId, userId);

    return ResponseHelper.success(res, { message: `${count} notifications marked as read` });
  } catch (error) {
    logger.error('Failed to mark all notifications as read', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to mark all notifications as read');
  }
};

export const acknowledgeNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { notificationId } = req.params;

    const notification = await visitorNotificationService.markAsAcknowledged(tenantId, notificationId, userId);

    return ResponseHelper.success(res, notification);
  } catch (error) {
    logger.error('Failed to acknowledge notification', { 
      tenantId: req.tenantId, 
      notificationId: req.params.notificationId 
    }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to acknowledge notification');
  }
};

export const getNotificationStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { startDate, endDate } = req.query;

    const stats = await visitorNotificationService.getNotificationStats(
      tenantId,
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    return ResponseHelper.success(res, stats);
  } catch (error) {
    logger.error('Failed to get notification stats', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get notification stats');
  }
};