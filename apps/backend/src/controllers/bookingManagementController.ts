import { Response } from 'express';
import { z } from 'zod';
import { bookingManagementService } from '../services/bookingManagementService';
import { BaseRequest, AuthenticatedRequest, ErrorCode } from '../types/api';
import { BookingStatus } from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createBookingSchema = z.object({
  spaceId: z.string().min(1, 'Space ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Booking title is required'),
  description: z.string().optional(),
  startTime: z.string().transform((val) => new Date(val)),
  endTime: z.string().transform((val) => new Date(val)),
  requiresApproval: z.boolean().optional(),
}).refine((data) => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

const updateBookingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startTime: z.string().transform((val) => new Date(val)).optional(),
  endTime: z.string().transform((val) => new Date(val)).optional(),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

const bookingFiltersSchema = z.object({
  spaceId: z.string().optional(),
  userId: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  startDate: z.string().transform((val) => new Date(val)).optional(),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  limit: z.string().transform((val) => parseInt(val)).optional(),
  offset: z.string().transform((val) => parseInt(val)).optional(),
});

const approvalSchema = z.object({
  status: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

const checkInSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  qrCodeUsed: z.string().optional(),
  notes: z.string().optional(),
});

const checkOutSchema = z.object({
  actualEndTime: z.string().transform((val) => new Date(val)).optional(),
  notes: z.string().optional(),
});

const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

// ============================================================================
// BOOKING CRUD OPERATIONS
// ============================================================================

export const createBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookingData = createBookingSchema.parse(req.body);
    
    const booking = await bookingManagementService.createBooking(req.tenant!.id, bookingData);
    
    return res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: ErrorCode.VALIDATION_ERROR,
        details: error.errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create booking',
    });
  }
};

export const updateBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const updates = updateBookingSchema.parse(req.body);
    
    const booking = await bookingManagementService.updateBooking(
      req.tenant!.id,
      bookingId,
      req.user!.id,
      updates
    );
    
    return res.json({
      success: true,
      data: booking,
      message: 'Booking updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: ErrorCode.VALIDATION_ERROR,
        details: error.errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update booking',
    });
  }
};

export const cancelBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { reason } = cancelBookingSchema.parse(req.body);
    
    const booking = await bookingManagementService.cancelBooking(
      req.tenant!.id,
      bookingId,
      req.user!.id,
      reason
    );
    
    return res.json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: ErrorCode.VALIDATION_ERROR,
        details: error.errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel booking',
    });
  }
};

export const getBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = bookingFiltersSchema.parse(req.query);
    
    const result = await bookingManagementService.getBookings(req.tenant!.id, filters);
    
    return res.json({
      success: true,
      data: result.bookings,
      pagination: {
        total: result.total,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: ErrorCode.INVALID_INPUT,
        details: error.errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get bookings',
    });
  }
};

export const getBookingById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await bookingManagementService.getBookingById(req.tenant!.id, bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: ErrorCode.RESOURCE_NOT_FOUND,
      });
    }
    
    return res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get booking',
    });
  }
};

export const getMyBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = bookingFiltersSchema.parse(req.query);
    filters.userId = req.user!.id;
    
    const result = await bookingManagementService.getBookings(req.tenant!.id, filters);
    
    return res.json({
      success: true,
      data: result.bookings,
      pagination: {
        total: result.total,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: ErrorCode.INVALID_INPUT,
        details: error.errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get bookings',
    });
  }
};

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

export const processBookingApproval = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const approvalData = approvalSchema.parse(req.body);
    
    const booking = await bookingManagementService.processBookingApproval(req.tenant!.id, {
      bookingId,
      approverId: req.user!.id,
      ...approvalData,
    });
    
    return res.json({
      success: true,
      data: booking,
      message: `Booking ${approvalData.status === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: ErrorCode.VALIDATION_ERROR,
        details: error.errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process approval',
    });
  }
};

export const getPendingApprovals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const approvals = await bookingManagementService.getPendingApprovals(
      req.tenant!.id,
      req.user!.id
    );
    
    return res.json({
      success: true,
      data: approvals,
      total: approvals.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pending approvals',
    });
  }
};

// ============================================================================
// CHECK-IN/CHECK-OUT
// ============================================================================

export const checkInToRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const checkInData = checkInSchema.parse(req.body);
    
    const checkIn = await bookingManagementService.checkIn(req.tenant!.id, {
      bookingId,
      ...checkInData,
    });
    
    return res.json({
      success: true,
      data: checkIn,
      message: 'Checked in successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: ErrorCode.VALIDATION_ERROR,
        details: error.errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check in',
    });
  }
};

export const checkOutFromRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { checkInId } = req.params;
    const checkOutData = checkOutSchema.parse(req.body);
    
    const checkOut = await bookingManagementService.checkOut(req.tenant!.id, {
      checkInId,
      ...checkOutData,
    });
    
    return res.json({
      success: true,
      data: checkOut,
      message: 'Checked out successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: ErrorCode.VALIDATION_ERROR,
        details: error.errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check out',
    });
  }
};

// ============================================================================
// QUICK ACTIONS
// ============================================================================

export const quickCheckIn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    
    const checkIn = await bookingManagementService.checkIn(req.tenant!.id, {
      bookingId,
      userId: req.user!.id,
    });
    
    return res.json({
      success: true,
      data: checkIn,
      message: 'Quick check-in successful',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check in',
    });
  }
};

export const qrCheckIn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { qrCode } = req.params;
    
    // Decode QR code to get booking ID
    // QR code format: "booking:{bookingId}"
    if (!qrCode.startsWith('booking:')) {
      return res.status(400).json({
        success: false,
        error: ErrorCode.INVALID_INPUT,
      });
    }
    
    const bookingId = qrCode.replace('booking:', '');
    
    const checkIn = await bookingManagementService.checkIn(req.tenant!.id, {
      bookingId,
      userId: req.user!.id,
      qrCodeUsed: qrCode,
    });
    
    return res.json({
      success: true,
      data: checkIn,
      message: 'QR check-in successful',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check in with QR code',
    });
  }
};

// ============================================================================
// STATISTICS AND REPORTING
// ============================================================================

export const getBookingStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { spaceId, startDate, endDate } = req.query;
    
    const statistics = await bookingManagementService.getBookingStatistics(
      req.tenant!.id,
      spaceId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    return res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get booking statistics',
    });
  }
};

export const getUpcomingBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.query;
    const now = new Date();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const filters = {
      userId: (userId as string) || req.user!.id,
      status: BookingStatus.CONFIRMED,
      startDate: now,
      endDate: endOfToday,
      limit: 10,
    };
    
    const result = await bookingManagementService.getBookings(req.tenant!.id, filters);
    
    return res.json({
      success: true,
      data: result.bookings,
      total: result.total,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get upcoming bookings',
    });
  }
};

export const getTodaysBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { spaceId } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const filters = {
      spaceId: spaceId as string,
      startDate: today,
      endDate: endOfToday,
      limit: 100,
    };
    
    const result = await bookingManagementService.getBookings(req.tenant!.id, filters);
    
    return res.json({
      success: true,
      data: result.bookings,
      total: result.total,
      date: today.toISOString().split('T')[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get today\'s bookings',
    });
  }
};