import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { bookingService } from '../services/bookingService';
import { ResponseHelper } from '../utils/response';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createBookingSchema = z.object({
  spaceId: z.string().min(1, 'Space ID is required'),
  title: z.string().min(1, 'Booking title is required'),
  description: z.string().optional(),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
  attendees: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  catering: z.boolean().optional(),
  notes: z.string().optional()
});

const updateBookingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  attendees: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  catering: z.boolean().optional(),
  notes: z.string().optional()
});

const bookingFiltersSchema = z.object({
  userId: z.string().optional(),
  spaceId: z.string().optional(),
  status: z.array(z.nativeEnum(BookingStatus)).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  upcoming: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

const cancelBookingSchema = z.object({
  reason: z.string().optional()
});

// ============================================================================
// BOOKING MANAGEMENT CONTROLLERS
// ============================================================================

/**
 * Create a new booking
 */
export const createBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createBookingSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    // Validate time range
    const startTime = new Date(validatedData.startTime);
    const endTime = new Date(validatedData.endTime);

    if (startTime >= endTime) {
      return ResponseHelper.badRequest(res, 'Start time must be before end time');
    }

    if (startTime < new Date()) {
      return ResponseHelper.badRequest(res, 'Cannot book in the past');
    }

    const booking = await bookingService.createBooking(tenantId, userId, {
      ...validatedData,
      startTime,
      endTime
    });

    logger.info('Booking created via API', {
      bookingId: booking.id,
      tenantId,
      userId,
      spaceId: validatedData.spaceId
    });

    return ResponseHelper.created(res, booking, 'Booking created successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid booking data', error.errors);
    }

    logger.error('Failed to create booking via API', {
      tenantId: req.user?.tenantId,
      userId: req.user?.id,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to create booking');
  }
};

/**
 * Get bookings with filtering and pagination
 */
export const getBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = bookingFiltersSchema.parse(req.query);
    const tenantId = req.user!.tenantId;

    // Convert status string to array if needed
    if (req.query.status && typeof req.query.status === 'string') {
      filters.status = [req.query.status as BookingStatus];
    }

    const result = await bookingService.getBookings(
      tenantId,
      {
        userId: filters.userId,
        spaceId: filters.spaceId,
        status: filters.status,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        upcoming: filters.upcoming
      },
      filters.page,
      filters.limit
    );

    return ResponseHelper.success(res, result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid filter parameters', error.errors);
    }

    logger.error('Failed to get bookings via API', {
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to retrieve bookings');
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const tenantId = req.user!.tenantId;

    const booking = await bookingService.getBookingById(tenantId, bookingId);

    if (!booking) {
      return ResponseHelper.notFound(res, 'Booking not found');
    }

    // Check if user can view this booking (own booking or admin)
    if (booking.userId !== req.user!.id && req.user!.role === 'END_USER') {
      return ResponseHelper.forbidden(res, 'You can only view your own bookings');
    }

    return ResponseHelper.success(res, booking);
  } catch (error) {
    logger.error('Failed to get booking by ID via API', {
      bookingId: req.params.bookingId,
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to retrieve booking');
  }
};

/**
 * Update booking
 */
export const updateBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const validatedData = updateBookingSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    // Validate time range if both times are provided
    if (validatedData.startTime && validatedData.endTime) {
      const startTime = new Date(validatedData.startTime);
      const endTime = new Date(validatedData.endTime);

      if (startTime >= endTime) {
        return ResponseHelper.badRequest(res, 'Start time must be before end time');
      }
    }

    const booking = await bookingService.updateBooking(tenantId, bookingId, userId, {
      ...validatedData,
      ...(validatedData.startTime && { startTime: new Date(validatedData.startTime) }),
      ...(validatedData.endTime && { endTime: new Date(validatedData.endTime) })
    });

    logger.info('Booking updated via API', {
      bookingId,
      tenantId,
      userId,
      updatedFields: Object.keys(validatedData)
    });

    return ResponseHelper.success(res, booking, 'Booking updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid update data', error.errors);
    }

    logger.error('Failed to update booking via API', {
      bookingId: req.params.bookingId,
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to update booking');
  }
};

/**
 * Cancel booking
 */
export const cancelBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { reason } = cancelBookingSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    await bookingService.cancelBooking(tenantId, bookingId, userId, reason);

    logger.info('Booking cancelled via API', {
      bookingId,
      tenantId,
      userId,
      reason
    });

    return ResponseHelper.success(res, null, 'Booking cancelled successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid cancellation data', error.errors);
    }

    logger.error('Failed to cancel booking via API', {
      bookingId: req.params.bookingId,
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to cancel booking');
  }
};

// ============================================================================
// USER-SPECIFIC BOOKING CONTROLLERS
// ============================================================================

/**
 * Get current user's bookings
 */
export const getMyBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = bookingFiltersSchema.parse(req.query);
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    const result = await bookingService.getBookings(
      tenantId,
      {
        userId, // Force filter to current user
        spaceId: filters.spaceId,
        status: filters.status,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        upcoming: filters.upcoming
      },
      filters.page,
      filters.limit
    );

    return ResponseHelper.success(res, result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid filter parameters', error.errors);
    }

    logger.error('Failed to get user bookings via API', {
      tenantId: req.user?.tenantId,
      userId: req.user?.id,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to retrieve your bookings');
  }
};

/**
 * Get upcoming bookings for current user
 */
export const getMyUpcomingBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit } = req.query;
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    const bookings = await bookingService.getUpcomingBookings(
      tenantId,
      userId,
      limit ? parseInt(limit as string) : 10
    );

    return ResponseHelper.success(res, {
      bookings,
      count: bookings.length
    });
  } catch (error) {
    logger.error('Failed to get upcoming bookings via API', {
      tenantId: req.user?.tenantId,
      userId: req.user?.id,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to retrieve upcoming bookings');
  }
};

// ============================================================================
// BOOKING ANALYTICS CONTROLLERS
// ============================================================================

/**
 * Get booking statistics
 */
export const getBookingStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.user!.tenantId;

    const statistics = await bookingService.getBookingStatistics(
      tenantId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    return ResponseHelper.success(res, {
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Now'
      },
      statistics
    });
  } catch (error) {
    logger.error('Failed to get booking statistics via API', {
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to get booking statistics');
  }
};

/**
 * Get today's bookings overview
 */
export const getTodaysBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const result = await bookingService.getBookings(
      tenantId,
      {
        startDate: startOfDay,
        endDate: endOfDay
      },
      1,
      100 // Get all bookings for today
    );

    // Group by status
    const byStatus = result.bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<BookingStatus, number>);

    // Group by space
    const bySpace = result.bookings.reduce((acc, booking) => {
      const spaceName = booking.space?.name || 'Unknown Space';
      acc[spaceName] = (acc[spaceName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return ResponseHelper.success(res, {
      date: today.toISOString().split('T')[0],
      totalBookings: result.bookings.length,
      byStatus,
      bySpace,
      bookings: result.bookings
    });
  } catch (error) {
    logger.error('Failed to get today\'s bookings via API', {
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to get today\'s bookings');
  }
};

/**
 * Get booking calendar data
 */
export const getBookingCalendar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { month, year, spaceId } = req.query;
    const tenantId = req.user!.tenantId;

    // Default to current month if not specified
    const targetMonth = month ? parseInt(month as string) : new Date().getMonth();
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    // Get start and end of month
    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const result = await bookingService.getBookings(
      tenantId,
      {
        spaceId: spaceId as string,
        startDate: startOfMonth,
        endDate: endOfMonth,
        status: ['PENDING', 'CONFIRMED']
      },
      1,
      1000 // Get all bookings for the month
    );

    // Format for calendar display
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

    return ResponseHelper.success(res, {
      month: targetMonth,
      year: targetYear,
      events: calendarEvents,
      totalEvents: calendarEvents.length
    });
  } catch (error) {
    logger.error('Failed to get booking calendar via API', {
      tenantId: req.user?.tenantId,
      error: (error as Error).message
    });

    return ResponseHelper.internalError(res, 'Failed to get calendar data');
  }
};