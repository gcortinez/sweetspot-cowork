"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingService = exports.BookingService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const spaceService_1 = require("./spaceService");
const auditLogService_1 = require("./auditLogService");
class BookingService {
    async createBooking(tenantId, userId, data) {
        try {
            await this.validateBookingData(data);
            const availability = await spaceService_1.spaceService.checkSpaceAvailability(tenantId, data.spaceId, data.startTime, data.endTime);
            if (!availability.isAvailable) {
                throw new errors_1.ValidationError(`Space is not available for the requested time. ${availability.conflictingBookings?.length || 0} conflicting booking(s) found.`);
            }
            const space = availability.space;
            const durationHours = (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60 * 60);
            const cost = space.hourlyRate ? space.hourlyRate * durationHours : 0;
            const booking = await prisma_1.prisma.booking.create({
                data: {
                    tenantId,
                    spaceId: data.spaceId,
                    userId,
                    title: data.title,
                    description: data.description,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    status: 'CONFIRMED',
                    cost: cost > 0 ? cost : undefined,
                    ...(data.attendees && { attendees: JSON.stringify(data.attendees) }),
                    ...(data.equipment && { equipment: JSON.stringify(data.equipment) }),
                    ...(data.catering !== undefined && { catering: data.catering }),
                    ...(data.notes && { notes: data.notes })
                },
                include: {
                    space: true,
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
            await auditLogService_1.auditLogService.log({
                tenantId,
                userId,
                action: 'CREATE',
                entityType: 'Booking',
                entityId: booking.id,
                newValues: {
                    spaceId: data.spaceId,
                    title: data.title,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    cost
                },
                details: {
                    action: 'Booking created',
                    spaceName: space.name,
                    duration: `${durationHours} hours`
                }
            });
            logger_1.logger.info('Booking created successfully', {
                bookingId: booking.id,
                tenantId,
                userId,
                spaceId: data.spaceId,
                duration: durationHours,
                cost
            });
            return this.formatBookingResponse(booking);
        }
        catch (error) {
            logger_1.logger.error('Failed to create booking', {
                tenantId,
                userId,
                error: error.message
            });
            throw error;
        }
    }
    async getBookings(tenantId, filters = {}, page = 1, limit = 20) {
        try {
            const whereClause = {
                tenantId,
                ...(filters.userId && { userId: filters.userId }),
                ...(filters.spaceId && { spaceId: filters.spaceId }),
                ...(filters.status && { status: { in: filters.status } }),
            };
            if (filters.startDate || filters.endDate || filters.upcoming) {
                const dateFilter = {};
                if (filters.upcoming) {
                    dateFilter.endTime = { gte: new Date() };
                }
                else {
                    if (filters.startDate) {
                        dateFilter.startTime = { gte: filters.startDate };
                    }
                    if (filters.endDate) {
                        dateFilter.endTime = { lte: filters.endDate };
                    }
                }
                Object.assign(whereClause, dateFilter);
            }
            const total = await prisma_1.prisma.booking.count({ where: whereClause });
            const bookings = await prisma_1.prisma.booking.findMany({
                where: whereClause,
                include: {
                    space: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { startTime: 'asc' },
                skip: (page - 1) * limit,
                take: limit
            });
            const totalPages = Math.ceil(total / limit);
            return {
                bookings: bookings.map(booking => this.formatBookingResponse(booking)),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get bookings', {
                tenantId,
                filters,
                error: error.message
            });
            throw error;
        }
    }
    async getBookingById(tenantId, bookingId) {
        try {
            const booking = await prisma_1.prisma.booking.findFirst({
                where: {
                    id: bookingId,
                    tenantId
                },
                include: {
                    space: true,
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
            if (!booking) {
                return null;
            }
            return this.formatBookingResponse(booking);
        }
        catch (error) {
            logger_1.logger.error('Failed to get booking by ID', {
                bookingId,
                tenantId,
                error: error.message
            });
            throw error;
        }
    }
    async updateBooking(tenantId, bookingId, userId, data) {
        try {
            const existingBooking = await this.getBookingById(tenantId, bookingId);
            if (!existingBooking) {
                throw new errors_1.ValidationError('Booking not found');
            }
            if (existingBooking.userId !== userId) {
                throw new errors_1.ValidationError('You can only edit your own bookings');
            }
            if (data.startTime || data.endTime) {
                const newStartTime = data.startTime || existingBooking.startTime;
                const newEndTime = data.endTime || existingBooking.endTime;
                if (newStartTime >= newEndTime) {
                    throw new errors_1.ValidationError('Start time must be before end time');
                }
                const conflictingBookings = await prisma_1.prisma.booking.findMany({
                    where: {
                        spaceId: existingBooking.spaceId,
                        tenantId,
                        id: { not: bookingId },
                        status: { in: ['PENDING', 'CONFIRMED'] },
                        OR: [
                            {
                                startTime: { gte: newStartTime, lt: newEndTime }
                            },
                            {
                                endTime: { gt: newStartTime, lte: newEndTime }
                            },
                            {
                                AND: [
                                    { startTime: { lte: newStartTime } },
                                    { endTime: { gte: newEndTime } }
                                ]
                            }
                        ]
                    }
                });
                if (conflictingBookings.length > 0) {
                    throw new errors_1.ValidationError('Space is not available for the new time slot');
                }
                if (existingBooking.space?.hourlyRate) {
                    const durationHours = (newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60 * 60);
                    data.cost = existingBooking.space.hourlyRate * durationHours;
                }
            }
            const updateData = {};
            if (data.title)
                updateData.title = data.title;
            if (data.description !== undefined)
                updateData.description = data.description;
            if (data.startTime)
                updateData.startTime = data.startTime;
            if (data.endTime)
                updateData.endTime = data.endTime;
            if (data.status)
                updateData.status = data.status;
            if (data.cost !== undefined)
                updateData.cost = data.cost;
            if (data.attendees)
                updateData.attendees = JSON.stringify(data.attendees);
            if (data.equipment)
                updateData.equipment = JSON.stringify(data.equipment);
            if (data.catering !== undefined)
                updateData.catering = data.catering;
            if (data.notes !== undefined)
                updateData.notes = data.notes;
            const updatedBooking = await prisma_1.prisma.booking.update({
                where: { id: bookingId },
                data: updateData,
                include: {
                    space: true,
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
            await auditLogService_1.auditLogService.log({
                tenantId,
                userId,
                action: 'UPDATE',
                entityType: 'Booking',
                entityId: bookingId,
                oldValues: {
                    title: existingBooking.title,
                    startTime: existingBooking.startTime,
                    endTime: existingBooking.endTime,
                    status: existingBooking.status
                },
                newValues: updateData,
                details: {
                    action: 'Booking updated',
                    updatedFields: Object.keys(updateData)
                }
            });
            logger_1.logger.info('Booking updated successfully', {
                bookingId,
                tenantId,
                userId,
                updatedFields: Object.keys(updateData)
            });
            return this.formatBookingResponse(updatedBooking);
        }
        catch (error) {
            logger_1.logger.error('Failed to update booking', {
                bookingId,
                tenantId,
                userId,
                error: error.message
            });
            throw error;
        }
    }
    async cancelBooking(tenantId, bookingId, userId, reason) {
        try {
            const booking = await this.getBookingById(tenantId, bookingId);
            if (!booking) {
                throw new errors_1.ValidationError('Booking not found');
            }
            if (booking.userId !== userId) {
                throw new errors_1.ValidationError('You can only cancel your own bookings');
            }
            if (booking.status === 'CANCELLED') {
                throw new errors_1.ValidationError('Booking is already cancelled');
            }
            if (booking.status === 'COMPLETED') {
                throw new errors_1.ValidationError('Cannot cancel completed booking');
            }
            await prisma_1.prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'CANCELLED',
                    ...(reason && { notes: reason })
                }
            });
            await auditLogService_1.auditLogService.log({
                tenantId,
                userId,
                action: 'UPDATE',
                entityType: 'Booking',
                entityId: bookingId,
                oldValues: { status: booking.status },
                newValues: { status: 'CANCELLED' },
                details: {
                    action: 'Booking cancelled',
                    reason: reason || 'No reason provided'
                }
            });
            logger_1.logger.info('Booking cancelled successfully', {
                bookingId,
                tenantId,
                userId,
                reason
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to cancel booking', {
                bookingId,
                tenantId,
                userId,
                error: error.message
            });
            throw error;
        }
    }
    async getUpcomingBookings(tenantId, userId, limit = 10) {
        try {
            const whereClause = {
                tenantId,
                status: { in: ['PENDING', 'CONFIRMED'] },
                startTime: { gte: new Date() },
                ...(userId && { userId })
            };
            const bookings = await prisma_1.prisma.booking.findMany({
                where: whereClause,
                include: {
                    space: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { startTime: 'asc' },
                take: limit
            });
            return bookings.map(booking => this.formatBookingResponse(booking));
        }
        catch (error) {
            logger_1.logger.error('Failed to get upcoming bookings', {
                tenantId,
                userId,
                error: error.message
            });
            throw error;
        }
    }
    async getBookingStatistics(tenantId, startDate, endDate) {
        try {
            const whereClause = {
                tenantId,
                ...(startDate && { startTime: { gte: startDate } }),
                ...(endDate && { endTime: { lte: endDate } })
            };
            const bookings = await prisma_1.prisma.booking.findMany({
                where: whereClause,
                include: {
                    space: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });
            const totalBookings = bookings.length;
            const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
            const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
            const totalRevenue = bookings.reduce((sum, booking) => {
                return sum + (booking.cost ? parseFloat(booking.cost.toString()) : 0);
            }, 0);
            const totalDuration = bookings.reduce((sum, booking) => {
                const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60);
                return sum + duration;
            }, 0);
            const averageBookingDuration = totalBookings > 0 ? totalDuration / totalBookings : 0;
            const spaceBookingCounts = {};
            bookings.forEach(booking => {
                const spaceId = booking.spaceId;
                if (!spaceBookingCounts[spaceId]) {
                    spaceBookingCounts[spaceId] = {
                        name: booking.space.name,
                        count: 0
                    };
                }
                spaceBookingCounts[spaceId].count++;
            });
            const popularSpaces = Object.entries(spaceBookingCounts)
                .map(([spaceId, data]) => ({
                spaceId,
                spaceName: data.name,
                bookingCount: data.count
            }))
                .sort((a, b) => b.bookingCount - a.bookingCount)
                .slice(0, 5);
            const statusCounts = {
                PENDING: 0,
                CONFIRMED: 0,
                CANCELLED: 0,
                COMPLETED: 0,
                NO_SHOW: 0
            };
            bookings.forEach(booking => {
                statusCounts[booking.status]++;
            });
            const bookingsByStatus = Object.entries(statusCounts)
                .map(([status, count]) => ({ status: status, count }))
                .filter(item => item.count > 0);
            return {
                totalBookings,
                confirmedBookings,
                cancelledBookings,
                totalRevenue,
                averageBookingDuration,
                popularSpaces,
                bookingsByStatus
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get booking statistics', {
                tenantId,
                error: error.message
            });
            throw error;
        }
    }
    async validateBookingData(data) {
        if (!data.title || data.title.trim().length === 0) {
            throw new errors_1.ValidationError('Booking title is required');
        }
        if (data.startTime >= data.endTime) {
            throw new errors_1.ValidationError('Start time must be before end time');
        }
        if (data.startTime < new Date()) {
            throw new errors_1.ValidationError('Cannot book in the past');
        }
        const durationMinutes = (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60);
        if (durationMinutes < 30) {
            throw new errors_1.ValidationError('Minimum booking duration is 30 minutes');
        }
        const durationHours = durationMinutes / 60;
        if (durationHours > 8) {
            throw new errors_1.ValidationError('Maximum booking duration is 8 hours');
        }
    }
    formatBookingResponse(booking) {
        return {
            id: booking.id,
            tenantId: booking.tenantId,
            spaceId: booking.spaceId,
            userId: booking.userId,
            title: booking.title,
            description: booking.description,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            cost: booking.cost ? parseFloat(booking.cost.toString()) : undefined,
            attendees: booking.attendees ? JSON.parse(booking.attendees) : [],
            equipment: booking.equipment ? JSON.parse(booking.equipment) : [],
            catering: booking.catering,
            notes: booking.notes,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            space: booking.space,
            user: booking.user
        };
    }
}
exports.BookingService = BookingService;
exports.bookingService = new BookingService();
//# sourceMappingURL=bookingService.js.map