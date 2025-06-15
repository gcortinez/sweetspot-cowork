import { prisma } from '../lib/prisma';
import {
  BookingStatus,
  ApprovalStatus,
  UserRole
} from '@prisma/client';
import { logger } from '../utils/logger';
import { roomManagementService } from './roomManagementService';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface CreateBookingRequest {
  spaceId: string;
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  requiresApproval?: boolean;
}

export interface UpdateBookingRequest {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface BookingFilters {
  spaceId?: string;
  userId?: string;
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ApprovalRequest {
  bookingId: string;
  approverId: string;
  status: 'approve' | 'reject';
  reason?: string;
  notes?: string;
}

export interface CheckInRequest {
  bookingId: string;
  userId: string;
  qrCodeUsed?: string;
  notes?: string;
}

export interface CheckOutRequest {
  checkInId: string;
  actualEndTime?: Date;
  notes?: string;
}

// ============================================================================
// BOOKING MANAGEMENT SERVICE
// ============================================================================

export class BookingManagementService {

  // ============================================================================
  // BOOKING CRUD OPERATIONS
  // ============================================================================

  async createBooking(tenantId: string, request: CreateBookingRequest) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Validate user exists and belongs to tenant
        const user = await tx.user.findFirst({
          where: { id: request.userId, tenantId },
        });

        if (!user) {
          throw new Error('User not found or does not belong to tenant');
        }

        // Validate space exists and belongs to tenant
        const space = await tx.space.findFirst({
          where: { id: request.spaceId, tenantId, isActive: true },
        });

        if (!space) {
          throw new Error('Space not found or not active');
        }

        // Check availability
        const isAvailable = await roomManagementService.checkAvailability(tenantId, {
          spaceId: request.spaceId,
          startTime: request.startTime,
          endTime: request.endTime,
        });

        if (!isAvailable) {
          throw new Error('Room is not available for the requested time slot');
        }

        // Calculate pricing
        const cost = await roomManagementService.calculatePrice(tenantId, {
          spaceId: request.spaceId,
          startTime: request.startTime,
          endTime: request.endTime,
        });

        // Determine if approval is required
        const requiresApproval = request.requiresApproval || 
          this.shouldRequireApproval(user, space, request);

        // Create the booking
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
            status: requiresApproval ? BookingStatus.PENDING : BookingStatus.CONFIRMED,
          },
          include: {
            space: true,
            user: true,
          },
        });

        // Create approval record if required
        if (requiresApproval) {
          await tx.bookingApproval.create({
            data: {
              tenantId,
              bookingId: booking.id,
              status: ApprovalStatus.PENDING,
            },
          });
        }

        // Log the booking creation
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
    } catch (error) {
      logger.error('Failed to create booking', { tenantId, request }, error as Error);
      throw error;
    }
  }

  async updateBooking(tenantId: string, bookingId: string, userId: string, updates: UpdateBookingRequest) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get existing booking
        const existingBooking = await tx.booking.findFirst({
          where: {
            id: bookingId,
            tenantId,
            userId, // Ensure user owns the booking
            status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          },
        });

        if (!existingBooking) {
          throw new Error('Booking not found or cannot be modified');
        }

        // If time is being updated, check availability
        if (updates.startTime || updates.endTime) {
          const newStartTime = updates.startTime || existingBooking.startTime;
          const newEndTime = updates.endTime || existingBooking.endTime;

          const isAvailable = await roomManagementService.checkAvailability(tenantId, {
            spaceId: existingBooking.spaceId,
            startTime: newStartTime,
            endTime: newEndTime,
            excludeBookingId: bookingId,
          });

          if (!isAvailable) {
            throw new Error('Room is not available for the new time slot');
          }

          // Recalculate cost if time changed
          if (updates.startTime || updates.endTime) {
            const newCost = await roomManagementService.calculatePrice(tenantId, {
              spaceId: existingBooking.spaceId,
              startTime: newStartTime,
              endTime: newEndTime,
            });
            updates = { ...updates, cost: newCost } as any;
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

        // Log the update
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
    } catch (error) {
      logger.error('Failed to update booking', { tenantId, bookingId, updates }, error as Error);
      throw error;
    }
  }

  async cancelBooking(tenantId: string, bookingId: string, userId: string, reason?: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findFirst({
          where: {
            id: bookingId,
            tenantId,
            userId,
            status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          },
        });

        if (!booking) {
          throw new Error('Booking not found or cannot be cancelled');
        }

        const updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CANCELLED },
          include: {
            space: true,
            user: true,
          },
        });

        // Update approval status if exists
        await tx.bookingApproval.updateMany({
          where: { bookingId },
          data: { 
            status: ApprovalStatus.REJECTED,
            reason: reason || 'Cancelled by user',
            reviewedAt: new Date(),
          },
        });

        // Log the cancellation
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
    } catch (error) {
      logger.error('Failed to cancel booking', { tenantId, bookingId, userId }, error as Error);
      throw error;
    }
  }

  async getBookings(tenantId: string, filters: BookingFilters = {}) {
    try {
      const whereClause: any = { tenantId };

      if (filters.spaceId) whereClause.spaceId = filters.spaceId;
      if (filters.userId) whereClause.userId = filters.userId;
      if (filters.status) whereClause.status = filters.status;
      
      if (filters.startDate || filters.endDate) {
        whereClause.startTime = {};
        if (filters.startDate) whereClause.startTime.gte = filters.startDate;
        if (filters.endDate) whereClause.startTime.lte = filters.endDate;
      }

      const bookings = await prisma.booking.findMany({
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

      const total = await prisma.booking.count({ where: whereClause });

      return {
        bookings,
        total,
        hasMore: (filters.offset || 0) + bookings.length < total,
      };
    } catch (error) {
      logger.error('Failed to get bookings', { tenantId, filters }, error as Error);
      throw error;
    }
  }

  async getBookingById(tenantId: string, bookingId: string) {
    try {
      return await prisma.booking.findFirst({
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
    } catch (error) {
      logger.error('Failed to get booking by ID', { tenantId, bookingId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // APPROVAL WORKFLOW
  // ============================================================================

  async processBookingApproval(tenantId: string, request: ApprovalRequest) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Verify approver has permission
        const approver = await tx.user.findFirst({
          where: {
            id: request.approverId,
            tenantId,
            role: { in: [UserRole.COWORK_ADMIN, UserRole.CLIENT_ADMIN] },
          },
        });

        if (!approver) {
          throw new Error('User not authorized to approve bookings');
        }

        // Get booking and approval
        const booking = await tx.booking.findFirst({
          where: { id: request.bookingId, tenantId },
          include: { approval: true },
        });

        if (!booking || !booking.approval) {
          throw new Error('Booking or approval record not found');
        }

        if (booking.approval.status !== ApprovalStatus.PENDING) {
          throw new Error('Booking has already been reviewed');
        }

        // Update approval
        const approvalStatus = request.status === 'approve' 
          ? ApprovalStatus.APPROVED 
          : ApprovalStatus.REJECTED;

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

        // Update booking status
        const newBookingStatus = request.status === 'approve'
          ? BookingStatus.CONFIRMED
          : BookingStatus.CANCELLED;

        const updatedBooking = await tx.booking.update({
          where: { id: request.bookingId },
          data: { status: newBookingStatus },
          include: {
            space: true,
            user: true,
            approval: true,
          },
        });

        // Log the approval action
        await tx.auditLog.create({
          data: {
            tenantId,
            userId: request.approverId,
            action: `BOOKING_${request.status.toUpperCase()}D` as any,
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
    } catch (error) {
      logger.error('Failed to process booking approval', { tenantId, request }, error as Error);
      throw error;
    }
  }

  async getPendingApprovals(tenantId: string, approverId?: string) {
    try {
      const whereClause: any = {
        tenantId,
        status: ApprovalStatus.PENDING,
      };

      if (approverId) {
        // Only show approvals for spaces the user can manage
        const user = await prisma.user.findFirst({
          where: { id: approverId, tenantId },
        });

        if (!user || ![UserRole.COWORK_ADMIN, UserRole.CLIENT_ADMIN].includes(user.role)) {
          return [];
        }
      }

      return await prisma.bookingApproval.findMany({
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
    } catch (error) {
      logger.error('Failed to get pending approvals', { tenantId, approverId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // CHECK-IN/CHECK-OUT
  // ============================================================================

  async checkIn(tenantId: string, request: CheckInRequest) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Verify booking exists and user can check in
        const booking = await tx.booking.findFirst({
          where: {
            id: request.bookingId,
            tenantId,
            status: BookingStatus.CONFIRMED,
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

        // Check if already checked in
        if (booking.checkIns.length > 0) {
          throw new Error('Already checked in to this booking');
        }

        // Verify timing (allow check-in 15 minutes before start time)
        const now = new Date();
        const allowedCheckInTime = new Date(booking.startTime.getTime() - 15 * 60000);
        
        if (now < allowedCheckInTime) {
          throw new Error('Check-in not allowed yet');
        }

        if (now > booking.endTime) {
          throw new Error('Booking has expired');
        }

        // Create check-in record
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

        // Update booking status
        await tx.booking.update({
          where: { id: request.bookingId },
          data: { status: BookingStatus.CHECKED_IN },
        });

        // Log the check-in
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
    } catch (error) {
      logger.error('Failed to check in', { tenantId, request }, error as Error);
      throw error;
    }
  }

  async checkOut(tenantId: string, request: CheckOutRequest) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get check-in record
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

        // Update check-in record
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

        // Update booking status
        await tx.booking.update({
          where: { id: checkIn.bookingId },
          data: { status: BookingStatus.CHECKED_OUT },
        });

        // Log the check-out
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
              duration: (checkOutTime.getTime() - checkIn.checkedInAt.getTime()) / 60000, // minutes
            },
            timestamp: new Date(),
          },
        });

        return updatedCheckIn;
      });
    } catch (error) {
      logger.error('Failed to check out', { tenantId, request }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private shouldRequireApproval(user: any, space: any, booking: CreateBookingRequest): boolean {
    // Basic rules for requiring approval
    
    // High-value bookings (over $500)
    if (booking.cost && Number(booking.cost) > 500) {
      return true;
    }

    // Long bookings (over 4 hours)
    const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60);
    if (duration > 4) {
      return true;
    }

    // Conference rooms always require approval
    if (space.type === 'CONFERENCE_ROOM') {
      return true;
    }

    // End users require approval for meeting rooms
    if (user.role === UserRole.END_USER && space.type === 'MEETING_ROOM') {
      return true;
    }

    return false;
  }

  async getBookingStatistics(tenantId: string, spaceId?: string, startDate?: Date, endDate?: Date) {
    try {
      const whereClause: any = { tenantId };
      if (spaceId) whereClause.spaceId = spaceId;
      if (startDate || endDate) {
        whereClause.startTime = {};
        if (startDate) whereClause.startTime.gte = startDate;
        if (endDate) whereClause.startTime.lte = endDate;
      }

      const [
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        pendingApprovals,
        noShows,
        revenue
      ] = await Promise.all([
        prisma.booking.count({ where: whereClause }),
        prisma.booking.count({ where: { ...whereClause, status: BookingStatus.CONFIRMED } }),
        prisma.booking.count({ where: { ...whereClause, status: BookingStatus.CANCELLED } }),
        prisma.booking.count({ where: { ...whereClause, status: BookingStatus.PENDING } }),
        prisma.booking.count({ where: { ...whereClause, status: BookingStatus.NO_SHOW } }),
        prisma.booking.aggregate({
          where: { 
            ...whereClause, 
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] }
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
    } catch (error) {
      logger.error('Failed to get booking statistics', { tenantId, spaceId }, error as Error);
      throw error;
    }
  }
}

export const bookingManagementService = new BookingManagementService();