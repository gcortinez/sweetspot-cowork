import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { spaceService } from '../services/spaceService';
import { roomPricingService } from '../services/roomPricingService';
import { ResponseHelper } from '../utils/response';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { SpaceType } from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createSpaceSchema = z.object({
  name: z.string().min(1, 'Space name is required'),
  type: z.nativeEnum(SpaceType),
  description: z.string().optional(),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  amenities: z.array(z.string()).optional(),
  hourlyRate: z.number().min(0, 'Hourly rate cannot be negative').optional(),
  isActive: z.boolean().optional(),
  location: z.string().optional(),
  floor: z.number().int().optional(),
  equipment: z.array(z.string()).optional(),
  features: z.array(z.string()).optional()
});

const updateSpaceSchema = createSpaceSchema.partial();

const spaceFiltersSchema = z.object({
  type: z.nativeEnum(SpaceType).optional(),
  isActive: z.boolean().optional(),
  capacity: z.number().int().min(1).optional(),
  amenities: z.array(z.string()).optional()
});

const availabilityQuerySchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  capacity: z.number().int().min(1).optional(),
  type: z.nativeEnum(SpaceType).optional(),
  amenities: z.array(z.string()).optional()
});

const pricingEstimatesSchema = z.object({
  date: z.string().datetime(),
  duration: z.number().min(0.5).max(12).default(1)
});

// ============================================================================
// SPACE MANAGEMENT CONTROLLERS
// ============================================================================

/**
 * Create a new space
 */
export const createSpace = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createSpaceSchema.parse(req.body);
    const tenantId = req.user!.tenantId;

    const space = await spaceService.createSpace(tenantId, validatedData);

    logger.info('Space created via API', {
      spaceId: space.id,
      tenantId,
      userId: req.user!.id,
      spaceName: space.name
    });

    return ResponseHelper.created(res, space, 'Space created successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid space data', error.errors);
    }

    logger.error('Failed to create space via API', {
      tenantId: req.user?.tenantId,
      userId: req.user?.id,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to create space');
  }
};

/**
 * Get all spaces with filtering
 */
export const getSpaces = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = spaceFiltersSchema.parse(req.query);
    const tenantId = req.user!.tenantId;

    const spaces = await spaceService.getSpaces(tenantId, filters);

    return ResponseHelper.success(res, {
      spaces,
      count: spaces.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid filter parameters', error.errors);
    }

    logger.error('Failed to get spaces via API', {
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to retrieve spaces');
  }
};

/**
 * Get space by ID
 */
export const getSpaceById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { spaceId } = req.params;
    const tenantId = req.user!.tenantId;

    const space = await spaceService.getSpaceById(tenantId, spaceId);

    if (!space) {
      return ResponseHelper.notFound(res, 'Space not found');
    }

    return ResponseHelper.success(res, space);
  } catch (error) {
    logger.error('Failed to get space by ID via API', {
      spaceId: req.params.spaceId,
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to retrieve space');
  }
};

/**
 * Update space
 */
export const updateSpace = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { spaceId } = req.params;
    const validatedData = updateSpaceSchema.parse(req.body);
    const tenantId = req.user!.tenantId;

    const space = await spaceService.updateSpace(tenantId, spaceId, validatedData);

    logger.info('Space updated via API', {
      spaceId,
      tenantId,
      userId: req.user!.id,
      updatedFields: Object.keys(validatedData)
    });

    return ResponseHelper.success(res, space, 'Space updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid update data', error.errors);
    }

    logger.error('Failed to update space via API', {
      spaceId: req.params.spaceId,
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to update space');
  }
};

/**
 * Delete space
 */
export const deleteSpace = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { spaceId } = req.params;
    const tenantId = req.user!.tenantId;

    await spaceService.deleteSpace(tenantId, spaceId);

    logger.info('Space deleted via API', {
      spaceId,
      tenantId,
      userId: req.user!.id
    });

    return ResponseHelper.success(res, null, 'Space deleted successfully');
  } catch (error) {
    logger.error('Failed to delete space via API', {
      spaceId: req.params.spaceId,
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to delete space');
  }
};

// ============================================================================
// SPACE AVAILABILITY CONTROLLERS
// ============================================================================

/**
 * Check space availability
 */
export const checkSpaceAvailability = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { spaceId } = req.params;
    const { startTime, endTime } = availabilityQuerySchema.parse(req.query);
    const tenantId = req.user!.tenantId;

    const availability = await spaceService.checkSpaceAvailability(
      tenantId,
      spaceId,
      new Date(startTime),
      new Date(endTime)
    );

    return ResponseHelper.success(res, availability);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid availability query', error.errors);
    }

    logger.error('Failed to check space availability via API', {
      spaceId: req.params.spaceId,
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to check availability');
  }
};

/**
 * Find available spaces
 */
export const findAvailableSpaces = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = availabilityQuerySchema.parse(req.query);
    const tenantId = req.user!.tenantId;

    const availableSpaces = await spaceService.findAvailableSpaces(tenantId, {
      startTime: new Date(query.startTime),
      endTime: new Date(query.endTime),
      capacity: query.capacity,
      type: query.type,
      amenities: query.amenities
    });

    return ResponseHelper.success(res, {
      availableSpaces,
      count: availableSpaces.length,
      timeSlot: {
        startTime: query.startTime,
        endTime: query.endTime
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid availability query', error.errors);
    }

    logger.error('Failed to find available spaces via API', {
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to find available spaces');
  }
};

// ============================================================================
// SPACE PRICING CONTROLLERS
// ============================================================================

/**
 * Calculate space pricing
 */
export const calculateSpacePricing = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { spaceId } = req.params;
    const { startTime, endTime, attendeeCount, requiredAmenities } = req.body;
    const tenantId = req.user!.tenantId;

    const pricing = await roomPricingService.calculateBookingPrice(tenantId, {
      spaceId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendeeCount,
      requiredAmenities
    });

    return ResponseHelper.success(res, pricing);
  } catch (error) {
    logger.error('Failed to calculate space pricing via API', {
      spaceId: req.params.spaceId,
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to calculate pricing');
  }
};

/**
 * Get pricing estimates for different time slots
 */
export const getPricingEstimates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { spaceId } = req.params;
    const { date, duration } = pricingEstimatesSchema.parse(req.query);
    const tenantId = req.user!.tenantId;

    const estimates = await roomPricingService.getPricingEstimates(
      tenantId,
      spaceId,
      new Date(date),
      duration
    );

    return ResponseHelper.success(res, {
      estimates,
      date,
      duration,
      spaceId
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid pricing query', error.errors);
    }

    logger.error('Failed to get pricing estimates via API', {
      spaceId: req.params.spaceId,
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to get pricing estimates');
  }
};

// ============================================================================
// SPACE ANALYTICS CONTROLLERS
// ============================================================================

/**
 * Get space utilization statistics
 */
export const getSpaceUtilization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { spaceId } = req.params;
    const { startDate, endDate } = req.query;
    const tenantId = req.user!.tenantId;

    const utilization = await spaceService.getSpaceUtilization(
      tenantId,
      spaceId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    return ResponseHelper.success(res, {
      spaceId,
      period: {
        startDate: startDate || 'Last 30 days',
        endDate: endDate || 'Now'
      },
      utilization
    });
  } catch (error) {
    logger.error('Failed to get space utilization via API', {
      spaceId: req.params.spaceId,
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to get utilization statistics');
  }
};

/**
 * Get space types and their counts
 */
export const getSpaceTypeSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const spaces = await spaceService.getSpaces(tenantId);

    // Group by space type
    const spaceTypeCounts = spaces.reduce((acc, space) => {
      acc[space.type] = (acc[space.type] || 0) + 1;
      return acc;
    }, {} as Record<SpaceType, number>);

    // Calculate total capacity by type
    const capacityByType = spaces.reduce((acc, space) => {
      acc[space.type] = (acc[space.type] || 0) + space.capacity;
      return acc;
    }, {} as Record<SpaceType, number>);

    const summary = Object.entries(spaceTypeCounts).map(([type, count]) => ({
      type: type as SpaceType,
      count,
      totalCapacity: capacityByType[type as SpaceType] || 0,
      averageCapacity: Math.round((capacityByType[type as SpaceType] || 0) / count)
    }));

    return ResponseHelper.success(res, {
      summary,
      totalSpaces: spaces.length,
      totalCapacity: spaces.reduce((sum, space) => sum + space.capacity, 0)
    });
  } catch (error) {
    logger.error('Failed to get space type summary via API', {
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to get space summary');
  }
};