"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingCalendar = exports.getTodaysBookings = exports.getBookingStatistics = exports.getMyUpcomingBookings = exports.getMyBookings = exports.cancelBooking = exports.updateBooking = exports.getBookingById = exports.getBookings = exports.createBooking = void 0;
const bookingService_1 = require("../services/bookingService");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createBookingSchema = zod_1.z.object({
    spaceId: zod_1.z.string().min(1, 'Space ID is required'),
    title: zod_1.z.string().min(1, 'Booking title is required'),
    description: zod_1.z.string().optional(),
    startTime: zod_1.z.string().datetime('Invalid start time format'),
    endTime: zod_1.z.string().datetime('Invalid end time format'),
    attendees: zod_1.z.array(zod_1.z.string()).optional(),
    equipment: zod_1.z.array(zod_1.z.string()).optional(),
    catering: zod_1.z.boolean().optional(),
    notes: zod_1.z.string().optional()
});
const updateBookingSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    startTime: zod_1.z.string().datetime().optional(),
    endTime: zod_1.z.string().datetime().optional(),
    status: zod_1.z.nativeEnum(client_1.BookingStatus).optional(),
    attendees: zod_1.z.array(zod_1.z.string()).optional(),
    equipment: zod_1.z.array(zod_1.z.string()).optional(),
    catering: zod_1.z.boolean().optional(),
    notes: zod_1.z.string().optional()
});
const bookingFiltersSchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    spaceId: zod_1.z.string().optional(),
    status: zod_1.z.array(zod_1.z.nativeEnum(client_1.BookingStatus)).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    upcoming: zod_1.z.boolean().optional(),
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20)
});
const cancelBookingSchema = zod_1.z.object({
    reason: zod_1.z.string().optional()
});
const createBooking = async (req, res) => {
    try {
        const validatedData = createBookingSchema.parse(req.body);
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        const startTime = new Date(validatedData.startTime);
        const endTime = new Date(validatedData.endTime);
        if (startTime >= endTime) {
            return response_1.ResponseHelper.badRequest(res, 'Start time must be before end time');
        }
        if (startTime < new Date()) {
            return response_1.ResponseHelper.badRequest(res, 'Cannot book in the past');
        }
        const booking = await bookingService_1.bookingService.createBooking(tenantId, userId, {
            ...validatedData,
            startTime,
            endTime
        });
        logger_1.logger.info('Booking created via API', {
            bookingId: booking.id,
            tenantId,
            userId,
            spaceId: validatedData.spaceId
        });
        return response_1.ResponseHelper.created(res, booking, 'Booking created successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid booking data', error.errors);
        }
        logger_1.logger.error('Failed to create booking via API', {
            tenantId: req.user?.tenantId,
            userId: req.user?.id,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to create booking');
    }
};
exports.createBooking = createBooking;
const getBookings = async (req, res) => {
    try {
        const filters = bookingFiltersSchema.parse(req.query);
        const tenantId = req.user.tenantId;
        if (req.query.status && typeof req.query.status === 'string') {
            filters.status = [req.query.status];
        }
        const result = await bookingService_1.bookingService.getBookings(tenantId, {
            userId: filters.userId,
            spaceId: filters.spaceId,
            status: filters.status,
            startDate: filters.startDate ? new Date(filters.startDate) : undefined,
            endDate: filters.endDate ? new Date(filters.endDate) : undefined,
            upcoming: filters.upcoming
        }, filters.page, filters.limit);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid filter parameters', error.errors);
        }
        logger_1.logger.error('Failed to get bookings via API', {
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to retrieve bookings');
    }
};
exports.getBookings = getBookings;
const getBookingById = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const tenantId = req.user.tenantId;
        const booking = await bookingService_1.bookingService.getBookingById(tenantId, bookingId);
        if (!booking) {
            return response_1.ResponseHelper.notFound(res, 'Booking not found');
        }
        if (booking.userId !== req.user.id && req.user.role === 'END_USER') {
            return response_1.ResponseHelper.forbidden(res, 'You can only view your own bookings');
        }
        return response_1.ResponseHelper.success(res, booking);
    }
    catch (error) {
        logger_1.logger.error('Failed to get booking by ID via API', {
            bookingId: req.params.bookingId,
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to retrieve booking');
    }
};
exports.getBookingById = getBookingById;
const updateBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const validatedData = updateBookingSchema.parse(req.body);
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        if (validatedData.startTime && validatedData.endTime) {
            const startTime = new Date(validatedData.startTime);
            const endTime = new Date(validatedData.endTime);
            if (startTime >= endTime) {
                return response_1.ResponseHelper.badRequest(res, 'Start time must be before end time');
            }
        }
        const booking = await bookingService_1.bookingService.updateBooking(tenantId, bookingId, userId, {
            ...validatedData,
            ...(validatedData.startTime && { startTime: new Date(validatedData.startTime) }),
            ...(validatedData.endTime && { endTime: new Date(validatedData.endTime) })
        });
        logger_1.logger.info('Booking updated via API', {
            bookingId,
            tenantId,
            userId,
            updatedFields: Object.keys(validatedData)
        });
        return response_1.ResponseHelper.success(res, booking, 'Booking updated successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid update data', error.errors);
        }
        logger_1.logger.error('Failed to update booking via API', {
            bookingId: req.params.bookingId,
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to update booking');
    }
};
exports.updateBooking = updateBooking;
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { reason } = cancelBookingSchema.parse(req.body);
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        await bookingService_1.bookingService.cancelBooking(tenantId, bookingId, userId, reason);
        logger_1.logger.info('Booking cancelled via API', {
            bookingId,
            tenantId,
            userId,
            reason
        });
        return response_1.ResponseHelper.success(res, null, 'Booking cancelled successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid cancellation data', error.errors);
        }
        logger_1.logger.error('Failed to cancel booking via API', {
            bookingId: req.params.bookingId,
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to cancel booking');
    }
};
exports.cancelBooking = cancelBooking;
const getMyBookings = async (req, res) => {
    try {
        const filters = bookingFiltersSchema.parse(req.query);
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        const result = await bookingService_1.bookingService.getBookings(tenantId, {
            userId,
            spaceId: filters.spaceId,
            status: filters.status,
            startDate: filters.startDate ? new Date(filters.startDate) : undefined,
            endDate: filters.endDate ? new Date(filters.endDate) : undefined,
            upcoming: filters.upcoming
        }, filters.page, filters.limit);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid filter parameters', error.errors);
        }
        logger_1.logger.error('Failed to get user bookings via API', {
            tenantId: req.user?.tenantId,
            userId: req.user?.id,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to retrieve your bookings');
    }
};
exports.getMyBookings = getMyBookings;
const getMyUpcomingBookings = async (req, res) => {
    try {
        const { limit } = req.query;
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        const bookings = await bookingService_1.bookingService.getUpcomingBookings(tenantId, userId, limit ? parseInt(limit) : 10);
        return response_1.ResponseHelper.success(res, {
            bookings,
            count: bookings.length
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get upcoming bookings via API', {
            tenantId: req.user?.tenantId,
            userId: req.user?.id,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to retrieve upcoming bookings');
    }
};
exports.getMyUpcomingBookings = getMyUpcomingBookings;
const getBookingStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const tenantId = req.user.tenantId;
        const statistics = await bookingService_1.bookingService.getBookingStatistics(tenantId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return response_1.ResponseHelper.success(res, {
            period: {
                startDate: startDate || 'All time',
                endDate: endDate || 'Now'
            },
            statistics
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get booking statistics via API', {
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to get booking statistics');
    }
};
exports.getBookingStatistics = getBookingStatistics;
const getTodaysBookings = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        const result = await bookingService_1.bookingService.getBookings(tenantId, {
            startDate: startOfDay,
            endDate: endOfDay
        }, 1, 100);
        const byStatus = result.bookings.reduce((acc, booking) => {
            acc[booking.status] = (acc[booking.status] || 0) + 1;
            return acc;
        }, {});
        const bySpace = result.bookings.reduce((acc, booking) => {
            const spaceName = booking.space?.name || 'Unknown Space';
            acc[spaceName] = (acc[spaceName] || 0) + 1;
            return acc;
        }, {});
        return response_1.ResponseHelper.success(res, {
            date: today.toISOString().split('T')[0],
            totalBookings: result.bookings.length,
            byStatus,
            bySpace,
            bookings: result.bookings
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get today\'s bookings via API', {
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to get today\'s bookings');
    }
};
exports.getTodaysBookings = getTodaysBookings;
const getBookingCalendar = async (req, res) => {
    try {
        const { month, year, spaceId } = req.query;
        const tenantId = req.user.tenantId;
        const targetMonth = month ? parseInt(month) : new Date().getMonth();
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const startOfMonth = new Date(targetYear, targetMonth, 1);
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
        const result = await bookingService_1.bookingService.getBookings(tenantId, {
            spaceId: spaceId,
            startDate: startOfMonth,
            endDate: endOfMonth,
            status: ['PENDING', 'CONFIRMED']
        }, 1, 1000);
        const calendarEvents = result.bookings.map(booking => ({
            id: booking.id,
            title: booking.title,
            start: booking.startTime.toISOString(),
            end: booking.endTime.toISOString(),
            status: booking.status,
            spaceId: booking.spaceId,
            spaceName: booking.space?.name,
            userId: booking.userId,
            userName: booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : 'Unknown User'
        }));
        return response_1.ResponseHelper.success(res, {
            month: targetMonth,
            year: targetYear,
            events: calendarEvents,
            totalEvents: calendarEvents.length
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get booking calendar via API', {
            tenantId: req.user?.tenantId,
            error: error.message
        });
        return response_1.ResponseHelper.internalError(res, 'Failed to get calendar data');
    }
};
exports.getBookingCalendar = getBookingCalendar;
//# sourceMappingURL=bookingController.js.map