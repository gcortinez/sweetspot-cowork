"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingManagementService = exports.BookingManagementService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const roomManagementService_1 = require("./roomManagementService");
class BookingManagementService {
    async createBooking(tenantId, request) {
        try {
            return await prisma_1.prisma.$transaction(async (tx) => {
                const user = await tx.user.findFirst({
                    where: { id: request.userId, tenantId },
                });
                if (!user) {
                    throw new Error('User not found or does not belong to tenant');
                }
                const space = await tx.space.findFirst({
                    where: { id: request.spaceId, tenantId, isActive: true },
                });
                if (!space) {
                    throw new Error('Space not found or not active');
                }
                const isAvailable = await roomManagementService_1.roomManagementService.checkAvailability(tenantId, {
                    spaceId: request.spaceId,
                    startTime: request.startTime,
                    endTime: request.endTime,
                });
                if (!isAvailable) {
                    throw new Error('Room is not available for the requested time slot');
                }
                const cost = await roomManagementService_1.roomManagementService.calculatePrice(tenantId, {
                    spaceId: request.spaceId,
                    startTime: request.startTime,
                    endTime: request.endTime,
                });
                const requiresApproval = request.requiresApproval ||
                    this.shouldRequireApproval(user, space, request);
                const booking = await tx.booking.create({
                    data: {
                        tenantId,
                        spaceId: request.spaceId,
                        userId: request.userId,
                        title: request.title,
                        description: request.description,
                        startTime: request.startTime,
                        endTime: request.endTime,
                        cost,
                        status: requiresApproval ? client_1.BookingStatus.PENDING : client_1.BookingStatus.CONFIRMED,
                    },
                    include: {
                        space: true,
                        user: true,
                    },
                });
                if (requiresApproval) {
                    await tx.bookingApproval.create({
                        data: {
                            tenantId,
                            bookingId: booking.id,
                            status: client_1.ApprovalStatus.PENDING,
                        },
                    });
                }
                await tx.auditLog.create({
                    data: {
                        tenantId,
                        userId: request.userId,
                        action: 'BOOKING_CREATED',
                        entityType: 'Booking',
                        entityId: booking.id,
                        details: {
                            spaceId: request.spaceId,
                            startTime: request.startTime,
                            endTime: request.endTime,
                            cost,
                            requiresApproval,
                        },
                        timestamp: new Date(),
                    },
                });
                return booking;
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create booking', { tenantId, request }, error);
            throw error;
        }
    }
    async updateBooking(tenantId, bookingId, userId, updates) {
        try {
            return await prisma_1.prisma.$transaction(async (tx) => {
                const existingBooking = await tx.booking.findFirst({
                    where: {
                        id: bookingId,
                        tenantId,
                        userId,
                        status: { in: [client_1.BookingStatus.PENDING, client_1.BookingStatus.CONFIRMED] },
                    },
                });
                if (!existingBooking) {
                    throw new Error('Booking not found or cannot be modified');
                }
                if (updates.startTime || updates.endTime) {
                    const newStartTime = updates.startTime || existingBooking.startTime;
                    const newEndTime = updates.endTime || existingBooking.endTime;
                    const isAvailable = await roomManagementService_1.roomManagementService.checkAvailability(tenantId, {
                        spaceId: existingBooking.spaceId,
                        startTime: newStartTime,
                        endTime: newEndTime,
                        excludeBookingId: bookingId,
                    });
                    if (!isAvailable) {
                        throw new Error('Room is not available for the new time slot');
                    }
                    if (updates.startTime || updates.endTime) {
                        const newCost = await roomManagementService_1.roomManagementService.calculatePrice(tenantId, {
                            spaceId: existingBooking.spaceId,
                            startTime: newStartTime,
                            endTime: newEndTime,
                        });
                        updates = { ...updates, cost: newCost };
                    }
                }
                const updatedBooking = await tx.booking.update({
                    where: { id: bookingId },
                    data: updates,
                    include: {
                        space: true,
                        user: true,
                        approval: true,
                    },
                });
                await tx.auditLog.create({
                    data: {
                        tenantId,
                        userId,
                        action: 'BOOKING_UPDATED',
                        entityType: 'Booking',
                        entityId: bookingId,
                        details: updates,
                        timestamp: new Date(),
                    },
                });
                return updatedBooking;
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update booking', { tenantId, bookingId, updates }, error);
            throw error;
        }
    }
    async cancelBooking(tenantId, bookingId, userId, reason) {
        try {
            return await prisma_1.prisma.$transaction(async (tx) => {
                const booking = await tx.booking.findFirst({
                    where: {
                        id: bookingId,
                        tenantId,
                        userId,
                        status: { in: [client_1.BookingStatus.PENDING, client_1.BookingStatus.CONFIRMED] },
                    },
                });
                if (!booking) {
                    throw new Error('Booking not found or cannot be cancelled');
                }
                const updatedBooking = await tx.booking.update({
                    where: { id: bookingId },
                    data: { status: client_1.BookingStatus.CANCELLED },
                    include: {
                        space: true,
                        user: true,
                    },
                });
                await tx.bookingApproval.updateMany({
                    where: { bookingId },
                    data: {
                        status: client_1.ApprovalStatus.REJECTED,
                        reason: reason || 'Cancelled by user',
                        reviewedAt: new Date(),
                    },
                });
                await tx.auditLog.create({
                    data: {
                        tenantId,
                        userId,
                        action: 'BOOKING_CANCELLED',
                        entityType: 'Booking',
                        entityId: bookingId,
                        details: { reason },
                        timestamp: new Date(),
                    },
                });
                return updatedBooking;
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to cancel booking', { tenantId, bookingId, userId }, error);
            throw error;
        }
    }
    async getBookings(tenantId, filters = {}) {
        try {
            const whereClause = { tenantId };
            if (filters.spaceId)
                whereClause.spaceId = filters.spaceId;
            if (filters.userId)
                whereClause.userId = filters.userId;
            if (filters.status)
                whereClause.status = filters.status;
            if (filters.startDate || filters.endDate) {
                whereClause.startTime = {};
                if (filters.startDate)
                    whereClause.startTime.gte = filters.startDate;
                if (filters.endDate)
                    whereClause.startTime.lte = filters.endDate;
            }
            const bookings = await prisma_1.prisma.booking.findMany({
                where: whereClause,
                include: {
                    space: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    approval: true,
                    checkIns: {
                        orderBy: { checkedInAt: 'desc' },
                        take: 1,
                    },
                },
                orderBy: { startTime: 'desc' },
                skip: filters.offset || 0,
                take: filters.limit || 50,
            });
            const total = await prisma_1.prisma.booking.count({ where: whereClause });
            return {
                bookings,
                total,
                hasMore: (filters.offset || 0) + bookings.length < total,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get bookings', { tenantId, filters }, error);
            throw error;
        }
    }
    async getBookingById(tenantId, bookingId) {
        try {
            return await prisma_1.prisma.booking.findFirst({
                where: { id: bookingId, tenantId },
                include: {
                    space: {
                        include: {
                            features: {
                                include: {
                                    feature: true,
                                },
                            },
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        },
                    },
                    approval: {
                        include: {
                            approver: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    checkIns: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                        orderBy: { checkedInAt: 'desc' },
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get booking by ID', { tenantId, bookingId }, error);
            throw error;
        }
    }
    async processBookingApproval(tenantId, request) {
        try {
            return await prisma_1.prisma.$transaction(async (tx) => {
                const approver = await tx.user.findFirst({
                    where: {
                        id: request.approverId,
                        tenantId,
                        role: { in: [client_1.UserRole.COWORK_ADMIN, client_1.UserRole.CLIENT_ADMIN] },
                    },
                });
                if (!approver) {
                    throw new Error('User not authorized to approve bookings');
                }
                const booking = await tx.booking.findFirst({
                    where: { id: request.bookingId, tenantId },
                    include: { approval: true },
                });
                if (!booking || !booking.approval) {
                    throw new Error('Booking or approval record not found');
                }
                if (booking.approval.status !== client_1.ApprovalStatus.PENDING) {
                    throw new Error('Booking has already been reviewed');
                }
                const approvalStatus = request.status === 'approve'
                    ? client_1.ApprovalStatus.APPROVED
                    : client_1.ApprovalStatus.REJECTED;
                await tx.bookingApproval.update({
                    where: { id: booking.approval.id },
                    data: {
                        approverId: request.approverId,
                        status: approvalStatus,
                        reviewedAt: new Date(),
                        reason: request.reason,
                        notes: request.notes,
                    },
                });
                const newBookingStatus = request.status === 'approve'
                    ? client_1.BookingStatus.CONFIRMED
                    : client_1.BookingStatus.CANCELLED;
                const updatedBooking = await tx.booking.update({
                    where: { id: request.bookingId },
                    data: { status: newBookingStatus },
                    include: {
                        space: true,
                        user: true,
                        approval: true,
                    },
                });
                await tx.auditLog.create({
                    data: {
                        tenantId,
                        userId: request.approverId,
                        action: `BOOKING_${request.status.toUpperCase()}D`,
                        entityType: 'Booking',
                        entityId: request.bookingId,
                        details: {
                            reason: request.reason,
                            notes: request.notes,
                        },
                        timestamp: new Date(),
                    },
                });
                return updatedBooking;
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to process booking approval', { tenantId, request }, error);
            throw error;
        }
    }
    async getPendingApprovals(tenantId, approverId) {
        try {
            const whereClause = {
                tenantId,
                status: client_1.ApprovalStatus.PENDING,
            };
            if (approverId) {
                const user = await prisma_1.prisma.user.findFirst({
                    where: { id: approverId, tenantId },
                });
                if (!user || ![client_1.UserRole.COWORK_ADMIN, client_1.UserRole.CLIENT_ADMIN].includes(user.role)) {
                    return [];
                }
            }
            return await prisma_1.prisma.bookingApproval.findMany({
                where: whereClause,
                include: {
                    booking: {
                        include: {
                            space: true,
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { requestedAt: 'asc' },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get pending approvals', { tenantId, approverId }, error);
            throw error;
        }
    }
    async checkIn(tenantId, request) {
        try {
            return await prisma_1.prisma.$transaction(async (tx) => {
                const booking = await tx.booking.findFirst({
                    where: {
                        id: request.bookingId,
                        tenantId,
                        status: client_1.BookingStatus.CONFIRMED,
                    },
                    include: {
                        space: true,
                        checkIns: {
                            where: { checkedOutAt: null },
                        },
                    },
                });
                if (!booking) {
                    throw new Error('Booking not found or not confirmed');
                }
                if (booking.checkIns.length > 0) {
                    throw new Error('Already checked in to this booking');
                }
                const now = new Date();
                const allowedCheckInTime = new Date(booking.startTime.getTime() - 15 * 60000);
                if (now < allowedCheckInTime) {
                    throw new Error('Check-in not allowed yet');
                }
                if (now > booking.endTime) {
                    throw new Error('Booking has expired');
                }
                const checkIn = await tx.roomCheckIn.create({
                    data: {
                        tenantId,
                        bookingId: request.bookingId,
                        userId: request.userId,
                        spaceId: booking.spaceId,
                        qrCodeUsed: request.qrCodeUsed,
                        notes: request.notes,
                    },
                    include: {
                        booking: true,
                        space: true,
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                });
                await tx.booking.update({
                    where: { id: request.bookingId },
                    data: { status: client_1.BookingStatus.CHECKED_IN },
                });
                await tx.auditLog.create({
                    data: {
                        tenantId,
                        userId: request.userId,
                        action: 'ROOM_CHECKED_IN',
                        entityType: 'RoomCheckIn',
                        entityId: checkIn.id,
                        details: {
                            bookingId: request.bookingId,
                            spaceId: booking.spaceId,
                            qrCodeUsed: request.qrCodeUsed,
                        },
                        timestamp: new Date(),
                    },
                });
                return checkIn;
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to check in', { tenantId, request }, error);
            throw error;
        }
    }
    async checkOut(tenantId, request) {
        try {
            return await prisma_1.prisma.$transaction(async (tx) => {
                const checkIn = await tx.roomCheckIn.findFirst({
                    where: {
                        id: request.checkInId,
                        tenantId,
                        checkedOutAt: null,
                    },
                    include: {
                        booking: true,
                        space: true,
                    },
                });
                if (!checkIn) {
                    throw new Error('Check-in record not found or already checked out');
                }
                const checkOutTime = new Date();
                const actualEndTime = request.actualEndTime || checkOutTime;
                const updatedCheckIn = await tx.roomCheckIn.update({
                    where: { id: request.checkInId },
                    data: {
                        checkedOutAt: checkOutTime,
                        actualEndTime,
                        notes: request.notes ?
                            (checkIn.notes ? `${checkIn.notes}\n${request.notes}` : request.notes) :
                            checkIn.notes,
                    },
                    include: {
                        booking: true,
                        space: true,
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                });
                await tx.booking.update({
                    where: { id: checkIn.bookingId },
                    data: { status: client_1.BookingStatus.CHECKED_OUT },
                });
                await tx.auditLog.create({
                    data: {
                        tenantId,
                        userId: checkIn.userId,
                        action: 'ROOM_CHECKED_OUT',
                        entityType: 'RoomCheckIn',
                        entityId: checkIn.id,
                        details: {
                            bookingId: checkIn.bookingId,
                            spaceId: checkIn.spaceId,
                            actualEndTime,
                            duration: (checkOutTime.getTime() - checkIn.checkedInAt.getTime()) / 60000,
                        },
                        timestamp: new Date(),
                    },
                });
                return updatedCheckIn;
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to check out', { tenantId, request }, error);
            throw error;
        }
    }
    shouldRequireApproval(user, space, booking) {
        if (booking.cost && Number(booking.cost) > 500) {
            return true;
        }
        const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60);
        if (duration > 4) {
            return true;
        }
        if (space.type === 'CONFERENCE_ROOM') {
            return true;
        }
        if (user.role === client_1.UserRole.END_USER && space.type === 'MEETING_ROOM') {
            return true;
        }
        return false;
    }
    async getBookingStatistics(tenantId, spaceId, startDate, endDate) {
        try {
            const whereClause = { tenantId };
            if (spaceId)
                whereClause.spaceId = spaceId;
            if (startDate || endDate) {
                whereClause.startTime = {};
                if (startDate)
                    whereClause.startTime.gte = startDate;
                if (endDate)
                    whereClause.startTime.lte = endDate;
            }
            const [totalBookings, confirmedBookings, cancelledBookings, pendingApprovals, noShows, revenue] = await Promise.all([
                prisma_1.prisma.booking.count({ where: whereClause }),
                prisma_1.prisma.booking.count({ where: { ...whereClause, status: client_1.BookingStatus.CONFIRMED } }),
                prisma_1.prisma.booking.count({ where: { ...whereClause, status: client_1.BookingStatus.CANCELLED } }),
                prisma_1.prisma.booking.count({ where: { ...whereClause, status: client_1.BookingStatus.PENDING } }),
                prisma_1.prisma.booking.count({ where: { ...whereClause, status: client_1.BookingStatus.NO_SHOW } }),
                prisma_1.prisma.booking.aggregate({
                    where: {
                        ...whereClause,
                        status: { in: [client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.CHECKED_IN, client_1.BookingStatus.CHECKED_OUT] }
                    },
                    _sum: { cost: true }
                })
            ]);
            return {
                totalBookings,
                confirmedBookings,
                cancelledBookings,
                pendingApprovals,
                noShows,
                revenue: Number(revenue._sum.cost) || 0,
                confirmationRate: totalBookings > 0 ? confirmedBookings / totalBookings : 0,
                cancellationRate: totalBookings > 0 ? cancelledBookings / totalBookings : 0,
                noShowRate: confirmedBookings > 0 ? noShows / confirmedBookings : 0,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get booking statistics', { tenantId, spaceId }, error);
            throw error;
        }
    }
}
exports.BookingManagementService = BookingManagementService;
exports.bookingManagementService = new BookingManagementService();
//# sourceMappingURL=bookingManagementService.js.map