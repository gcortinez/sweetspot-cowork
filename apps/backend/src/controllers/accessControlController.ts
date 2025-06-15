import { Response } from 'express';
import { z } from 'zod';
import { accessControlService, CreateQRCodeRequest, ScanQRCodeRequest, AccessRuleData, ScanResultData } from '../services/accessControlService';
import { ResponseHelper } from '../utils/response';
import { ApiResponse } from '../types/api';
import { ValidationError } from '../utils/errors';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../types/api';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getTenantId = (req: AuthenticatedRequest): string => {
  if (!req.user?.tenantId) {
    throw new ValidationError('Tenant context required');
  }
  return req.user.tenantId;
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateQRCodeSchema = z.object({
  type: z.enum(['MEMBER', 'VISITOR', 'TEMPORARY', 'SERVICE', 'EMERGENCY', 'ADMIN']),
  userId: z.string().optional(),
  visitorId: z.string().optional(),
  validFor: z.number().min(1).max(168), // 1 hour to 1 week
  permissions: z.array(z.string()),
  maxScans: z.number().optional(),
  metadata: z.record(z.any()).optional()
});

const ScanQRCodeSchema = z.object({
  qrCodeData: z.string().min(1),
  location: z.string().optional(),
  deviceInfo: z.record(z.any()).optional(),
  scannedBy: z.string().optional()
});

const CreateAccessRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  zoneId: z.string().optional(),
  membershipTypes: z.array(z.string()),
  planTypes: z.array(z.string()),
  userRoles: z.array(z.string()),
  timeRestrictions: z.record(z.any()),
  dayRestrictions: z.array(z.number().min(0).max(6)),
  maxOccupancy: z.number().optional(),
  requiresApproval: z.boolean(),
  priority: z.number(),
  validFrom: z.string().optional(),
  validTo: z.string().optional()
});

const CreateAccessZoneSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  zoneType: z.enum(['GENERAL', 'MEETING_ROOM', 'PRIVATE_OFFICE', 'KITCHEN', 'PHONE_BOOTH', 'STORAGE', 'ADMIN', 'PARKING', 'ROOFTOP', 'RESTRICTED']),
  restrictions: z.record(z.any()).optional(),
  isActive: z.boolean().optional()
});

// ============================================================================
// QR CODE CONTROLLERS
// ============================================================================

export const generateQRCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = CreateQRCodeSchema.parse(req.body);

    // Validate that user or visitor exists if specified
    if (validatedData.userId) {
      // Could add user validation here
    }
    if (validatedData.visitorId) {
      // Could add visitor validation here
    }

    const qrCode = await accessControlService.generateQRCode(tenantId, validatedData as CreateQRCodeRequest);
    
    return ResponseHelper.success(res, qrCode, 'QR code generated successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

export const scanQRCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = ScanQRCodeSchema.parse(req.body);

    const result = await accessControlService.scanQRCode(tenantId, validatedData as ScanQRCodeRequest);
    
    if (result.success) {
      return ResponseHelper.success(res, result, 'QR code scanned successfully');
    } else {
      return ResponseHelper.forbidden(res, result.message);
    }
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

export const getUserQRCodes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.params.userId || req.user!.id;

    const qrCodes = await accessControlService.getUserQRCodes(tenantId, userId);
    
    return ResponseHelper.success(res, qrCodes, 'QR codes retrieved successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

export const revokeQRCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { qrCodeId } = req.params;
    const revokedBy = req.user!.id;

    const result = await accessControlService.revokeQRCode(tenantId, qrCodeId, revokedBy);
    
    return ResponseHelper.success(res, result, 'QR code revoked successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

// ============================================================================
// ACCESS ZONE CONTROLLERS
// ============================================================================

export const createAccessZone = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = CreateAccessZoneSchema.parse(req.body);

    const zone = await prisma.accessZone.create({
      data: {
        tenantId,
        name: validatedData.name,
        description: validatedData.description,
        zoneType: validatedData.zoneType,
        restrictions: validatedData.restrictions || {},
        isActive: validatedData.isActive ?? true
      }
    });
    
    return ResponseHelper.success(res, zone, 'Access zone created successfully', 201);
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

export const getAccessZones = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);

    const zones = await prisma.accessZone.findMany({
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
    
    return ResponseHelper.success(res, zones, 'Access zones retrieved successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

export const updateAccessZone = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { zoneId } = req.params;
    const validatedData = CreateAccessZoneSchema.partial().parse(req.body);

    const zone = await prisma.accessZone.update({
      where: {
        id: zoneId,
        tenantId
      },
      data: {
        ...validatedData,
        updatedAt: new Date()
      }
    });
    
    return ResponseHelper.success(res, zone, 'Access zone updated successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

// ============================================================================
// ACCESS RULE CONTROLLERS
// ============================================================================

export const createAccessRule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = CreateAccessRuleSchema.parse(req.body);

    const ruleData: AccessRuleData = {
      ...validatedData,
      validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : undefined,
      validTo: validatedData.validTo ? new Date(validatedData.validTo) : undefined
    };

    const rule = await accessControlService.createAccessRule(tenantId, ruleData);
    
    return ResponseHelper.success(res, rule, 'Access rule created successfully', 201);
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

export const getAccessRules = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { zoneId } = req.query;

    const rules = await accessControlService.getAccessRules(tenantId, zoneId as string);
    
    return ResponseHelper.success(res, rules, 'Access rules retrieved successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

export const updateAccessRule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { ruleId } = req.params;
    const validatedData = CreateAccessRuleSchema.partial().parse(req.body);

    const rule = await prisma.accessRule.update({
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
    
    return ResponseHelper.success(res, rule, 'Access rule updated successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

export const deleteAccessRule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { ruleId } = req.params;

    await prisma.accessRule.update({
      where: {
        id: ruleId,
        tenantId
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });
    
    return ResponseHelper.success(res, null, 'Access rule deleted successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

// ============================================================================
// OCCUPANCY CONTROLLERS
// ============================================================================

export const getCurrentOccupancy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { zoneId, spaceId } = req.query;

    const occupancy = await accessControlService.getCurrentOccupancy(
      tenantId, 
      zoneId as string, 
      spaceId as string
    );
    
    return ResponseHelper.success(res, occupancy, 'Occupancy data retrieved successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

export const updateOccupancy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { zoneId, spaceId, action } = req.body;

    if (!['ENTRY', 'EXIT'].includes(action)) {
      throw new ValidationError('Action must be ENTRY or EXIT');
    }

    const result = await accessControlService.updateOccupancy(tenantId, {
      zoneId,
      spaceId,
      action,
      timestamp: new Date()
    });
    
    return ResponseHelper.success(res, result, 'Occupancy updated successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

// ============================================================================
// ACCESS LOG CONTROLLERS
// ============================================================================

export const getAccessLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const {
      userId,
      visitorId,
      zoneId,
      startDate,
      endDate,
      limit
    } = req.query;

    const filters: any = {};
    if (userId) filters.userId = userId as string;
    if (visitorId) filters.visitorId = visitorId as string;
    if (zoneId) filters.zoneId = zoneId as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string);

    const logs = await accessControlService.getAccessLogs(tenantId, filters);
    
    return ResponseHelper.success(res, logs, 'Access logs retrieved successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

// ============================================================================
// QR CODE SCAN LOGS
// ============================================================================

export const getQRCodeScans = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { qrCodeId, userId, startDate, endDate, result, limit } = req.query;

    const where: any = { tenantId };
    if (qrCodeId) where.qrCodeId = qrCodeId as string;
    if (userId) where.userId = userId as string;
    if (result) where.result = result as string;
    if (startDate || endDate) {
      where.scannedAt = {};
      if (startDate) where.scannedAt.gte = new Date(startDate as string);
      if (endDate) where.scannedAt.lte = new Date(endDate as string);
    }

    const scans = await prisma.qRCodeScan.findMany({
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
      take: limit ? parseInt(limit as string) : 100
    });
    
    return ResponseHelper.success(res, scans, 'QR code scans retrieved successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

// ============================================================================
// VIOLATIONS CONTROLLERS
// ============================================================================

export const getAccessViolations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { userId, resolved, severity, limit } = req.query;

    const where: any = { tenantId };
    if (userId) where.userId = userId as string;
    if (resolved !== undefined) where.resolved = resolved === 'true';
    if (severity) where.severity = severity as string;

    const violations = await prisma.accessViolation.findMany({
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
      take: limit ? parseInt(limit as string) : 100
    });
    
    return ResponseHelper.success(res, violations, 'Access violations retrieved successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};

export const resolveAccessViolation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { violationId } = req.params;
    const resolvedBy = req.user!.id;

    const violation = await prisma.accessViolation.update({
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
    
    return ResponseHelper.success(res, violation, 'Access violation resolved successfully');
  } catch (error) {
    return ResponseHelper.internalError(res, error instanceof Error ? error.message : 'An error occurred');
  }
};