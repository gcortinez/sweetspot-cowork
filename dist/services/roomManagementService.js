"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomManagementService = exports.RoomManagementService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class RoomManagementService {
    async createRoom(tenantId, request) {
        try {
            return await prisma_1.prisma.$transaction(async (tx) => {
                const space = await tx.space.create({
                    data: {
                        tenantId,
                        name: request.name,
                        type: request.type,
                        description: request.description,
                        capacity: request.capacity,
                        hourlyRate: request.hourlyRate ? Number(request.hourlyRate) : null,
                        amenities: request.amenities || [],
                        isActive: true,
                    },
                });
                if (request.features && request.features.length > 0) {
                    await tx.spaceFeature.createMany({
                        data: request.features.map(feature => ({
                            spaceId: space.id,
                            featureId: feature.featureId,
                            quantity: feature.quantity,
                            notes: feature.notes,
                        })),
                    });
                }
                const defaultAvailability = [];
                for (let day = 1; day <= 5; day++) {
                    defaultAvailability.push({
                        tenantId,
                        spaceId: space.id,
                        dayOfWeek: day,
                        startTime: '09:00',
                        endTime: '18:00',
                        isAvailable: true,
                        recurrenceType: client_1.RecurrenceType.WEEKLY,
                    });
                }
                await tx.roomAvailability.createMany({
                    data: defaultAvailability,
                });
                return space;
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create room', { tenantId, request }, error);
            throw error;
        }
    }
    async updateRoom(tenantId, spaceId, updates) {
        try {
            return await prisma_1.prisma.$transaction(async (tx) => {
                const space = await tx.space.update({
                    where: { id: spaceId, tenantId },
                    data: {
                        name: updates.name,
                        type: updates.type,
                        description: updates.description,
                        capacity: updates.capacity,
                        hourlyRate: updates.hourlyRate ? Number(updates.hourlyRate) : undefined,
                        amenities: updates.amenities,
                    },
                });
                if (updates.features) {
                    await tx.spaceFeature.deleteMany({
                        where: { spaceId },
                    });
                    if (updates.features.length > 0) {
                        await tx.spaceFeature.createMany({
                            data: updates.features.map(feature => ({
                                spaceId,
                                featureId: feature.featureId,
                                quantity: feature.quantity,
                                notes: feature.notes,
                            })),
                        });
                    }
                }
                return space;
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update room', { tenantId, spaceId, updates }, error);
            throw error;
        }
    }
    async deleteRoom(tenantId, spaceId) {
        try {
            const activeBookings = await prisma_1.prisma.booking.count({
                where: {
                    spaceId,
                    tenantId,
                    status: { in: [client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.CHECKED_IN] },
                    endTime: { gt: new Date() },
                },
            });
            if (activeBookings > 0) {
                throw new Error(`Cannot delete room with ${activeBookings} active bookings`);
            }
            return await prisma_1.prisma.space.update({
                where: { id: spaceId, tenantId },
                data: { isActive: false },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete room', { tenantId, spaceId }, error);
            throw error;
        }
    }
    async getRooms(tenantId, filters) {
        try {
            const whereClause = { tenantId };
            if (filters?.type)
                whereClause.type = filters.type;
            if (filters?.isActive !== undefined)
                whereClause.isActive = filters.isActive;
            if (filters?.minCapacity)
                whereClause.capacity = { gte: filters.minCapacity };
            if (filters?.maxCapacity) {
                whereClause.capacity = {
                    ...whereClause.capacity,
                    lte: filters.maxCapacity
                };
            }
            let rooms = await prisma_1.prisma.space.findMany({
                where: whereClause,
                include: {
                    features: {
                        include: {
                            feature: true,
                        },
                    },
                    availability: true,
                    usageAnalytics: {
                        where: {
                            date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        },
                        orderBy: { date: 'desc' },
                        take: 30,
                    },
                    _count: {
                        select: {
                            bookings: {
                                where: {
                                    status: { in: [client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.CHECKED_IN] },
                                    endTime: { gt: new Date() },
                                },
                            },
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
            if (filters?.hasFeatures && filters.hasFeatures.length > 0) {
                rooms = rooms.filter(room => filters.hasFeatures.every(featureId => room.features.some(spaceFeature => spaceFeature.featureId === featureId)));
            }
            return rooms;
        }
        catch (error) {
            logger_1.logger.error('Failed to get rooms', { tenantId, filters }, error);
            throw error;
        }
    }
    async getRoomById(tenantId, spaceId) {
        try {
            return await prisma_1.prisma.space.findFirst({
                where: { id: spaceId, tenantId },
                include: {
                    features: {
                        include: {
                            feature: true,
                        },
                    },
                    availability: {
                        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
                    },
                    pricingRules: {
                        where: { isActive: true },
                        orderBy: { priority: 'desc' },
                    },
                    maintenanceLogs: {
                        orderBy: { scheduledAt: 'desc' },
                        take: 10,
                    },
                    usageAnalytics: {
                        where: {
                            date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        },
                        orderBy: { date: 'desc' },
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get room by ID', { tenantId, spaceId }, error);
            throw error;
        }
    }
    async createRoomFeature(tenantId, request) {
        try {
            return await prisma_1.prisma.roomFeature.create({
                data: {
                    tenantId,
                    name: request.name,
                    description: request.description,
                    category: request.category,
                    isActive: true,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create room feature', { tenantId, request }, error);
            throw error;
        }
    }
    async getRoomFeatures(tenantId, category) {
        try {
            const whereClause = { tenantId, isActive: true };
            if (category)
                whereClause.category = category;
            return await prisma_1.prisma.roomFeature.findMany({
                where: whereClause,
                orderBy: [{ category: 'asc' }, { name: 'asc' }],
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get room features', { tenantId, category }, error);
            throw error;
        }
    }
    async checkAvailability(tenantId, request) {
        try {
            const conflictingBookings = await prisma_1.prisma.booking.count({
                where: {
                    tenantId,
                    spaceId: request.spaceId,
                    id: { not: request.excludeBookingId },
                    status: { in: [client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.CHECKED_IN] },
                    OR: [
                        {
                            startTime: { lt: request.endTime },
                            endTime: { gt: request.startTime },
                        },
                    ],
                },
            });
            if (conflictingBookings > 0) {
                return false;
            }
            const startDate = new Date(request.startTime);
            const endDate = new Date(request.endTime);
            const dayOfWeek = startDate.getDay();
            const startTimeStr = startDate.toTimeString().substring(0, 5);
            const endTimeStr = endDate.toTimeString().substring(0, 5);
            const availability = await prisma_1.prisma.roomAvailability.findFirst({
                where: {
                    tenantId,
                    spaceId: request.spaceId,
                    dayOfWeek,
                    isAvailable: true,
                    startTime: { lte: startTimeStr },
                    endTime: { gte: endTimeStr },
                },
            });
            return !!availability;
        }
        catch (error) {
            logger_1.logger.error('Failed to check availability', { tenantId, request }, error);
            throw error;
        }
    }
    async getAvailableSlots(tenantId, spaceId, date, durationMinutes = 60) {
        try {
            const dayOfWeek = date.getDay();
            const availabilityRules = await prisma_1.prisma.roomAvailability.findMany({
                where: {
                    tenantId,
                    spaceId,
                    dayOfWeek,
                    isAvailable: true,
                },
                orderBy: { startTime: 'asc' },
            });
            if (availabilityRules.length === 0) {
                return [];
            }
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            const existingBookings = await prisma_1.prisma.booking.findMany({
                where: {
                    tenantId,
                    spaceId,
                    status: { in: [client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.CHECKED_IN] },
                    startTime: { gte: startOfDay },
                    endTime: { lte: endOfDay },
                },
                orderBy: { startTime: 'asc' },
            });
            const availableSlots = [];
            for (const rule of availabilityRules) {
                const [startHour, startMinute] = rule.startTime.split(':').map(Number);
                const [endHour, endMinute] = rule.endTime.split(':').map(Number);
                const ruleStart = new Date(date);
                ruleStart.setHours(startHour, startMinute, 0, 0);
                const ruleEnd = new Date(date);
                ruleEnd.setHours(endHour, endMinute, 0, 0);
                let currentSlotStart = new Date(ruleStart);
                while (currentSlotStart.getTime() + durationMinutes * 60000 <= ruleEnd.getTime()) {
                    const currentSlotEnd = new Date(currentSlotStart.getTime() + durationMinutes * 60000);
                    const hasConflict = existingBookings.some(booking => (currentSlotStart < booking.endTime && currentSlotEnd > booking.startTime));
                    if (!hasConflict) {
                        availableSlots.push({
                            startTime: new Date(currentSlotStart),
                            endTime: new Date(currentSlotEnd),
                        });
                    }
                    currentSlotStart = new Date(currentSlotStart.getTime() + 30 * 60000);
                }
            }
            return availableSlots;
        }
        catch (error) {
            logger_1.logger.error('Failed to get available slots', { tenantId, spaceId, date }, error);
            throw error;
        }
    }
    async calculatePrice(tenantId, request) {
        try {
            const space = await prisma_1.prisma.space.findFirst({
                where: { id: request.spaceId, tenantId },
                include: {
                    pricingRules: {
                        where: { isActive: true },
                        orderBy: { priority: 'desc' },
                    },
                },
            });
            if (!space) {
                throw new Error('Space not found');
            }
            let basePrice = space.hourlyRate ? Number(space.hourlyRate) : 0;
            const duration = (request.endTime.getTime() - request.startTime.getTime()) / (1000 * 60 * 60);
            for (const rule of space.pricingRules) {
                if (this.doesRuleApply(rule, request)) {
                    const ruleBasePrice = rule.basePrice ? Number(rule.basePrice) : basePrice;
                    const modifier = Number(rule.priceModifier);
                    switch (rule.modifierType) {
                        case client_1.PriceModifierType.MULTIPLIER:
                            basePrice = ruleBasePrice * modifier;
                            break;
                        case client_1.PriceModifierType.ADDITION:
                            basePrice = ruleBasePrice + modifier;
                            break;
                        case client_1.PriceModifierType.DISCOUNT:
                            basePrice = ruleBasePrice - modifier;
                            break;
                        case client_1.PriceModifierType.REPLACEMENT:
                            basePrice = modifier;
                            break;
                    }
                }
            }
            if (request.capacity && request.capacity > space.capacity) {
                throw new Error('Requested capacity exceeds room capacity');
            }
            const totalPrice = basePrice * duration;
            return Math.max(0, totalPrice);
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate price', { tenantId, request }, error);
            throw error;
        }
    }
    doesRuleApply(rule, request) {
        if (rule.validFrom && request.startTime < rule.validFrom)
            return false;
        if (rule.validTo && request.startTime > rule.validTo)
            return false;
        const conditions = rule.conditions;
        switch (rule.ruleType) {
            case client_1.PricingRuleType.TIME_BASED:
                return this.checkTimeBasedRule(conditions, request);
            case client_1.PricingRuleType.LOCATION_BASED:
                return this.checkLocationBasedRule(conditions, request);
            case client_1.PricingRuleType.MEMBER_BASED:
                return this.checkMemberBasedRule(conditions, request);
            default:
                return true;
        }
    }
    checkTimeBasedRule(conditions, request) {
        if (conditions.peakHours) {
            const hour = request.startTime.getHours();
            const peakStart = conditions.peakHours.start || 9;
            const peakEnd = conditions.peakHours.end || 17;
            if (conditions.peakHours.isPeak) {
                return hour >= peakStart && hour < peakEnd;
            }
            else {
                return hour < peakStart || hour >= peakEnd;
            }
        }
        if (conditions.weekends) {
            const dayOfWeek = request.startTime.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            return conditions.weekends === isWeekend;
        }
        return true;
    }
    checkLocationBasedRule(conditions, request) {
        if (conditions.spaceTypes && conditions.spaceTypes.length > 0) {
            return true;
        }
        return true;
    }
    checkMemberBasedRule(conditions, request) {
        return true;
    }
    async createPricingRule(tenantId, request) {
        try {
            return await prisma_1.prisma.roomPricingRule.create({
                data: {
                    tenantId,
                    spaceId: request.spaceId,
                    name: request.name,
                    description: request.description,
                    ruleType: request.ruleType,
                    conditions: request.conditions,
                    basePrice: request.basePrice,
                    priceModifier: request.priceModifier,
                    modifierType: request.modifierType,
                    priority: request.priority || 1,
                    validFrom: request.validFrom,
                    validTo: request.validTo,
                    isActive: true,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create pricing rule', { tenantId, request }, error);
            throw error;
        }
    }
    async getPricingRules(tenantId, spaceId) {
        try {
            const whereClause = { tenantId, isActive: true };
            if (spaceId)
                whereClause.spaceId = spaceId;
            return await prisma_1.prisma.roomPricingRule.findMany({
                where: whereClause,
                include: {
                    space: true,
                },
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get pricing rules', { tenantId, spaceId }, error);
            throw error;
        }
    }
    async getRoomAnalytics(tenantId, request) {
        try {
            const whereClause = {
                tenantId,
                date: {
                    gte: request.startDate,
                    lte: request.endDate,
                },
            };
            if (request.spaceId) {
                whereClause.spaceId = request.spaceId;
            }
            const analytics = await prisma_1.prisma.roomUsageAnalytics.findMany({
                where: whereClause,
                include: {
                    space: true,
                },
                orderBy: { date: 'asc' },
            });
            if (request.granularity === 'weekly' || request.granularity === 'monthly') {
                return this.aggregateAnalytics(analytics, request.granularity);
            }
            return analytics;
        }
        catch (error) {
            logger_1.logger.error('Failed to get room analytics', { tenantId, request }, error);
            throw error;
        }
    }
    aggregateAnalytics(analytics, granularity) {
        const grouped = new Map();
        analytics.forEach(record => {
            let key;
            const date = new Date(record.date);
            if (granularity === 'weekly') {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
            }
            else {
                key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            }
            if (!grouped.has(key)) {
                grouped.set(key, {
                    period: key,
                    spaceId: record.spaceId,
                    space: record.space,
                    totalBookings: 0,
                    totalHours: 0,
                    revenue: 0,
                    noShowCount: 0,
                    records: [],
                });
            }
            const group = grouped.get(key);
            group.totalBookings += record.totalBookings;
            group.totalHours += Number(record.totalHours);
            group.revenue += Number(record.revenue);
            group.noShowCount += record.noShowCount;
            group.records.push(record);
        });
        return Array.from(grouped.values()).map(group => ({
            ...group,
            utilizationRate: group.records.length > 0
                ? group.records.reduce((sum, r) => sum + Number(r.utilizationRate), 0) / group.records.length
                : 0,
            averageRating: group.records.length > 0
                ? group.records.reduce((sum, r) => sum + (Number(r.averageRating) || 0), 0) / group.records.length
                : null,
        }));
    }
}
exports.RoomManagementService = RoomManagementService;
exports.roomManagementService = new RoomManagementService();
//# sourceMappingURL=roomManagementService.js.map