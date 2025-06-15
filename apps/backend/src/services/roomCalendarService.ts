import { prisma } from '../lib/prisma';
import { BookingStatus, SpaceType } from '@prisma/client';
import { logger } from '../utils/logger';
import { roomManagementService } from './roomManagementService';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string; // Space ID
  status: BookingStatus;
  userId: string;
  userName: string;
  userEmail: string;
  description?: string;
  color?: string;
  editable: boolean;
  extendedProps: {
    bookingId: string;
    spaceId: string;
    spaceName: string;
    capacity: number;
    cost?: number;
    checkedIn: boolean;
    requiresApproval: boolean;
    approvalStatus?: string;
  };
}

export interface CalendarResource {
  id: string;
  title: string;
  businessHours: Array<{
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
  }>;
  extendedProps: {
    type: SpaceType;
    capacity: number;
    hourlyRate?: number;
    amenities: string[];
    features: Array<{
      name: string;
      category: string;
      quantity: number;
    }>;
    isActive: boolean;
    currentStatus: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_ORDER';
  };
}

export interface CalendarView {
  events: CalendarEvent[];
  resources: CalendarResource[];
  timeZone: string;
  businessHours: Array<{
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
  }>;
  validRange: {
    start: Date;
    end: Date;
  };
}

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  resourceId: string;
  available: boolean;
  price?: number;
  conflicts?: string[];
}

export interface ConflictInfo {
  type: 'BOOKING' | 'MAINTENANCE' | 'AVAILABILITY';
  description: string;
  startTime: Date;
  endTime: Date;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CalendarFilters {
  spaceIds?: string[];
  spaceTypes?: SpaceType[];
  userId?: string;
  status?: BookingStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  showMaintenanceEvents?: boolean;
  showAvailabilityGaps?: boolean;
}

// ============================================================================
// ROOM CALENDAR SERVICE
// ============================================================================

export class RoomCalendarService {

  // ============================================================================
  // CALENDAR VIEW GENERATION
  // ============================================================================

  async getCalendarView(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    filters: CalendarFilters = {}
  ): Promise<CalendarView> {
    try {
      // Get filtered spaces
      const spaces = await this.getFilteredSpaces(tenantId, filters);
      
      // Get bookings for the date range
      const bookings = await this.getBookingsForDateRange(tenantId, startDate, endDate, filters);
      
      // Get maintenance events if requested
      const maintenanceEvents = filters.showMaintenanceEvents 
        ? await this.getMaintenanceEvents(tenantId, startDate, endDate, filters.spaceIds)
        : [];

      // Convert to calendar format
      const resources = await this.convertSpacesToResources(spaces);
      const events = [
        ...this.convertBookingsToEvents(bookings),
        ...this.convertMaintenanceToEvents(maintenanceEvents),
      ];

      // Get business hours (default or from tenant settings)
      const businessHours = await this.getBusinessHours(tenantId);

      return {
        events,
        resources,
        timeZone: 'UTC', // Could be configurable per tenant
        businessHours,
        validRange: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error) {
      logger.error('Failed to get calendar view', { tenantId, startDate, endDate, filters }, error as Error);
      throw error;
    }
  }

  async getAvailabilityMatrix(
    tenantId: string,
    date: Date,
    spaceIds?: string[],
    slotDuration: number = 30 // minutes
  ): Promise<{
    date: string;
    slots: AvailabilitySlot[];
    summary: {
      totalSlots: number;
      availableSlots: number;
      occupiedSlots: number;
      availabilityRate: number;
    };
  }> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get spaces
      const whereClause: any = { tenantId, isActive: true };
      if (spaceIds && spaceIds.length > 0) {
        whereClause.id = { in: spaceIds };
      }

      const spaces = await prisma.space.findMany({
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
              status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
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

      const slots: AvailabilitySlot[] = [];
      let totalSlots = 0;
      let availableSlots = 0;

      for (const space of spaces) {
        // Get availability rules for this day
        for (const availability of space.availability) {
          const [startHour, startMinute] = availability.startTime.split(':').map(Number);
          const [endHour, endMinute] = availability.endTime.split(':').map(Number);

          const slotStart = new Date(date);
          slotStart.setHours(startHour, startMinute, 0, 0);
          
          const slotEnd = new Date(date);
          slotEnd.setHours(endHour, endMinute, 0, 0);

          // Generate slots
          let currentSlot = new Date(slotStart);
          
          while (currentSlot < slotEnd) {
            const slotEndTime = new Date(currentSlot.getTime() + slotDuration * 60000);
            if (slotEndTime > slotEnd) break;

            totalSlots++;

            // Check for conflicts
            const conflicts: string[] = [];
            let available = true;

            // Check bookings
            const conflictingBooking = space.bookings.find(booking => 
              currentSlot < booking.endTime && slotEndTime > booking.startTime
            );
            if (conflictingBooking) {
              available = false;
              conflicts.push(`Booked by ${conflictingBooking.title}`);
            }

            // Check maintenance
            const conflictingMaintenance = space.maintenanceLogs.find(maintenance => 
              currentSlot < new Date(maintenance.scheduledAt.getTime() + 4 * 60 * 60 * 1000) && // Assume 4 hours
              slotEndTime > maintenance.scheduledAt
            );
            if (conflictingMaintenance) {
              available = false;
              conflicts.push(`Maintenance: ${conflictingMaintenance.title}`);
            }

            if (available) {
              availableSlots++;
            }

            // Calculate price for this slot
            const price = await roomManagementService.calculatePrice(tenantId, {
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
    } catch (error) {
      logger.error('Failed to get availability matrix', { tenantId, date }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // REAL-TIME UPDATES
  // ============================================================================

  async getRealtimeCalendarUpdates(
    tenantId: string,
    lastUpdateTime: Date,
    spaceIds?: string[]
  ): Promise<{
    events: {
      created: CalendarEvent[];
      updated: CalendarEvent[];
      deleted: string[];
    };
    resources: {
      updated: CalendarResource[];
    };
    lastUpdateTime: Date;
  }> {
    try {
      const now = new Date();

      // Get bookings created/updated since last update
      const whereClause: any = {
        tenantId,
        updatedAt: { gt: lastUpdateTime },
      };

      if (spaceIds && spaceIds.length > 0) {
        whereClause.spaceId = { in: spaceIds };
      }

      const updatedBookings = await prisma.booking.findMany({
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

      // Separate created vs updated events
      const createdEvents: CalendarEvent[] = [];
      const updatedEvents: CalendarEvent[] = [];

      for (const booking of updatedBookings) {
        const event = this.convertBookingToEvent(booking);
        
        if (booking.createdAt > lastUpdateTime) {
          createdEvents.push(event);
        } else {
          updatedEvents.push(event);
        }
      }

      // Get deleted bookings (cancelled status)
      const deletedBookings = await prisma.booking.findMany({
        where: {
          ...whereClause,
          status: BookingStatus.CANCELLED,
        },
        select: { id: true },
      });

      const deletedEventIds = deletedBookings.map(b => b.id);

      // Check for updated space information
      const updatedSpaces = await prisma.space.findMany({
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
    } catch (error) {
      logger.error('Failed to get realtime calendar updates', { tenantId, lastUpdateTime }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // CONFLICT DETECTION
  // ============================================================================

  async detectConflicts(
    tenantId: string,
    spaceId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<ConflictInfo[]> {
    try {
      const conflicts: ConflictInfo[] = [];

      // Check booking conflicts
      const conflictingBookings = await prisma.booking.findMany({
        where: {
          tenantId,
          spaceId,
          id: { not: excludeBookingId },
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
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

      // Check maintenance conflicts
      const conflictingMaintenance = await prisma.roomMaintenanceLog.findMany({
        where: {
          tenantId,
          spaceId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          scheduledAt: { lt: endTime },
          // Assume maintenance takes 4 hours
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

      // Check availability rules
      const dayOfWeek = startTime.getDay();
      const startTimeStr = startTime.toTimeString().substring(0, 5);
      const endTimeStr = endTime.toTimeString().substring(0, 5);

      const availability = await prisma.roomAvailability.findFirst({
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
    } catch (error) {
      logger.error('Failed to detect conflicts', { tenantId, spaceId, startTime, endTime }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async getFilteredSpaces(tenantId: string, filters: CalendarFilters) {
    const whereClause: any = { tenantId };

    if (filters.spaceIds && filters.spaceIds.length > 0) {
      whereClause.id = { in: filters.spaceIds };
    }

    if (filters.spaceTypes && filters.spaceTypes.length > 0) {
      whereClause.type = { in: filters.spaceTypes };
    }

    return await prisma.space.findMany({
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
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
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

  private async getBookingsForDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    filters: CalendarFilters
  ) {
    const whereClause: any = {
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

    return await prisma.booking.findMany({
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

  private async getMaintenanceEvents(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    spaceIds?: string[]
  ) {
    const whereClause: any = {
      tenantId,
      scheduledAt: { gte: startDate, lte: endDate },
    };

    if (spaceIds && spaceIds.length > 0) {
      whereClause.spaceId = { in: spaceIds };
    }

    return await prisma.roomMaintenanceLog.findMany({
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

  private async convertSpacesToResources(spaces: any[]): Promise<CalendarResource[]> {
    return spaces.map(space => {
      // Determine current status
      let currentStatus: CalendarResource['extendedProps']['currentStatus'] = 'AVAILABLE';
      
      if (!space.isActive) {
        currentStatus = 'OUT_OF_ORDER';
      } else if (space.maintenanceLogs.length > 0) {
        currentStatus = 'MAINTENANCE';
      } else if (space.bookings.length > 0) {
        currentStatus = 'OCCUPIED';
      }

      // Convert availability to business hours
      const businessHours = space.availability.map((avail: any) => ({
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
          features: space.features.map((spaceFeature: any) => ({
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

  private convertBookingsToEvents(bookings: any[]): CalendarEvent[] {
    return bookings.map(booking => this.convertBookingToEvent(booking));
  }

  private convertBookingToEvent(booking: any): CalendarEvent {
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
      editable: booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PENDING,
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

  private convertMaintenanceToEvents(maintenanceEvents: any[]): CalendarEvent[] {
    return maintenanceEvents.map(maintenance => ({
      id: `maintenance_${maintenance.id}`,
      title: `🔧 ${maintenance.title}`,
      start: maintenance.scheduledAt,
      end: new Date(maintenance.scheduledAt.getTime() + 4 * 60 * 60 * 1000), // Default 4 hours
      resourceId: maintenance.spaceId,
      status: 'CONFIRMED' as BookingStatus,
      userId: 'system',
      userName: 'System',
      userEmail: 'system@sweetspot.com',
      description: maintenance.description || `${maintenance.maintenanceType} maintenance`,
      color: '#ff9800', // Orange for maintenance
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

  private getEventColor(status: BookingStatus, isCheckedIn: boolean): string {
    if (isCheckedIn) return '#4caf50'; // Green for checked in
    
    switch (status) {
      case BookingStatus.CONFIRMED:
        return '#2196f3'; // Blue
      case BookingStatus.PENDING:
        return '#ff9800'; // Orange
      case BookingStatus.CANCELLED:
        return '#f44336'; // Red
      case BookingStatus.COMPLETED:
        return '#9e9e9e'; // Gray
      case BookingStatus.NO_SHOW:
        return '#e91e63'; // Pink
      default:
        return '#607d8b'; // Blue gray
    }
  }

  private async getBusinessHours(tenantId: string) {
    // Default business hours - could be made configurable per tenant
    return [
      {
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
        startTime: '09:00',
        endTime: '18:00',
      },
      {
        daysOfWeek: [6], // Saturday
        startTime: '10:00',
        endTime: '16:00',
      },
    ];
  }

  async generateCalendarSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    spaceIds?: string[]
  ): Promise<{
    period: { start: Date; end: Date };
    totalBookings: number;
    totalRevenue: number;
    utilizationRate: number;
    mostPopularRoom: { id: string; name: string; bookings: number };
    peakUsageHours: { hour: number; bookings: number }[];
    upcomingMaintenances: number;
  }> {
    try {
      const whereClause: any = {
        tenantId,
        startTime: { gte: startDate },
        endTime: { lte: endDate },
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] },
      };

      if (spaceIds && spaceIds.length > 0) {
        whereClause.spaceId = { in: spaceIds };
      }

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
      const totalRevenue = bookings.reduce((sum, booking) => sum + (Number(booking.cost) || 0), 0);

      // Calculate utilization rate (simplified)
      const totalHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      const bookedHours = bookings.reduce((sum, booking) => 
        sum + (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60), 0
      );
      const utilizationRate = totalHours > 0 ? bookedHours / totalHours : 0;

      // Find most popular room
      const roomBookings = new Map<string, { name: string; count: number }>();
      bookings.forEach(booking => {
        const key = booking.spaceId;
        if (!roomBookings.has(key)) {
          roomBookings.set(key, { name: booking.space.name, count: 0 });
        }
        roomBookings.get(key)!.count++;
      });

      const mostPopular = Array.from(roomBookings.entries()).reduce(
        (max, [id, data]) => data.count > max.bookings ? { id, name: data.name, bookings: data.count } : max,
        { id: '', name: '', bookings: 0 }
      );

      // Calculate peak usage hours
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

      // Count upcoming maintenances
      const upcomingMaintenances = await prisma.roomMaintenanceLog.count({
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
    } catch (error) {
      logger.error('Failed to generate calendar summary', { tenantId, startDate, endDate }, error as Error);
      throw error;
    }
  }
}

export const roomCalendarService = new RoomCalendarService();