import { prisma } from "../lib/prisma";
import { BookingStatus } from "@prisma/client";
import { logger } from "../utils/logger";
import { ValidationError } from "../utils/errors";
import { spaceService } from "./spaceService";
import { auditLogService } from "./auditLogService";

export interface CreateBookingData {
  spaceId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  equipment?: string[];
  catering?: boolean;
  notes?: string;
}

export interface UpdateBookingData {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  status?: BookingStatus;
  cost?: number;
  attendees?: string[];
  equipment?: string[];
  catering?: boolean;
  notes?: string;
}

export interface BookingWithDetails {
  id: string;
  tenantId: string;
  spaceId: string;
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  cost?: number;
  attendees?: string[];
  equipment?: string[];
  catering?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  space?: any;
  user?: any;
}

export interface BookingFilters {
  userId?: string;
  spaceId?: string;
  status?: BookingStatus[];
  startDate?: Date;
  endDate?: Date;
  upcoming?: boolean;
}

export class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(
    tenantId: string,
    userId: string,
    data: CreateBookingData
  ): Promise<BookingWithDetails> {
    try {
      // Validate booking data
      await this.validateBookingData(data);

      // Check space availability
      const availability = await spaceService.checkSpaceAvailability(
        tenantId,
        data.spaceId,
        data.startTime,
        data.endTime
      );

      if (!availability.isAvailable) {
        throw new ValidationError(
          `Space is not available for the requested time. ${
            availability.conflictingBookings?.length || 0
          } conflicting booking(s) found.`
        );
      }

      // Calculate cost based on space hourly rate
      const space = availability.space!;
      const durationHours =
        (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60 * 60);
      const cost = space.hourlyRate ? space.hourlyRate * durationHours : 0;

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          tenantId,
          spaceId: data.spaceId,
          userId,
          title: data.title,
          description: data.description,
          startTime: data.startTime,
          endTime: data.endTime,
          status: "CONFIRMED", // Default to confirmed for now
          cost: cost > 0 ? cost : undefined,
          // Additional fields that may not be in current schema
          ...(data.attendees && { attendees: JSON.stringify(data.attendees) }),
          ...(data.equipment && { equipment: JSON.stringify(data.equipment) }),
          ...(data.catering !== undefined && { catering: data.catering }),
          ...(data.notes && { notes: data.notes }),
        },
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
      });

      // Log the booking creation
      await auditLogService.log({
        tenantId,
        userId,
        action: "CREATE",
        entityType: "Booking",
        entityId: booking.id,
        newValues: {
          spaceId: data.spaceId,
          title: data.title,
          startTime: data.startTime,
          endTime: data.endTime,
          cost,
        },
        details: {
          action: "Booking created",
          spaceName: space.name,
          duration: `${durationHours} hours`,
        },
      });

      logger.info("Booking created successfully", {
        bookingId: booking.id,
        tenantId,
        userId,
        spaceId: data.spaceId,
        duration: durationHours,
        cost,
      });

      return this.formatBookingResponse(booking);
    } catch (error) {
      logger.error("Failed to create booking", {
        tenantId,
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get bookings with filtering and pagination
   */
  async getBookings(
    tenantId: string,
    filters: BookingFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    bookings: BookingWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const whereClause: any = {
        tenantId,
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.spaceId && { spaceId: filters.spaceId }),
        ...(filters.status && { status: { in: filters.status } }),
      };

      // Date filtering
      if (filters.startDate || filters.endDate || filters.upcoming) {
        const dateFilter: any = {};

        if (filters.upcoming) {
          dateFilter.endTime = { gte: new Date() };
        } else {
          if (filters.startDate) {
            dateFilter.startTime = { gte: filters.startDate };
          }
          if (filters.endDate) {
            dateFilter.endTime = { lte: filters.endDate };
          }
        }

        Object.assign(whereClause, dateFilter);
      }

      // Get total count
      const total = await prisma.booking.count({ where: whereClause });

      // Get bookings with pagination
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
        },
        orderBy: { startTime: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        bookings: bookings.map((booking) =>
          this.formatBookingResponse(booking)
        ),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error("Failed to get bookings", {
        tenantId,
        filters,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(
    tenantId: string,
    bookingId: string
  ): Promise<BookingWithDetails | null> {
    try {
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          tenantId,
        },
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
      });

      if (!booking) {
        return null;
      }

      return this.formatBookingResponse(booking);
    } catch (error) {
      logger.error("Failed to get booking by ID", {
        bookingId,
        tenantId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update booking
   */
  async updateBooking(
    tenantId: string,
    bookingId: string,
    userId: string,
    data: UpdateBookingData
  ): Promise<BookingWithDetails> {
    try {
      // Get existing booking
      const existingBooking = await this.getBookingById(tenantId, bookingId);
      if (!existingBooking) {
        throw new ValidationError("Booking not found");
      }

      // Check permissions (user can only edit their own bookings, unless admin)
      if (existingBooking.userId !== userId) {
        // TODO: Add admin role check here
        throw new ValidationError("You can only edit your own bookings");
      }

      // If time is being changed, check availability
      if (data.startTime || data.endTime) {
        const newStartTime = data.startTime || existingBooking.startTime;
        const newEndTime = data.endTime || existingBooking.endTime;

        if (newStartTime >= newEndTime) {
          throw new ValidationError("Start time must be before end time");
        }

        // Check availability (excluding current booking)
        const conflictingBookings = await prisma.booking.findMany({
          where: {
            spaceId: existingBooking.spaceId,
            tenantId,
            id: { not: bookingId },
            status: { in: ["PENDING", "CONFIRMED"] },
            OR: [
              {
                startTime: { gte: newStartTime, lt: newEndTime },
              },
              {
                endTime: { gt: newStartTime, lte: newEndTime },
              },
              {
                AND: [
                  { startTime: { lte: newStartTime } },
                  { endTime: { gte: newEndTime } },
                ],
              },
            ],
          },
        });

        if (conflictingBookings.length > 0) {
          throw new ValidationError(
            "Space is not available for the new time slot"
          );
        }

        // Recalculate cost if time changed
        if (existingBooking.space?.hourlyRate) {
          const durationHours =
            (newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60 * 60);
          data.cost = existingBooking.space.hourlyRate * durationHours;
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (data.title) updateData.title = data.title;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.startTime) updateData.startTime = data.startTime;
      if (data.endTime) updateData.endTime = data.endTime;
      if (data.status) updateData.status = data.status;
      if (data.cost !== undefined) updateData.cost = data.cost;
      if (data.attendees) updateData.attendees = JSON.stringify(data.attendees);
      if (data.equipment) updateData.equipment = JSON.stringify(data.equipment);
      if (data.catering !== undefined) updateData.catering = data.catering;
      if (data.notes !== undefined) updateData.notes = data.notes;

      // Update booking
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
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
      });

      // Log the update
      await auditLogService.log({
        tenantId,
        userId,
        action: "UPDATE",
        entityType: "Booking",
        entityId: bookingId,
        oldValues: {
          title: existingBooking.title,
          startTime: existingBooking.startTime,
          endTime: existingBooking.endTime,
          status: existingBooking.status,
        },
        newValues: updateData,
        details: {
          action: "Booking updated",
          updatedFields: Object.keys(updateData),
        },
      });

      logger.info("Booking updated successfully", {
        bookingId,
        tenantId,
        userId,
        updatedFields: Object.keys(updateData),
      });

      return this.formatBookingResponse(updatedBooking);
    } catch (error) {
      logger.error("Failed to update booking", {
        bookingId,
        tenantId,
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(
    tenantId: string,
    bookingId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    try {
      const booking = await this.getBookingById(tenantId, bookingId);
      if (!booking) {
        throw new ValidationError("Booking not found");
      }

      // Check permissions
      if (booking.userId !== userId) {
        // TODO: Add admin role check here
        throw new ValidationError("You can only cancel your own bookings");
      }

      // Check if booking can be cancelled
      if (booking.status === "CANCELLED") {
        throw new ValidationError("Booking is already cancelled");
      }

      if (booking.status === "COMPLETED") {
        throw new ValidationError("Cannot cancel completed booking");
      }

      // Update booking status
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          ...(reason && { notes: reason }),
        },
      });

      // Log the cancellation
      await auditLogService.log({
        tenantId,
        userId,
        action: "UPDATE",
        entityType: "Booking",
        entityId: bookingId,
        oldValues: { status: booking.status },
        newValues: { status: "CANCELLED" },
        details: {
          action: "Booking cancelled",
          reason: reason || "No reason provided",
        },
      });

      logger.info("Booking cancelled successfully", {
        bookingId,
        tenantId,
        userId,
        reason,
      });
    } catch (error) {
      logger.error("Failed to cancel booking", {
        bookingId,
        tenantId,
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get upcoming bookings for a user
   */
  async getUpcomingBookings(
    tenantId: string,
    userId?: string,
    limit: number = 10
  ): Promise<BookingWithDetails[]> {
    try {
      const whereClause: any = {
        tenantId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { gte: new Date() },
        ...(userId && { userId }),
      };

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
        },
        orderBy: { startTime: "asc" },
        take: limit,
      });

      return bookings.map((booking) => this.formatBookingResponse(booking));
    } catch (error) {
      logger.error("Failed to get upcoming bookings", {
        tenantId,
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get booking statistics
   */
  async getBookingStatistics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    averageBookingDuration: number;
    popularSpaces: Array<{
      spaceId: string;
      spaceName: string;
      bookingCount: number;
    }>;
    bookingsByStatus: Array<{ status: BookingStatus; count: number }>;
  }> {
    try {
      const whereClause: any = {
        tenantId,
        ...(startDate && { startTime: { gte: startDate } }),
        ...(endDate && { endTime: { lte: endDate } }),
      };

      const bookings = await prisma.booking.findMany({
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
      const confirmedBookings = bookings.filter(
        (b) => b.status === "CONFIRMED"
      ).length;
      const cancelledBookings = bookings.filter(
        (b) => b.status === "CANCELLED"
      ).length;

      const totalRevenue = bookings.reduce((sum, booking) => {
        return sum + (booking.cost ? parseFloat(booking.cost.toString()) : 0);
      }, 0);

      const totalDuration = bookings.reduce((sum, booking) => {
        const duration =
          (booking.endTime.getTime() - booking.startTime.getTime()) /
          (1000 * 60 * 60);
        return sum + duration;
      }, 0);

      const averageBookingDuration =
        totalBookings > 0 ? totalDuration / totalBookings : 0;

      // Popular spaces
      const spaceBookingCounts: {
        [key: string]: { name: string; count: number };
      } = {};
      bookings.forEach((booking) => {
        const spaceId = booking.spaceId;
        if (!spaceBookingCounts[spaceId]) {
          spaceBookingCounts[spaceId] = {
            name: booking.space.name,
            count: 0,
          };
        }
        spaceBookingCounts[spaceId].count++;
      });

      const popularSpaces = Object.entries(spaceBookingCounts)
        .map(([spaceId, data]) => ({
          spaceId,
          spaceName: data.name,
          bookingCount: data.count,
        }))
        .sort((a, b) => b.bookingCount - a.bookingCount)
        .slice(0, 5);

      // Bookings by status
      const statusCounts: { [key in BookingStatus]: number } = {
        PENDING: 0,
        CONFIRMED: 0,
        CANCELLED: 0,
        COMPLETED: 0,
        NO_SHOW: 0,
        CHECKED_IN: 0,
        CHECKED_OUT: 0,
      };

      bookings.forEach((booking) => {
        statusCounts[booking.status]++;
      });

      const bookingsByStatus = Object.entries(statusCounts)
        .map(([status, count]) => ({ status: status as BookingStatus, count }))
        .filter((item) => item.count > 0);

      return {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue,
        averageBookingDuration,
        popularSpaces,
        bookingsByStatus,
      };
    } catch (error) {
      logger.error("Failed to get booking statistics", {
        tenantId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async validateBookingData(data: CreateBookingData): Promise<void> {
    if (!data.title || data.title.trim().length === 0) {
      throw new ValidationError("Booking title is required");
    }

    if (data.startTime >= data.endTime) {
      throw new ValidationError("Start time must be before end time");
    }

    if (data.startTime < new Date()) {
      throw new ValidationError("Cannot book in the past");
    }

    // Check minimum booking duration (e.g., 30 minutes)
    const durationMinutes =
      (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60);
    if (durationMinutes < 30) {
      throw new ValidationError("Minimum booking duration is 30 minutes");
    }

    // Check maximum booking duration (e.g., 8 hours)
    const durationHours = durationMinutes / 60;
    if (durationHours > 8) {
      throw new ValidationError("Maximum booking duration is 8 hours");
    }
  }

  private formatBookingResponse(booking: any): BookingWithDetails {
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
      user: booking.user,
    };
  }
}

export const bookingService = new BookingService();
