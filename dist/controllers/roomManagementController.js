"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomAnalytics = exports.getPricingRules = exports.createPricingRule = exports.calculatePrice = exports.getAvailableSlots = exports.checkAvailability = exports.getRoomFeatures = exports.createRoomFeature = exports.getRoomById = exports.getRooms = exports.deleteRoom = exports.updateRoom = exports.createRoom = void 0;
const zod_1 = require("zod");
const roomManagementService_1 = require("../services/roomManagementService");
const client_1 = require("@prisma/client");
const createRoomSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Room name is required'),
    type: zod_1.z.nativeEnum(client_1.SpaceType),
    description: zod_1.z.string().optional(),
    capacity: zod_1.z.number().min(1, 'Capacity must be at least 1'),
    hourlyRate: zod_1.z.number().min(0).optional(),
    amenities: zod_1.z.array(zod_1.z.string()).optional(),
    features: zod_1.z.array(zod_1.z.object({
        featureId: zod_1.z.string(),
        quantity: zod_1.z.number().min(1).default(1),
        notes: zod_1.z.string().optional(),
    })).optional(),
});
const updateRoomSchema = createRoomSchema.partial();
const roomFeatureSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Feature name is required'),
    description: zod_1.z.string().optional(),
    category: zod_1.z.nativeEnum(client_1.FeatureCategory),
});
const pricingRuleSchema = zod_1.z.object({
    spaceId: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1, 'Rule name is required'),
    description: zod_1.z.string().optional(),
    ruleType: zod_1.z.nativeEnum(client_1.PricingRuleType),
    conditions: zod_1.z.record(zod_1.z.any()).default({}),
    basePrice: zod_1.z.number().min(0).optional(),
    priceModifier: zod_1.z.number(),
    modifierType: zod_1.z.nativeEnum(client_1.PriceModifierType).default(client_1.PriceModifierType.MULTIPLIER),
    priority: zod_1.z.number().min(1).default(1),
    validFrom: zod_1.z.string().transform((val) => new Date(val)).optional(),
    validTo: zod_1.z.string().transform((val) => new Date(val)).optional(),
});
const availabilityCheckSchema = zod_1.z.object({
    spaceId: zod_1.z.string(),
    startTime: zod_1.z.string().transform((val) => new Date(val)),
    endTime: zod_1.z.string().transform((val) => new Date(val)),
});
const pricingCalculationSchema = zod_1.z.object({
    spaceId: zod_1.z.string(),
    startTime: zod_1.z.string().transform((val) => new Date(val)),
    endTime: zod_1.z.string().transform((val) => new Date(val)),
    features: zod_1.z.array(zod_1.z.string()).optional(),
    capacity: zod_1.z.number().optional(),
});
const roomFiltersSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(client_1.SpaceType).optional(),
    isActive: zod_1.z.string().transform((val) => val === 'true').optional(),
    hasFeatures: zod_1.z.array(zod_1.z.string()).optional(),
    minCapacity: zod_1.z.number().optional(),
    maxCapacity: zod_1.z.number().optional(),
});
const analyticsSchema = zod_1.z.object({
    spaceId: zod_1.z.string().optional(),
    startDate: zod_1.z.string().transform((val) => new Date(val)),
    endDate: zod_1.z.string().transform((val) => new Date(val)),
    granularity: zod_1.z.enum(['daily', 'weekly', 'monthly']).default('daily'),
});
const createRoom = async (req, res) => {
    try {
        const roomData = createRoomSchema.parse(req.body);
        const room = await roomManagementService_1.roomManagementService.createRoom(req.tenant.id, roomData);
        res.status(201).json({
            success: true,
            data: room,
            message: 'Room created successfully',
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.createRoom = createRoom;
const updateRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const updates = updateRoomSchema.parse(req.body);
        const room = await roomManagementService_1.roomManagementService.updateRoom(req.tenant.id, roomId, updates);
        res.json({
            success: true,
            data: room,
            message: 'Room updated successfully',
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.updateRoom = updateRoom;
const deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await roomManagementService_1.roomManagementService.deleteRoom(req.tenant.id, roomId);
        res.json({
            success: true,
            data: room,
            message: 'Room deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete room',
        });
    }
};
exports.deleteRoom = deleteRoom;
const getRooms = async (req, res) => {
    try {
        const filters = roomFiltersSchema.parse(req.query);
        const rooms = await roomManagementService_1.roomManagementService.getRooms(req.tenant.id, filters);
        res.json({
            success: true,
            data: rooms,
            total: rooms.length,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.getRooms = getRooms;
const getRoomById = async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await roomManagementService_1.roomManagementService.getRoomById(req.tenant.id, roomId);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get room',
        });
    }
};
exports.getRoomById = getRoomById;
const createRoomFeature = async (req, res) => {
    try {
        const featureData = roomFeatureSchema.parse(req.body);
        const feature = await roomManagementService_1.roomManagementService.createRoomFeature(req.tenant.id, featureData);
        res.status(201).json({
            success: true,
            data: feature,
            message: 'Room feature created successfully',
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.createRoomFeature = createRoomFeature;
const getRoomFeatures = async (req, res) => {
    try {
        const { category } = req.query;
        const categoryFilter = category ? category : undefined;
        const features = await roomManagementService_1.roomManagementService.getRoomFeatures(req.tenant.id, categoryFilter);
        res.json({
            success: true,
            data: features,
            total: features.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get room features',
        });
    }
};
exports.getRoomFeatures = getRoomFeatures;
const checkAvailability = async (req, res) => {
    try {
        const availabilityData = availabilityCheckSchema.parse(req.body);
        const isAvailable = await roomManagementService_1.roomManagementService.checkAvailability(req.tenant.id, availabilityData);
        res.json({
            success: true,
            data: {
                isAvailable,
                spaceId: availabilityData.spaceId,
                startTime: availabilityData.startTime,
                endTime: availabilityData.endTime,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.checkAvailability = checkAvailability;
const getAvailableSlots = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { date, duration = '60' } = req.query;
        if (!date) {
            return res.status(400).json({
                success: false,
                error: 'Date parameter is required',
            });
        }
        const requestDate = new Date(date);
        const durationMinutes = parseInt(duration);
        const availableSlots = await roomManagementService_1.roomManagementService.getAvailableSlots(req.tenant.id, roomId, requestDate, durationMinutes);
        res.json({
            success: true,
            data: {
                date: requestDate,
                duration: durationMinutes,
                availableSlots,
                total: availableSlots.length,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get available slots',
        });
    }
};
exports.getAvailableSlots = getAvailableSlots;
const calculatePrice = async (req, res) => {
    try {
        const pricingData = pricingCalculationSchema.parse(req.body);
        const price = await roomManagementService_1.roomManagementService.calculatePrice(req.tenant.id, pricingData);
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.calculatePrice = calculatePrice;
const createPricingRule = async (req, res) => {
    try {
        const ruleData = pricingRuleSchema.parse(req.body);
        const rule = await roomManagementService_1.roomManagementService.createPricingRule(req.tenant.id, ruleData);
        res.status(201).json({
            success: true,
            data: rule,
            message: 'Pricing rule created successfully',
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.createPricingRule = createPricingRule;
const getPricingRules = async (req, res) => {
    try {
        const { spaceId } = req.query;
        const rules = await roomManagementService_1.roomManagementService.getPricingRules(req.tenant.id, spaceId);
        res.json({
            success: true,
            data: rules,
            total: rules.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get pricing rules',
        });
    }
};
exports.getPricingRules = getPricingRules;
const getRoomAnalytics = async (req, res) => {
    try {
        const analyticsData = analyticsSchema.parse(req.query);
        const analytics = await roomManagementService_1.roomManagementService.getRoomAnalytics(req.tenant.id, analyticsData);
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.getRoomAnalytics = getRoomAnalytics;
//# sourceMappingURL=roomManagementController.js.map