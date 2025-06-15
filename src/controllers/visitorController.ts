import { Request, Response } from 'express';
import { z } from 'zod';
import { ResponseHelper } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { visitorService } from '../services/visitorService';
import { visitorPreRegistrationService } from '../services/visitorPreRegistrationService';
import { VisitorPurpose, VisitorStatus, PreRegistrationStatus } from '@prisma/client';

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
  expectedDuration: z.number().positive().optional(),
  meetingRoom: z.string().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  accessZones: z.array(z.string()).optional(),
  preRegistrationId: z.string().optional(),
  healthDeclaration: z.record(z.any()).optional(),
  emergencyContact: z.record(z.any()).optional(),
});

const updateVisitorSchema = createVisitorSchema.partial();

const checkInSchema = z.object({
  visitorId: z.string(),
  checkInLocation: z.string().optional(),
  photoUrl: z.string().url().optional(),
  badgeNumber: z.string().optional(),
  healthDeclaration: z.record(z.any()).optional(),
  termsAccepted: z.boolean().optional(),
  dataConsent: z.boolean().optional(),
  ndaSigned: z.boolean().optional(),
});

const checkOutSchema = z.object({
  visitorId: z.string(),
  checkOutLocation: z.string().optional(),
  badgeReturned: z.boolean().optional(),
  notes: z.string().optional(),
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
  expectedDuration: z.number().positive().optional(),
  purpose: z.nativeEnum(VisitorPurpose),
  purposeDetails: z.string().optional(),
  meetingRoom: z.string().optional(),
  accessZones: z.array(z.string()).optional(),
  parkingRequired: z.boolean().optional(),
  requiresNDA: z.boolean().optional(),
  requiresHealthCheck: z.boolean().optional(),
  customRequirements: z.array(z.string()).optional(),
  autoApprove: z.boolean().optional(),
});

const processApprovalSchema = z.object({
  approve: z.boolean(),
  notes: z.string().optional(),
  accessZones: z.array(z.string()).optional(),
  parkingSpot: z.string().optional(),
  customRequirements: z.array(z.string()).optional(),
});

// ============================================================================
// VISITOR MANAGEMENT
// ============================================================================

export const createVisitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const validatedData = createVisitorSchema.parse(req.body);

    const createData = {
      ...validatedData,
      validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : undefined,
      validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined,
    };

    const visitor = await visitorService.createVisitor(tenantId, createData);

    logger.info('Visitor created successfully', { tenantId, visitorId: visitor.id });
    return ResponseHelper.success(res, visitor, 201);
  } catch (error) {
    logger.error('Failed to create visitor', { tenantId: req.tenantId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid visitor data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to create visitor');
  }
};

export const updateVisitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { visitorId } = req.params;
    const validatedData = updateVisitorSchema.parse(req.body);

    const updateData = {
      ...validatedData,
      validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined,
    };

    const visitor = await visitorService.updateVisitor(tenantId, visitorId, updateData);

    return ResponseHelper.success(res, visitor);
  } catch (error) {
    logger.error('Failed to update visitor', { tenantId: req.tenantId, visitorId: req.params.visitorId }, error as Error);
    
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
    logger.error('Failed to delete visitor', { tenantId: req.tenantId, visitorId: req.params.visitorId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to delete visitor');
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
    logger.error('Failed to get visitor', { tenantId: req.tenantId, visitorId: req.params.visitorId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get visitor');
  }
};

export const getVisitors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { status, hostUserId, purpose, fromDate, toDate, search, includeExpired, skip, take } = req.query;

    const filters: any = {};
    if (status) filters.status = Array.isArray(status) ? status as VisitorStatus[] : [status as VisitorStatus];
    if (hostUserId) filters.hostUserId = hostUserId as string;
    if (purpose) filters.purpose = purpose as VisitorPurpose;
    if (fromDate) filters.fromDate = new Date(fromDate as string);
    if (toDate) filters.toDate = new Date(toDate as string);
    if (search) filters.search = search as string;
    if (includeExpired) filters.includeExpired = includeExpired === 'true';

    const pagination = {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
    };

    const result = await visitorService.getVisitors(tenantId, filters, pagination);

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to get visitors', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get visitors');
  }
};

export const getTodaysVisitors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { hostUserId } = req.query;

    const visitors = await visitorService.getTodaysVisitors(
      tenantId, 
      hostUserId as string || undefined
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

export const getVisitorByQRCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { qrCode } = req.params;

    const visitor = await visitorService.getVisitorByQRCode(tenantId, qrCode);

    if (!visitor) {
      return ResponseHelper.notFound(res, 'Visitor not found');
    }

    return ResponseHelper.success(res, visitor);
  } catch (error) {
    logger.error('Failed to get visitor by QR code', { tenantId: req.tenantId, qrCode: req.params.qrCode }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get visitor by QR code');
  }
};

// ============================================================================
// CHECK-IN/CHECK-OUT
// ============================================================================

export const checkInVisitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const validatedData = checkInSchema.parse(req.body);

    const visitor = await visitorService.checkInVisitor(tenantId, validatedData);

    logger.info('Visitor checked in successfully', { tenantId, visitorId: validatedData.visitorId });
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

    logger.info('Visitor checked out successfully', { tenantId, visitorId: validatedData.visitorId });
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
    const { validUntil, reason } = req.body;

    if (!validUntil) {
      return ResponseHelper.badRequest(res, 'validUntil is required');
    }

    const visitor = await visitorService.extendVisitorStay(
      tenantId, 
      visitorId, 
      new Date(validUntil), 
      reason
    );

    return ResponseHelper.success(res, visitor);
  } catch (error) {
    logger.error('Failed to extend visitor stay', { tenantId: req.tenantId, visitorId: req.params.visitorId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to extend visitor stay');
  }
};

// ============================================================================
// PRE-REGISTRATION
// ============================================================================

export const createPreRegistration = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const validatedData = createPreRegistrationSchema.parse(req.body);

    const createData = {
      ...validatedData,
      expectedArrival: new Date(validatedData.expectedArrival),
    };

    const preRegistration = await visitorPreRegistrationService.createPreRegistration(tenantId, createData);

    logger.info('Pre-registration created successfully', { tenantId, preRegistrationId: preRegistration.id });
    return ResponseHelper.success(res, preRegistration, 201);
  } catch (error) {
    logger.error('Failed to create pre-registration', { tenantId: req.tenantId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid pre-registration data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to create pre-registration');
  }
};

export const getPreRegistrations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { status, hostUserId, fromDate, toDate, search, pendingOnly, skip, take } = req.query;

    const filters: any = {};
    if (status) filters.status = Array.isArray(status) ? status as PreRegistrationStatus[] : [status as PreRegistrationStatus];
    if (hostUserId) filters.hostUserId = hostUserId as string;
    if (fromDate) filters.fromDate = new Date(fromDate as string);
    if (toDate) filters.toDate = new Date(toDate as string);
    if (search) filters.search = search as string;
    if (pendingOnly) filters.pendingOnly = pendingOnly === 'true';

    const pagination = {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
    };

    const result = await visitorPreRegistrationService.getPreRegistrations(tenantId, filters, pagination);

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to get pre-registrations', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get pre-registrations');
  }
};

export const processPreRegistrationApproval = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { preRegistrationId } = req.params;
    const validatedData = processApprovalSchema.parse(req.body);

    const preRegistration = await visitorPreRegistrationService.processApproval(
      tenantId, 
      preRegistrationId, 
      userId, 
      validatedData
    );

    logger.info('Pre-registration approval processed', { tenantId, preRegistrationId, approved: validatedData.approve });
    return ResponseHelper.success(res, preRegistration);
  } catch (error) {
    logger.error('Failed to process pre-registration approval', { tenantId: req.tenantId, preRegistrationId: req.params.preRegistrationId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid approval data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to process approval');
  }
};

export const sendInvitation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { preRegistrationId } = req.params;
    const { message, includeQRCode, includeDirections, includeParking } = req.body;

    const result = await visitorPreRegistrationService.sendInvitation(tenantId, {
      preRegistrationId,
      message,
      includeQRCode,
      includeDirections,
      includeParking,
    });

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to send invitation', { tenantId: req.tenantId, preRegistrationId: req.params.preRegistrationId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to send invitation');
  }
};

export const convertPreRegistrationToVisitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { preRegistrationId } = req.params;
    const additionalData = req.body;

    const result = await visitorPreRegistrationService.convertToVisitor(
      tenantId, 
      preRegistrationId, 
      additionalData
    );

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to convert pre-registration to visitor', { tenantId: req.tenantId, preRegistrationId: req.params.preRegistrationId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to convert to visitor');
  }
};

// ============================================================================
// ANALYTICS AND REPORTING
// ============================================================================

export const getVisitorStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate } = req.query;

    const defaultEndDate = new Date();
    const defaultStartDate = new Date(defaultEndDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    const statistics = await visitorService.getVisitorStatistics(
      tenantId,
      startDate ? new Date(startDate as string) : defaultStartDate,
      endDate ? new Date(endDate as string) : defaultEndDate
    );

    return ResponseHelper.success(res, statistics);
  } catch (error) {
    logger.error('Failed to get visitor statistics', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get visitor statistics');
  }
};

export const getVisitorHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { visitorId } = req.params;

    const history = await visitorService.getVisitorHistory(tenantId, visitorId);

    return ResponseHelper.success(res, history);
  } catch (error) {
    logger.error('Failed to get visitor history', { tenantId: req.tenantId, visitorId: req.params.visitorId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get visitor history');
  }
};

export const getPreRegistrationStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate } = req.query;

    const defaultEndDate = new Date();
    const defaultStartDate = new Date(defaultEndDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    const statistics = await visitorPreRegistrationService.getPreRegistrationStatistics(
      tenantId,
      startDate ? new Date(startDate as string) : defaultStartDate,
      endDate ? new Date(endDate as string) : defaultEndDate
    );

    return ResponseHelper.success(res, statistics);
  } catch (error) {
    logger.error('Failed to get pre-registration statistics', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get pre-registration statistics');
  }
};

export const getPendingApprovals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { hostUserId } = req.query;

    const preRegistrations = await visitorPreRegistrationService.getPendingApprovals(
      tenantId, 
      hostUserId as string || undefined
    );

    return ResponseHelper.success(res, preRegistrations);
  } catch (error) {
    logger.error('Failed to get pending approvals', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get pending approvals');
  }
};

export const getUpcomingVisits = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { hostUserId, days } = req.query;

    const preRegistrations = await visitorPreRegistrationService.getUpcomingVisits(
      tenantId,
      hostUserId as string || undefined,
      days ? parseInt(days as string) : undefined
    );

    return ResponseHelper.success(res, preRegistrations);
  } catch (error) {
    logger.error('Failed to get upcoming visits', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get upcoming visits');
  }
};