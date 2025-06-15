"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpaceTypeSummary = exports.getSpaceUtilization = exports.getPricingEstimates = exports.calculateSpacePricing = exports.findAvailableSpaces = exports.checkSpaceAvailability = exports.deleteSpace = exports.updateSpace = exports.getSpaceById = exports.getSpaces = exports.createSpace = void 0;
const spaceService_1 = require("../services/spaceService");
const roomPricingService_1 = require("../services/roomPricingService");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createSpaceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Space name is required'),
    type: zod_1.z.nativeEnum(client_1.SpaceType),
    description: zod_1.z.string().optional(),
    capacity: zod_1.z.number().int().min(1, 'Capacity must be at least 1'),
    amenities: zod_1.z.array(zod_1.z.string()).optional(),
    hourlyRate: zod_1.z.number().min(0, 'Hourly rate cannot be negative').optional(),
    isActive: zod_1.z.boolean().optional(),
    location: zod_1.z.string().optional(),
    floor: zod_1.z.number().int().optional(),
    equipment: zod_1.z.array(zod_1.z.string()).optional(),
    features: zod_1.z.array(zod_1.z.string()).optional()
});
const updateSpaceSchema = createSpaceSchema.partial();
const spaceFiltersSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(client_1.SpaceType).optional(),
    isActive: zod_1.z.boolean().optional(),
    capacity: zod_1.z.number().int().min(1).optional(),
    amenities: zod_1.z.array(zod_1.z.string()).optional()
});
const availabilityQuerySchema = zod_1.z.object({
    startTime: zod_1.z.string().datetime(),
    endTime: zod_1.z.string().datetime(),
    capacity: zod_1.z.number().int().min(1).optional(),
    type: zod_1.z.nativeEnum(client_1.SpaceType).optional(),
    amenities: zod_1.z.array(zod_1.z.string()).optional()
});
const pricingEstimatesSchema = zod_1.z.object({
    date: zod_1.z.string().datetime(),
    duration: zod_1.z.number().min(0.5).max(12).default(1)
});
const createSpace = async (req, res) => {
    try {
        const validatedData = createSpaceSchema.parse(req.body);
        const tenantId = req.user.tenantId;
        const space = await spaceService_1.spaceService.createSpace(tenantId, validatedData);
        logger_1.logger.info('Space created via API', {
            spaceId: space.id,
            tenantId,
            userId: req.user.id,
            spaceName: space.name
        });
        return response_1.ResponseHelper.created(res, space, 'Space created successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid space data', error.errors);
        }
        logger_1.logger.error('Failed to create space via API', {
            tenantId: req.user?.tenantId,
            userId: req.user?.id,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to create space');
    }
};
exports.createSpace = createSpace;
const getSpaces = async (req, res) => {
    try {
        const filters = spaceFiltersSchema.parse(req.query);
        const tenantId = req.user.tenantId;
        const spaces = await spaceService_1.spaceService.getSpaces(tenantId, filters);
        return response_1.ResponseHelper.success(res, {
            spaces,
            count: spaces.length
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid filter parameters', error.errors);
        }
        logger_1.logger.error('Failed to get spaces via API', {
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to retrieve spaces');
    }
};
exports.getSpaces = getSpaces;
const getSpaceById = async (req, res) => {
    try {
        const { spaceId } = req.params;
        const tenantId = req.user.tenantId;
        const space = await spaceService_1.spaceService.getSpaceById(tenantId, spaceId);
        if (!space) {
            return response_1.ResponseHelper.notFound(res, 'Space not found');
        }
        return response_1.ResponseHelper.success(res, space);
    }
    catch (error) {
        logger_1.logger.error('Failed to get space by ID via API', {
            spaceId: req.params.spaceId,
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to retrieve space');
    }
};
exports.getSpaceById = getSpaceById;
const updateSpace = async (req, res) => {
    try {
        const { spaceId } = req.params;
        const validatedData = updateSpaceSchema.parse(req.body);
        const tenantId = req.user.tenantId;
        const space = await spaceService_1.spaceService.updateSpace(tenantId, spaceId, validatedData);
        logger_1.logger.info('Space updated via API', {
            spaceId,
            tenantId,
            userId: req.user.id,
            updatedFields: Object.keys(validatedData)
        });
        return response_1.ResponseHelper.success(res, space, 'Space updated successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid update data', error.errors);
        }
        logger_1.logger.error('Failed to update space via API', {
            spaceId: req.params.spaceId,
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to update space');
    }
};
exports.updateSpace = updateSpace;
const deleteSpace = async (req, res) => {
    try {
        const { spaceId } = req.params;
        const tenantId = req.user.tenantId;
        await spaceService_1.spaceService.deleteSpace(tenantId, spaceId);
        logger_1.logger.info('Space deleted via API', {
            spaceId,
            tenantId,
            userId: req.user.id
        });
        return response_1.ResponseHelper.success(res, null, 'Space deleted successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to delete space via API', {
            spaceId: req.params.spaceId,
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to delete space');
    }
};
exports.deleteSpace = deleteSpace;
const checkSpaceAvailability = async (req, res) => {
    try {
        const { spaceId } = req.params;
        const { startTime, endTime } = availabilityQuerySchema.parse(req.query);
        const tenantId = req.user.tenantId;
        const availability = await spaceService_1.spaceService.checkSpaceAvailability(tenantId, spaceId, new Date(startTime), new Date(endTime));
        return response_1.ResponseHelper.success(res, availability);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid availability query', error.errors);
        }
        logger_1.logger.error('Failed to check space availability via API', {
            spaceId: req.params.spaceId,
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to check availability');
    }
};
exports.checkSpaceAvailability = checkSpaceAvailability;
const findAvailableSpaces = async (req, res) => {
    try {
        const query = availabilityQuerySchema.parse(req.query);
        const tenantId = req.user.tenantId;
        const availableSpaces = await spaceService_1.spaceService.findAvailableSpaces(tenantId, {
            startTime: new Date(query.startTime),
            endTime: new Date(query.endTime),
            capacity: query.capacity,
            type: query.type,
            amenities: query.amenities
        });
        return response_1.ResponseHelper.success(res, {
            availableSpaces,
            count: availableSpaces.length,
            timeSlot: {
                startTime: query.startTime,
                endTime: query.endTime
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid availability query', error.errors);
        }
        logger_1.logger.error('Failed to find available spaces via API', {
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to find available spaces');
    }
};
exports.findAvailableSpaces = findAvailableSpaces;
const calculateSpacePricing = async (req, res) => {
    try {
        const { spaceId } = req.params;
        const { startTime, endTime, attendeeCount, requiredAmenities } = req.body;
        const tenantId = req.user.tenantId;
        const pricing = await roomPricingService_1.roomPricingService.calculateBookingPrice(tenantId, {
            spaceId,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            attendeeCount,
            requiredAmenities
        });
        return response_1.ResponseHelper.success(res, pricing);
    }
    catch (error) {
        logger_1.logger.error('Failed to calculate space pricing via API', {
            spaceId: req.params.spaceId,
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to calculate pricing');
    }
};
exports.calculateSpacePricing = calculateSpacePricing;
const getPricingEstimates = async (req, res) => {
    try {
        const { spaceId } = req.params;
        const { date, duration } = pricingEstimatesSchema.parse(req.query);
        const tenantId = req.user.tenantId;
        const estimates = await roomPricingService_1.roomPricingService.getPricingEstimates(tenantId, spaceId, new Date(date), duration);
        return response_1.ResponseHelper.success(res, {
            estimates,
            date,
            duration,
            spaceId
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid pricing query', error.errors);
        }
        logger_1.logger.error('Failed to get pricing estimates via API', {
            spaceId: req.params.spaceId,
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to get pricing estimates');
    }
};
exports.getPricingEstimates = getPricingEstimates;
const getSpaceUtilization = async (req, res) => {
    try {
        const { spaceId } = req.params;
        const { startDate, endDate } = req.query;
        const tenantId = req.user.tenantId;
        const utilization = await spaceService_1.spaceService.getSpaceUtilization(tenantId, spaceId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return response_1.ResponseHelper.success(res, {
            spaceId,
            period: {
                startDate: startDate || 'Last 30 days',
                endDate: endDate || 'Now'
            },
            utilization
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get space utilization via API', {
            spaceId: req.params.spaceId,
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to get utilization statistics');
    }
};
exports.getSpaceUtilization = getSpaceUtilization;
const getSpaceTypeSummary = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const spaces = await spaceService_1.spaceService.getSpaces(tenantId);
        const spaceTypeCounts = spaces.reduce((acc, space) => {
            acc[space.type] = (acc[space.type] || 0) + 1;
            return acc;
        }, {});
        const capacityByType = spaces.reduce((acc, space) => {
            acc[space.type] = (acc[space.type] || 0) + space.capacity;
            return acc;
        }, {});
        const summary = Object.entries(spaceTypeCounts).map(([type, count]) => ({
            type: type,
            count,
            totalCapacity: capacityByType[type] || 0,
            averageCapacity: Math.round((capacityByType[type] || 0) / count)
        }));
        return response_1.ResponseHelper.success(res, {
            summary,
            totalSpaces: spaces.length,
            totalCapacity: spaces.reduce((sum, space) => sum + space.capacity, 0)
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get space type summary via API', {
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to get space summary');
    }
};
exports.getSpaceTypeSummary = getSpaceTypeSummary;
//# sourceMappingURL=spaceController.js.map