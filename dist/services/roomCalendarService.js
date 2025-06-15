"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomCalendarService = exports.RoomCalendarService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const roomManagementService_1 = require("./roomManagementService");
class RoomCalendarService {
    async getCalendarView(tenantId, startDate, endDate, filters = {}) {
        try {
            const spaces = await this.getFilteredSpaces(tenantId, filters);
            const bookings = await this.getBookingsForDateRange(tenantId, startDate, endDate, filters);
            const maintenanceEvents = filters.showMaintenanceEvents
                ? await this.getMaintenanceEvents(tenantId, startDate, endDate, filters.spaceIds)
                : [];
            const resources = await this.convertSpacesToResources(spaces);
            const events = [
                ...this.convertBookingsToEvents(bookings),
                ...this.convertMaintenanceToEvents(maintenanceEvents),
            ];
            const businessHours = await this.getBusinessHours(tenantId);
            return {
                events,
                resources,
                timeZone: 'UTC',
                businessHours,
                validRange: {
                    start: startDate,
                    end: endDate,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get calendar view', { tenantId, startDate, endDate, filters }, error);
            throw error;
        }
    }
    async getAvailabilityMatrix(tenantId, date, spaceIds, slotDuration = 30) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            const whereClause = { tenantId, isActive: true };
            if (spaceIds && spaceIds.length > 0) {
                whereClause.id = { in: spaceIds };
            }
            const spaces = await prisma_1.prisma.space.findMany({
                where: whereClause,
                include: {
                    availability: {
                        where: {
                            dayOfWeek: date.getDay(),
                            isAvailable: true,
                        },
                    },
                    bookings: {
                        where: {
                            startTime: { gte: startOfDay },
                            endTime: { lte: endOfDay },
                            status: { in: [client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.CHECKED_IN] },
                        },
                    },
                    maintenanceLogs: {
                        where: {
                            scheduledAt: { gte: startOfDay, lte: endOfDay },
                            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
                        },
                    },
                },
            });
            const slots = [];
            let totalSlots = 0;
            let availableSlots = 0;
            for (const space of spaces) {
                for (const availability of space.availability) {
                    const [startHour, startMinute] = availability.startTime.split(':').map(Number);
                    const [endHour, endMinute] = availability.endTime.split(':').map(Number);
                    const slotStart = new Date(date);
                    slotStart.setHours(startHour, startMinute, 0, 0);
                    const slotEnd = new Date(date);
                    slotEnd.setHours(endHour, endMinute, 0, 0);
                    let currentSlot = new Date(slotStart);
                    while (currentSlot < slotEnd) {
                        const slotEndTime = new Date(currentSlot.getTime() + slotDuration * 60000);
                        if (slotEndTime > slotEnd)
                            break;
                        totalSlots++;
                        const conflicts = [];
                        let available = true;
                        const conflictingBooking = space.bookings.find(booking => currentSlot < booking.endTime && slotEndTime > booking.startTime);
                        if (conflictingBooking) {
                            available = false;
                            conflicts.push(`Booked by ${conflictingBooking.title}`);
                        }
                        const conflictingMaintenance = space.maintenanceLogs.find(maintenance => currentSlot < new Date(maintenance.scheduledAt.getTime() + 4 * 60 * 60 * 1000) &&
                            slotEndTime > maintenance.scheduledAt);
                        if (conflictingMaintenance) {
                            available = false;
                            conflicts.push(`Maintenance: ${conflictingMaintenance.title}`);
                        }
                        if (available) {
                            availableSlots++;
                        }
                        const price = await roomManagementService_1.roomManagementService.calculatePrice(tenantId, {
                            spaceId: space.id,
                            startTime: currentSlot,
                            endTime: slotEndTime,
                        });
                        slots.push({
                            start: new Date(currentSlot),
                            end: new Date(slotEndTime),
                            resourceId: space.id,
                            available,
                            price,
                            conflicts: conflicts.length > 0 ? conflicts : undefined,
                        });
                        currentSlot = new Date(currentSlot.getTime() + slotDuration * 60000);
                    }
                }
            }
            return {
                date: date.toISOString().split('T')[0],
                slots,
                summary: {
                    totalSlots,
                    availableSlots,
                    occupiedSlots: totalSlots - availableSlots,
                    availabilityRate: totalSlots > 0 ? availableSlots / totalSlots : 0,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get availability matrix', { tenantId, date }, error);
            throw error;
        }
    }
    async getRealtimeCalendarUpdates(tenantId, lastUpdateTime, spaceIds) {
        try {
            const now = new Date();
            const whereClause = {
                tenantId,
                updatedAt: { gt: lastUpdateTime },
            };
            if (spaceIds && spaceIds.length > 0) {
                whereClause.spaceId = { in: spaceIds };
            }
            const updatedBookings = await prisma_1.prisma.booking.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    space: {
                        select: {
                            name: true,
                            capacity: true,
                        },
                    },
                    checkIns: {
                        where: { checkedOutAt: null },
                        take: 1,
                    },
                    approval: true,
                },
            });
            const createdEvents = [];
            const updatedEvents = [];
            for (const booking of updatedBookings) {
                const event = this.convertBookingToEvent(booking);
                if (booking.createdAt > lastUpdateTime) {
                    createdEvents.push(event);
                }
                else {
                    updatedEvents.push(event);
                }
            }
            const deletedBookings = await prisma_1.prisma.booking.findMany({
                where: {
                    ...whereClause,
                    status: client_1.BookingStatus.CANCELLED,
                },
                select: { id: true },
            });
            const deletedEventIds = deletedBookings.map(b => b.id);
            const updatedSpaces = await prisma_1.prisma.space.findMany({
                where: {
                    tenantId,
                    updatedAt: { gt: lastUpdateTime },
                    ...(spaceIds && spaceIds.length > 0 ? { id: { in: spaceIds } } : {}),
                },
                include: {
                    features: {
                        include: {
                            feature: true,
                        },
                    },
                    availability: true,
                },
            });
            const updatedResources = await this.convertSpacesToResources(updatedSpaces);
            return {
                events: {
                    created: createdEvents,
                    updated: updatedEvents,
                    deleted: deletedEventIds,
                },
                resources: {
                    updated: updatedResources,
                },
                lastUpdateTime: now,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get realtime calendar updates', { tenantId, lastUpdateTime }, error);
            throw error;
        }
    }
    async detectConflicts(tenantId, spaceId, startTime, endTime, excludeBookingId) {
        try {
            const conflicts = [];
            const conflictingBookings = await prisma_1.prisma.booking.findMany({
                where: {
                    tenantId,
                    spaceId,
                    id: { not: excludeBookingId },
                    status: { in: [client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.CHECKED_IN] },
                    OR: [
                        {
                            startTime: { lt: endTime },
                            endTime: { gt: startTime },
                        },
                    ],
                },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });
            for (const booking of conflictingBookings) {
                conflicts.push({
                    type: 'BOOKING',
                    description: `Conflict with booking "${booking.title}" by ${booking.user.firstName} ${booking.user.lastName}`,
                    startTime: booking.startTime,
                    endTime: booking.endTime,
                    severity: 'HIGH',
                });
            }
            const conflictingMaintenance = await prisma_1.prisma.roomMaintenanceLog.findMany({
                where: {
                    tenantId,
                    spaceId,
                    status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
                    scheduledAt: { lt: endTime },
                },
            });
            for (const maintenance of conflictingMaintenance) {
                const maintenanceEnd = new Date(maintenance.scheduledAt.getTime() + 4 * 60 * 60 * 1000);
                if (maintenanceEnd > startTime) {
                    conflicts.push({
                        type: 'MAINTENANCE',
                        description: `Conflict with maintenance: ${maintenance.title}`,
                        startTime: maintenance.scheduledAt,
                        endTime: maintenanceEnd,
                        severity: maintenance.maintenanceType === 'EMERGENCY' ? 'HIGH' : 'MEDIUM',
                    });
                }
            }
            const dayOfWeek = startTime.getDay();
            const startTimeStr = startTime.toTimeString().substring(0, 5);
            const endTimeStr = endTime.toTimeString().substring(0, 5);
            const availability = await prisma_1.prisma.roomAvailability.findFirst({
                where: {
                    tenantId,
                    spaceId,
                    dayOfWeek,
                    isAvailable: true,
                    startTime: { lte: startTimeStr },
                    endTime: { gte: endTimeStr },
                },
            });
            if (!availability) {
                conflicts.push({
                    type: 'AVAILABILITY',
                    description: 'Time slot is outside of room availability hours',
                    startTime,
                    endTime,
                    severity: 'MEDIUM',
                });
            }
            return conflicts;
        }
        catch (error) {
            logger_1.logger.error('Failed to detect conflicts', { tenantId, spaceId, startTime, endTime }, error);
            throw error;
        }
    }
    async getFilteredSpaces(tenantId, filters) {
        const whereClause = { tenantId };
        if (filters.spaceIds && filters.spaceIds.length > 0) {
            whereClause.id = { in: filters.spaceIds };
        }
        if (filters.spaceTypes && filters.spaceTypes.length > 0) {
            whereClause.type = { in: filters.spaceTypes };
        }
        return await prisma_1.prisma.space.findMany({
            where: whereClause,
            include: {
                features: {
                    include: {
                        feature: true,
                    },
                },
                availability: true,
                bookings: {
                    where: {
                        startTime: { lte: new Date() },
                        endTime: { gt: new Date() },
                        status: { in: [client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.CHECKED_IN] },
                    },
                    take: 1,
                },
                maintenanceLogs: {
                    where: {
                        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
                        scheduledAt: { lte: new Date() },
                    },
                    take: 1,
                },
            },
        });
    }
    async getBookingsForDateRange(tenantId, startDate, endDate, filters) {
        const whereClause = {
            tenantId,
            startTime: { gte: startDate },
            endTime: { lte: endDate },
        };
        if (filters.spaceIds && filters.spaceIds.length > 0) {
            whereClause.spaceId = { in: filters.spaceIds };
        }
        if (filters.userId) {
            whereClause.userId = filters.userId;
        }
        if (filters.status && filters.status.length > 0) {
            whereClause.status = { in: filters.status };
        }
        return await prisma_1.prisma.booking.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                space: {
                    select: {
                        name: true,
                        capacity: true,
                    },
                },
                checkIns: {
                    where: { checkedOutAt: null },
                    take: 1,
                },
                approval: true,
            },
            orderBy: { startTime: 'asc' },
        });
    }
    async getMaintenanceEvents(tenantId, startDate, endDate, spaceIds) {
        const whereClause = {
            tenantId,
            scheduledAt: { gte: startDate, lte: endDate },
        };
        if (spaceIds && spaceIds.length > 0) {
            whereClause.spaceId = { in: spaceIds };
        }
        return await prisma_1.prisma.roomMaintenanceLog.findMany({
            where: whereClause,
            include: {
                space: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { scheduledAt: 'asc' },
        });
    }
    async convertSpacesToResources(spaces) {
        return spaces.map(space => {
            let currentStatus = 'AVAILABLE';
            if (!space.isActive) {
                currentStatus = 'OUT_OF_ORDER';
            }
            else if (space.maintenanceLogs.length > 0) {
                currentStatus = 'MAINTENANCE';
            }
            else if (space.bookings.length > 0) {
                currentStatus = 'OCCUPIED';
            }
            const businessHours = space.availability.map((avail) => ({
                daysOfWeek: [avail.dayOfWeek],
                startTime: avail.startTime,
                endTime: avail.endTime,
            }));
            return {
                id: space.id,
                title: space.name,
                businessHours,
                extendedProps: {
                    type: space.type,
                    capacity: space.capacity,
                    hourlyRate: space.hourlyRate ? Number(space.hourlyRate) : undefined,
                    amenities: space.amenities || [],
                    features: space.features.map((spaceFeature) => ({
                        name: spaceFeature.feature.name,
                        category: spaceFeature.feature.category,
                        quantity: spaceFeature.quantity,
                    })),
                    isActive: space.isActive,
                    currentStatus,
                },
            };
        });
    }
    convertBookingsToEvents(bookings) {
        return bookings.map(booking => this.convertBookingToEvent(booking));
    }
    convertBookingToEvent(booking) {
        const isCheckedIn = booking.checkIns && booking.checkIns.length > 0;
        return {
            id: booking.id,
            title: booking.title,
            start: booking.startTime,
            end: booking.endTime,
            resourceId: booking.spaceId,
            status: booking.status,
            userId: booking.userId,
            userName: `${booking.user.firstName} ${booking.user.lastName}`,
            userEmail: booking.user.email,
            description: booking.description,
            color: this.getEventColor(booking.status, isCheckedIn),
            editable: booking.status === client_1.BookingStatus.CONFIRMED || booking.status === client_1.BookingStatus.PENDING,
            extendedProps: {
                bookingId: booking.id,
                spaceId: booking.spaceId,
                spaceName: booking.space.name,
                capacity: booking.space.capacity,
                cost: booking.cost ? Number(booking.cost) : undefined,
                checkedIn: isCheckedIn,
                requiresApproval: !!booking.approval,
                approvalStatus: booking.approval?.status,
            },
        };
    }
    convertMaintenanceToEvents(maintenanceEvents) {
        return maintenanceEvents.map(maintenance => ({
            id: `maintenance_${maintenance.id}`,
            title: `🔧 ${maintenance.title}`,
            start: maintenance.scheduledAt,
            end: new Date(maintenance.scheduledAt.getTime() + 4 * 60 * 60 * 1000),
            resourceId: maintenance.spaceId,
            status: 'CONFIRMED',
            userId: 'system',
            userName: 'System',
            userEmail: 'system@sweetspot.com',
            description: maintenance.description || `${maintenance.maintenanceType} maintenance`,
            color: '#ff9800',
            editable: false,
            extendedProps: {
                bookingId: maintenance.id,
                spaceId: maintenance.spaceId,
                spaceName: maintenance.space.name,
                capacity: 0,
                checkedIn: false,
                requiresApproval: false,
            },
        }));
    }
    getEventColor(status, isCheckedIn) {
        if (isCheckedIn)
            return '#4caf50';
        switch (status) {
            case client_1.BookingStatus.CONFIRMED:
                return '#2196f3';
            case client_1.BookingStatus.PENDING:
                return '#ff9800';
            case client_1.BookingStatus.CANCELLED:
                return '#f44336';
            case client_1.BookingStatus.COMPLETED:
                return '#9e9e9e';
            case client_1.BookingStatus.NO_SHOW:
                return '#e91e63';
            default:
                return '#607d8b';
        }
    }
    async getBusinessHours(tenantId) {
        return [
            {
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '09:00',
                endTime: '18:00',
            },
            {
                daysOfWeek: [6],
                startTime: '10:00',
                endTime: '16:00',
            },
        ];
    }
    async generateCalendarSummary(tenantId, startDate, endDate, spaceIds) {
        try {
            const whereClause = {
                tenantId,
                startTime: { gte: startDate },
                endTime: { lte: endDate },
                status: { in: [client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.CHECKED_IN, client_1.BookingStatus.CHECKED_OUT] },
            };
            if (spaceIds && spaceIds.length > 0) {
                whereClause.spaceId = { in: spaceIds };
            }
            const bookings = await prisma_1.prisma.booking.findMany({
                where: whereClause,
                include: {
                    space: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            const totalBookings = bookings.length;
            const totalRevenue = bookings.reduce((sum, booking) => sum + (Number(booking.cost) || 0), 0);
            const totalHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
            const bookedHours = bookings.reduce((sum, booking) => sum + (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60), 0);
            const utilizationRate = totalHours > 0 ? bookedHours / totalHours : 0;
            const roomBookings = new Map();
            bookings.forEach(booking => {
                const key = booking.spaceId;
                if (!roomBookings.has(key)) {
                    roomBookings.set(key, { name: booking.space.name, count: 0 });
                }
                roomBookings.get(key).count++;
            });
            const mostPopular = Array.from(roomBookings.entries()).reduce((max, [id, data]) => data.count > max.bookings ? { id, name: data.name, bookings: data.count } : max, { id: '', name: '', bookings: 0 });
            const hourlyBookings = new Array(24).fill(0);
            bookings.forEach(booking => {
                const hour = booking.startTime.getHours();
                hourlyBookings[hour]++;
            });
            const peakUsageHours = hourlyBookings
                .map((count, hour) => ({ hour, bookings: count }))
                .filter(item => item.bookings > 0)
                .sort((a, b) => b.bookings - a.bookings)
                .slice(0, 5);
            const upcomingMaintenances = await prisma_1.prisma.roomMaintenanceLog.count({
                where: {
                    tenantId,
                    scheduledAt: { gte: new Date(), lte: endDate },
                    status: 'SCHEDULED',
                    ...(spaceIds && spaceIds.length > 0 ? { spaceId: { in: spaceIds } } : {}),
                },
            });
            return {
                period: { start: startDate, end: endDate },
                totalBookings,
                totalRevenue,
                utilizationRate,
                mostPopularRoom: mostPopular,
                peakUsageHours,
                upcomingMaintenances,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate calendar summary', { tenantId, startDate, endDate }, error);
            throw error;
        }
    }
}
exports.RoomCalendarService = RoomCalendarService;
exports.roomCalendarService = new RoomCalendarService();
//# sourceMappingURL=roomCalendarService.js.map