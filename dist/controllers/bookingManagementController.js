"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodaysBookings = exports.getUpcomingBookings = exports.getBookingStatistics = exports.qrCheckIn = exports.quickCheckIn = exports.checkOutFromRoom = exports.checkInToRoom = exports.getPendingApprovals = exports.processBookingApproval = exports.getMyBookings = exports.getBookingById = exports.getBookings = exports.cancelBooking = exports.updateBooking = exports.createBooking = void 0;
const zod_1 = require("zod");
const bookingManagementService_1 = require("../services/bookingManagementService");
const client_1 = require("@prisma/client");
const createBookingSchema = zod_1.z.object({
    spaceId: zod_1.z.string().min(1, 'Space ID is required'),
    userId: zod_1.z.string().min(1, 'User ID is required'),
    title: zod_1.z.string().min(1, 'Booking title is required'),
    description: zod_1.z.string().optional(),
    startTime: zod_1.z.string().transform((val) => new Date(val)),
    endTime: zod_1.z.string().transform((val) => new Date(val)),
    requiresApproval: zod_1.z.boolean().optional(),
}).refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
});
const updateBookingSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    startTime: zod_1.z.string().transform((val) => new Date(val)).optional(),
    endTime: zod_1.z.string().transform((val) => new Date(val)).optional(),
}).refine((data) => {
    if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
    }
    return true;
}, {
    message: 'End time must be after start time',
    path: ['endTime'],
});
const bookingFiltersSchema = zod_1.z.object({
    spaceId: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.BookingStatus).optional(),
    startDate: zod_1.z.string().transform((val) => new Date(val)).optional(),
    endDate: zod_1.z.string().transform((val) => new Date(val)).optional(),
    limit: zod_1.z.string().transform((val) => parseInt(val)).optional(),
    offset: zod_1.z.string().transform((val) => parseInt(val)).optional(),
});
const approvalSchema = zod_1.z.object({
    status: zod_1.z.enum(['approve', 'reject']),
    reason: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
const checkInSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'User ID is required'),
    qrCodeUsed: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
const checkOutSchema = zod_1.z.object({
    actualEndTime: zod_1.z.string().transform((val) => new Date(val)).optional(),
    notes: zod_1.z.string().optional(),
});
const cancelBookingSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
const createBooking = async (req, res) => {
    try {
        const bookingData = createBookingSchema.parse(req.body);
        const booking = await bookingManagementService_1.bookingManagementService.createBooking(req.tenant.id, bookingData);
        res.status(201).json({
            success: true,
            data: booking,
            message: 'Booking created successfully',
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
            error: error instanceof Error ? error.message : 'Failed to create booking',
        });
    }
};
exports.createBooking = createBooking;
const updateBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const updates = updateBookingSchema.parse(req.body);
        const booking = await bookingManagementService_1.bookingManagementService.updateBooking(req.tenant.id, bookingId, req.user.id, updates);
        res.json({
            success: true,
            data: booking,
            message: 'Booking updated successfully',
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
            error: error instanceof Error ? error.message : 'Failed to update booking',
        });
    }
};
exports.updateBooking = updateBooking;
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { reason } = cancelBookingSchema.parse(req.body);
        const booking = await bookingManagementService_1.bookingManagementService.cancelBooking(req.tenant.id, bookingId, req.user.id, reason);
        res.json({
            success: true,
            data: booking,
            message: 'Booking cancelled successfully',
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
            error: error instanceof Error ? error.message : 'Failed to cancel booking',
        });
    }
};
exports.cancelBooking = cancelBooking;
const getBookings = async (req, res) => {
    try {
        const filters = bookingFiltersSchema.parse(req.query);
        const result = await bookingManagementService_1.bookingManagementService.getBookings(req.tenant.id, filters);
        res.json({
            success: true,
            data: result.bookings,
            pagination: {
                total: result.total,
                limit: filters.limit || 50,
                offset: filters.offset || 0,
                hasMore: result.hasMore,
            },
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
            error: error instanceof Error ? error.message : 'Failed to get bookings',
        });
    }
};
exports.getBookings = getBookings;
const getBookingById = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await bookingManagementService_1.bookingManagementService.getBookingById(req.tenant.id, bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found',
            });
        }
        res.json({
            success: true,
            data: booking,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get booking',
        });
    }
};
exports.getBookingById = getBookingById;
const getMyBookings = async (req, res) => {
    try {
        const filters = bookingFiltersSchema.parse(req.query);
        filters.userId = req.user.id;
        const result = await bookingManagementService_1.bookingManagementService.getBookings(req.tenant.id, filters);
        res.json({
            success: true,
            data: result.bookings,
            pagination: {
                total: result.total,
                limit: filters.limit || 50,
                offset: filters.offset || 0,
                hasMore: result.hasMore,
            },
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
            error: error instanceof Error ? error.message : 'Failed to get bookings',
        });
    }
};
exports.getMyBookings = getMyBookings;
const processBookingApproval = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const approvalData = approvalSchema.parse(req.body);
        const booking = await bookingManagementService_1.bookingManagementService.processBookingApproval(req.tenant.id, {
            bookingId,
            approverId: req.user.id,
            ...approvalData,
        });
        res.json({
            success: true,
            data: booking,
            message: `Booking ${approvalData.status === 'approve' ? 'approved' : 'rejected'} successfully`,
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
            error: error instanceof Error ? error.message : 'Failed to process approval',
        });
    }
};
exports.processBookingApproval = processBookingApproval;
const getPendingApprovals = async (req, res) => {
    try {
        const approvals = await bookingManagementService_1.bookingManagementService.getPendingApprovals(req.tenant.id, req.user.id);
        res.json({
            success: true,
            data: approvals,
            total: approvals.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get pending approvals',
        });
    }
};
exports.getPendingApprovals = getPendingApprovals;
const checkInToRoom = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const checkInData = checkInSchema.parse(req.body);
        const checkIn = await bookingManagementService_1.bookingManagementService.checkIn(req.tenant.id, {
            bookingId,
            ...checkInData,
        });
        res.json({
            success: true,
            data: checkIn,
            message: 'Checked in successfully',
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
            error: error instanceof Error ? error.message : 'Failed to check in',
        });
    }
};
exports.checkInToRoom = checkInToRoom;
const checkOutFromRoom = async (req, res) => {
    try {
        const { checkInId } = req.params;
        const checkOutData = checkOutSchema.parse(req.body);
        const checkOut = await bookingManagementService_1.bookingManagementService.checkOut(req.tenant.id, {
            checkInId,
            ...checkOutData,
        });
        res.json({
            success: true,
            data: checkOut,
            message: 'Checked out successfully',
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
            error: error instanceof Error ? error.message : 'Failed to check out',
        });
    }
};
exports.checkOutFromRoom = checkOutFromRoom;
const quickCheckIn = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const checkIn = await bookingManagementService_1.bookingManagementService.checkIn(req.tenant.id, {
            bookingId,
            userId: req.user.id,
        });
        res.json({
            success: true,
            data: checkIn,
            message: 'Quick check-in successful',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to check in',
        });
    }
};
exports.quickCheckIn = quickCheckIn;
const qrCheckIn = async (req, res) => {
    try {
        const { qrCode } = req.params;
        if (!qrCode.startsWith('booking:')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid QR code format',
            });
        }
        const bookingId = qrCode.replace('booking:', '');
        const checkIn = await bookingManagementService_1.bookingManagementService.checkIn(req.tenant.id, {
            bookingId,
            userId: req.user.id,
            qrCodeUsed: qrCode,
        });
        res.json({
            success: true,
            data: checkIn,
            message: 'QR check-in successful',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to check in with QR code',
        });
    }
};
exports.qrCheckIn = qrCheckIn;
const getBookingStatistics = async (req, res) => {
    try {
        const { spaceId, startDate, endDate } = req.query;
        const statistics = await bookingManagementService_1.bookingManagementService.getBookingStatistics(req.tenant.id, spaceId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        res.json({
            success: true,
            data: statistics,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get booking statistics',
        });
    }
};
exports.getBookingStatistics = getBookingStatistics;
const getUpcomingBookings = async (req, res) => {
    try {
        const { userId } = req.query;
        const now = new Date();
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        const filters = {
            userId: userId || req.user.id,
            status: client_1.BookingStatus.CONFIRMED,
            startDate: now,
            endDate: endOfToday,
            limit: 10,
        };
        const result = await bookingManagementService_1.bookingManagementService.getBookings(req.tenant.id, filters);
        res.json({
            success: true,
            data: result.bookings,
            total: result.total,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get upcoming bookings',
        });
    }
};
exports.getUpcomingBookings = getUpcomingBookings;
const getTodaysBookings = async (req, res) => {
    try {
        const { spaceId } = req.query;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        const filters = {
            spaceId: spaceId,
            startDate: today,
            endDate: endOfToday,
            limit: 100,
        };
        const result = await bookingManagementService_1.bookingManagementService.getBookings(req.tenant.id, filters);
        res.json({
            success: true,
            data: result.bookings,
            total: result.total,
            date: today.toISOString().split('T')[0],
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get today\'s bookings',
        });
    }
};
exports.getTodaysBookings = getTodaysBookings;
//# sourceMappingURL=bookingManagementController.js.map