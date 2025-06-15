"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spaceService = exports.SpaceService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class SpaceService {
    async createSpace(tenantId, data) {
        try {
            await this.validateSpaceData(data);
            const existingSpace = await prisma_1.prisma.space.findFirst({
                where: {
                    tenantId,
                    name: data.name,
                    isActive: true
                }
            });
            if (existingSpace) {
                throw new errors_1.ValidationError('Space with this name already exists');
            }
            const space = await prisma_1.prisma.space.create({
                data: {
                    tenantId,
                    name: data.name,
                    type: data.type,
                    description: data.description,
                    capacity: data.capacity,
                    amenities: JSON.stringify(data.amenities || []),
                    hourlyRate: data.hourlyRate,
                    isActive: data.isActive ?? true,
                    ...(data.location && { location: data.location }),
                    ...(data.floor && { floor: data.floor }),
                    ...(data.equipment && { equipment: JSON.stringify(data.equipment) }),
                    ...(data.features && { features: JSON.stringify(data.features) })
                }
            });
            logger_1.logger.info('Space created successfully', {
                spaceId: space.id,
                tenantId,
                spaceName: space.name,
                type: space.type
            });
            return this.formatSpaceResponse(space);
        }
        catch (error) {
            logger_1.logger.error('Failed to create space', {
                tenantId,
                error: error.message
            });
            throw error;
        }
    }
    async getSpaces(tenantId, filters = {}) {
        try {
            const whereClause = {
                tenantId,
                ...(filters.isActive !== undefined && { isActive: filters.isActive }),
                ...(filters.type && { type: filters.type }),
                ...(filters.capacity && { capacity: { gte: filters.capacity } })
            };
            const spaces = await prisma_1.prisma.space.findMany({
                where: whereClause,
                include: {
                    bookings: {
                        where: {
                            status: { in: ['PENDING', 'CONFIRMED'] },
                            endTime: { gte: new Date() }
                        },
                        orderBy: { startTime: 'asc' }
                    },
                    occupancyTracking: {
                        orderBy: { timestamp: 'desc' },
                        take: 1
                    }
                },
                orderBy: [
                    { type: 'asc' },
                    { name: 'asc' }
                ]
            });
            const formattedSpaces = spaces.map(space => this.formatSpaceResponse(space));
            if (filters.amenities && filters.amenities.length > 0) {
                return formattedSpaces.filter(space => filters.amenities.every(amenity => space.amenities.includes(amenity)));
            }
            return formattedSpaces;
        }
        catch (error) {
            logger_1.logger.error('Failed to get spaces', {
                tenantId,
                error: error.message
            });
            throw error;
        }
    }
    async getSpaceById(tenantId, spaceId) {
        try {
            const space = await prisma_1.prisma.space.findFirst({
                where: {
                    id: spaceId,
                    tenantId
                },
                include: {
                    bookings: {
                        where: {
                            endTime: { gte: new Date() }
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true
                                }
                            }
                        },
                        orderBy: { startTime: 'asc' }
                    },
                    occupancyTracking: {
                        orderBy: { timestamp: 'desc' },
                        take: 10
                    }
                }
            });
            if (!space) {
                return null;
            }
            return this.formatSpaceResponse(space);
        }
        catch (error) {
            logger_1.logger.error('Failed to get space by ID', {
                spaceId,
                tenantId,
                error: error.message
            });
            throw error;
        }
    }
    async updateSpace(tenantId, spaceId, data) {
        try {
            if (Object.keys(data).length === 0) {
                throw new errors_1.ValidationError('No update data provided');
            }
            const existingSpace = await prisma_1.prisma.space.findFirst({
                where: { id: spaceId, tenantId }
            });
            if (!existingSpace) {
                throw new errors_1.ValidationError('Space not found');
            }
            if (data.name && data.name !== existingSpace.name) {
                const duplicateSpace = await prisma_1.prisma.space.findFirst({
                    where: {
                        tenantId,
                        name: data.name,
                        id: { not: spaceId },
                        isActive: true
                    }
                });
                if (duplicateSpace) {
                    throw new errors_1.ValidationError('Space with this name already exists');
                }
            }
            const updateData = {};
            if (data.name)
                updateData.name = data.name;
            if (data.type)
                updateData.type = data.type;
            if (data.description !== undefined)
                updateData.description = data.description;
            if (data.capacity)
                updateData.capacity = data.capacity;
            if (data.amenities)
                updateData.amenities = JSON.stringify(data.amenities);
            if (data.hourlyRate !== undefined)
                updateData.hourlyRate = data.hourlyRate;
            if (data.isActive !== undefined)
                updateData.isActive = data.isActive;
            const updatedSpace = await prisma_1.prisma.space.update({
                where: { id: spaceId },
                data: updateData
            });
            logger_1.logger.info('Space updated successfully', {
                spaceId,
                tenantId,
                updatedFields: Object.keys(updateData)
            });
            return this.formatSpaceResponse(updatedSpace);
        }
        catch (error) {
            logger_1.logger.error('Failed to update space', {
                spaceId,
                tenantId,
                error: error.message
            });
            throw error;
        }
    }
    async deleteSpace(tenantId, spaceId) {
        try {
            const activeBookings = await prisma_1.prisma.booking.count({
                where: {
                    spaceId,
                    tenantId,
                    status: { in: ['PENDING', 'CONFIRMED'] },
                    endTime: { gte: new Date() }
                }
            });
            if (activeBookings > 0) {
                throw new errors_1.ValidationError(`Cannot delete space with ${activeBookings} active booking(s). Please cancel or complete existing bookings first.`);
            }
            await prisma_1.prisma.space.update({
                where: { id: spaceId },
                data: { isActive: false }
            });
            logger_1.logger.info('Space deactivated successfully', {
                spaceId,
                tenantId
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete space', {
                spaceId,
                tenantId,
                error: error.message
            });
            throw error;
        }
    }
    async checkSpaceAvailability(tenantId, spaceId, startTime, endTime) {
        try {
            if (startTime >= endTime) {
                throw new errors_1.ValidationError('Start time must be before end time');
            }
            if (startTime < new Date()) {
                throw new errors_1.ValidationError('Cannot book in the past');
            }
            const space = await this.getSpaceById(tenantId, spaceId);
            if (!space) {
                throw new errors_1.ValidationError('Space not found');
            }
            if (!space.isActive) {
                throw new errors_1.ValidationError('Space is not active');
            }
            const conflictingBookings = await prisma_1.prisma.booking.findMany({
                where: {
                    spaceId,
                    tenantId,
                    status: { in: ['PENDING', 'CONFIRMED'] },
                    OR: [
                        {
                            startTime: {
                                gte: startTime,
                                lt: endTime
                            }
                        },
                        {
                            endTime: {
                                gt: startTime,
                                lte: endTime
                            }
                        },
                        {
                            AND: [
                                { startTime: { lte: startTime } },
                                { endTime: { gte: endTime } }
                            ]
                        }
                    ]
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });
            const isAvailable = conflictingBookings.length === 0;
            return {
                isAvailable,
                conflictingBookings: isAvailable ? undefined : conflictingBookings,
                space
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to check space availability', {
                spaceId,
                tenantId,
                startTime,
                endTime,
                error: error.message
            });
            throw error;
        }
    }
    async findAvailableSpaces(tenantId, query) {
        try {
            const spaces = await this.getSpaces(tenantId, {
                isActive: true,
                type: query.type,
                capacity: query.capacity,
                amenities: query.amenities
            });
            const availableSpaces = [];
            for (const space of spaces) {
                const availability = await this.checkSpaceAvailability(tenantId, space.id, query.startTime, query.endTime);
                if (availability.isAvailable) {
                    availableSpaces.push(space);
                }
            }
            return availableSpaces;
        }
        catch (error) {
            logger_1.logger.error('Failed to find available spaces', {
                tenantId,
                query,
                error: error.message
            });
            throw error;
        }
    }
    async getSpaceUtilization(tenantId, spaceId, startDate, endDate) {
        try {
            const whereClause = {
                tenantId,
                status: { in: ['CONFIRMED', 'COMPLETED'] },
                ...(spaceId && { spaceId }),
                ...(startDate && { startTime: { gte: startDate } }),
                ...(endDate && { endTime: { lte: endDate } })
            };
            const bookings = await prisma_1.prisma.booking.findMany({
                where: whereClause,
                include: {
                    space: true
                }
            });
            const totalBookings = bookings.length;
            const totalHours = bookings.reduce((total, booking) => {
                const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60);
                return total + duration;
            }, 0);
            const averageBookingDuration = totalBookings > 0 ? totalHours / totalBookings : 0;
            const businessHoursPerDay = 12;
            const daysInPeriod = startDate && endDate
                ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                : 30;
            const availableHours = businessHoursPerDay * daysInPeriod;
            const utilizationRate = availableHours > 0 ? (totalHours / availableHours) * 100 : 0;
            const revenueGenerated = bookings.reduce((total, booking) => {
                return total + (booking.cost ? parseFloat(booking.cost.toString()) : 0);
            }, 0);
            const timeSlots = {};
            bookings.forEach(booking => {
                const hour = booking.startTime.getHours();
                const timeSlot = `${hour}:00-${hour + 1}:00`;
                timeSlots[timeSlot] = (timeSlots[timeSlot] || 0) + 1;
            });
            const popularTimeSlots = Object.entries(timeSlots)
                .map(([timeSlot, count]) => ({ timeSlot, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            return {
                totalBookings,
                totalHours,
                averageBookingDuration,
                utilizationRate,
                popularTimeSlots,
                revenueGenerated
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get space utilization', {
                tenantId,
                spaceId,
                error: error.message
            });
            throw error;
        }
    }
    async validateSpaceData(data) {
        if (!data.name || data.name.trim().length === 0) {
            throw new errors_1.ValidationError('Space name is required');
        }
        if (data.capacity <= 0) {
            throw new errors_1.ValidationError('Capacity must be greater than 0');
        }
        if (data.hourlyRate && data.hourlyRate < 0) {
            throw new errors_1.ValidationError('Hourly rate cannot be negative');
        }
    }
    formatSpaceResponse(space) {
        return {
            id: space.id,
            tenantId: space.tenantId,
            name: space.name,
            type: space.type,
            description: space.description,
            capacity: space.capacity,
            amenities: space.amenities ? JSON.parse(space.amenities) : [],
            hourlyRate: space.hourlyRate ? parseFloat(space.hourlyRate.toString()) : undefined,
            isActive: space.isActive,
            location: space.location,
            floor: space.floor,
            equipment: space.equipment ? JSON.parse(space.equipment) : [],
            features: space.features ? JSON.parse(space.features) : [],
            createdAt: space.createdAt,
            updatedAt: space.updatedAt,
            bookings: space.bookings,
            occupancyTracking: space.occupancyTracking
        };
    }
}
exports.SpaceService = SpaceService;
exports.spaceService = new SpaceService();
//# sourceMappingURL=spaceService.js.map