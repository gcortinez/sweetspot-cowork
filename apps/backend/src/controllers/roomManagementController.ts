import { Request, Response } from 'express';
import { z } from 'zod';
import { roomManagementService } from '../services/roomManagementService';
import { AuthenticatedRequest } from '../types/api';
import { SpaceType, FeatureCategory, PriceModifierType, PricingRuleType } from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  type: z.nativeEnum(SpaceType),
  description: z.string().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  hourlyRate: z.number().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  features: z.array(z.object({
    featureId: z.string(),
    quantity: z.number().min(1).default(1),
    notes: z.string().optional(),
  })).optional(),
});

const updateRoomSchema = createRoomSchema.partial();

const roomFeatureSchema = z.object({
  name: z.string().min(1, 'Feature name is required'),
  description: z.string().optional(),
  category: z.nativeEnum(FeatureCategory),
});

const pricingRuleSchema = z.object({
  spaceId: z.string().optional(),
  name: z.string().min(1, 'Rule name is required'),
  description: z.string().optional(),
  ruleType: z.nativeEnum(PricingRuleType),
  conditions: z.record(z.any()).default({}),
  basePrice: z.number().min(0).optional(),
  priceModifier: z.number(),
  modifierType: z.nativeEnum(PriceModifierType).default(PriceModifierType.MULTIPLIER),
  priority: z.number().min(1).default(1),
  validFrom: z.string().transform((val) => new Date(val)).optional(),
  validTo: z.string().transform((val) => new Date(val)).optional(),
});

const availabilityCheckSchema = z.object({
  spaceId: z.string(),
  startTime: z.string().transform((val) => new Date(val)),
  endTime: z.string().transform((val) => new Date(val)),
});

const pricingCalculationSchema = z.object({
  spaceId: z.string(),
  startTime: z.string().transform((val) => new Date(val)),
  endTime: z.string().transform((val) => new Date(val)),
  features: z.array(z.string()).optional(),
  capacity: z.number().optional(),
});

const roomFiltersSchema = z.object({
  type: z.nativeEnum(SpaceType).optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
  hasFeatures: z.array(z.string()).optional(),
  minCapacity: z.number().optional(),
  maxCapacity: z.number().optional(),
});

const analyticsSchema = z.object({
  spaceId: z.string().optional(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  granularity: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
});

// ============================================================================
// ROOM INVENTORY MANAGEMENT
// ============================================================================

export const createRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roomData = createRoomSchema.parse(req.body);
    
    const room = await roomManagementService.createRoom(req.tenant!.id, roomData);
    
    res.status(201).json({
      success: true,
      data: room,
      message: 'Room created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create room',
    });
  }
};

export const updateRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const updates = updateRoomSchema.parse(req.body);
    
    const room = await roomManagementService.updateRoom(req.tenant!.id, roomId, updates);
    
    res.json({
      success: true,
      data: room,
      message: 'Room updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update room',
    });
  }
};

export const deleteRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    
    const room = await roomManagementService.deleteRoom(req.tenant!.id, roomId);
    
    res.json({
      success: true,
      data: room,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete room',
    });
  }
};

export const getRooms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = roomFiltersSchema.parse(req.query);
    
    const rooms = await roomManagementService.getRooms(req.tenant!.id, filters);
    
    res.json({
      success: true,
      data: rooms,
      total: rooms.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filters',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get rooms',
    });
  }
};

export const getRoomById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    
    const room = await roomManagementService.getRoomById(req.tenant!.id, roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
      });
    }
    
    res.json({
      success: true,
      data: room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get room',
    });
  }
};

// ============================================================================
// ROOM FEATURES MANAGEMENT
// ============================================================================

export const createRoomFeature = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const featureData = roomFeatureSchema.parse(req.body);
    
    const feature = await roomManagementService.createRoomFeature(req.tenant!.id, featureData);
    
    res.status(201).json({
      success: true,
      data: feature,
      message: 'Room feature created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create room feature',
    });
  }
};

export const getRoomFeatures = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category } = req.query;
    const categoryFilter = category ? category as FeatureCategory : undefined;
    
    const features = await roomManagementService.getRoomFeatures(req.tenant!.id, categoryFilter);
    
    res.json({
      success: true,
      data: features,
      total: features.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get room features',
    });
  }
};

// ============================================================================
// AVAILABILITY MANAGEMENT
// ============================================================================

export const checkAvailability = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const availabilityData = availabilityCheckSchema.parse(req.body);
    
    const isAvailable = await roomManagementService.checkAvailability(req.tenant!.id, availabilityData);
    
    res.json({
      success: true,
      data: {
        isAvailable,
        spaceId: availabilityData.spaceId,
        startTime: availabilityData.startTime,
        endTime: availabilityData.endTime,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check availability',
    });
  }
};

export const getAvailableSlots = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const { date, duration = '60' } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required',
      });
    }
    
    const requestDate = new Date(date as string);
    const durationMinutes = parseInt(duration as string);
    
    const availableSlots = await roomManagementService.getAvailableSlots(
      req.tenant!.id,
      roomId,
      requestDate,
      durationMinutes
    );
    
    res.json({
      success: true,
      data: {
        date: requestDate,
        duration: durationMinutes,
        availableSlots,
        total: availableSlots.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get available slots',
    });
  }
};

// ============================================================================
// DYNAMIC PRICING
// ============================================================================

export const calculatePrice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pricingData = pricingCalculationSchema.parse(req.body);
    
    const price = await roomManagementService.calculatePrice(req.tenant!.id, pricingData);
    
    res.json({
      success: true,
      data: {
        price,
        spaceId: pricingData.spaceId,
        startTime: pricingData.startTime,
        endTime: pricingData.endTime,
        duration: (pricingData.endTime.getTime() - pricingData.startTime.getTime()) / (1000 * 60 * 60),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate price',
    });
  }
};

export const createPricingRule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ruleData = pricingRuleSchema.parse(req.body);
    
    const rule = await roomManagementService.createPricingRule(req.tenant!.id, ruleData);
    
    res.status(201).json({
      success: true,
      data: rule,
      message: 'Pricing rule created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create pricing rule',
    });
  }
};

export const getPricingRules = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { spaceId } = req.query;
    
    const rules = await roomManagementService.getPricingRules(
      req.tenant!.id,
      spaceId as string
    );
    
    res.json({
      success: true,
      data: rules,
      total: rules.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pricing rules',
    });
  }
};

// ============================================================================
// ANALYTICS
// ============================================================================

export const getRoomAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analyticsData = analyticsSchema.parse(req.query);
    
    const analytics = await roomManagementService.getRoomAnalytics(req.tenant!.id, analyticsData);
    
    res.json({
      success: true,
      data: analytics,
      total: analytics.length,
      period: {
        startDate: analyticsData.startDate,
        endDate: analyticsData.endDate,
        granularity: analyticsData.granularity,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get room analytics',
    });
  }
};