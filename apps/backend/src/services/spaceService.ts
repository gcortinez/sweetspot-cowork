import { prisma } from '../lib/prisma';
import { SpaceType, BookingStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

export interface CreateSpaceData {
  name: string;
  type: SpaceType;
  description?: string;
  capacity: number;
  amenities?: string[];
  hourlyRate?: number;
  isActive?: boolean;
  location?: string;
  floor?: number;
  equipment?: string[];
  features?: string[];
}

export interface UpdateSpaceData {
  name?: string;
  type?: SpaceType;
  description?: string;
  capacity?: number;
  amenities?: string[];
  hourlyRate?: number;
  isActive?: boolean;
  location?: string;
  floor?: number;
  equipment?: string[];
  features?: string[];
}

export interface SpaceAvailabilityQuery {
  startTime: Date;
  endTime: Date;
  capacity?: number;
  type?: SpaceType;
  amenities?: string[];
}

export interface SpaceWithDetails {
  id: string;
  tenantId: string;
  name: string;
  type: SpaceType;
  description?: string;
  capacity: number;
  amenities: string[];
  hourlyRate?: number;
  isActive: boolean;
  location?: string;
  floor?: number;
  equipment?: string[];
  features?: string[];
  createdAt: Date;
  updatedAt: Date;
  bookings?: any[];
  occupancyTracking?: any[];
}

export class SpaceService {
  /**
   * Create a new space/meeting room
   */
  async createSpace(tenantId: string, data: CreateSpaceData): Promise<SpaceWithDetails> {
    try {
      // Validate space data
      await this.validateSpaceData(data);

      // Check for duplicate space names within tenant
      const existingSpace = await prisma.space.findFirst({
        where: {
          tenantId,
          name: data.name,
          isActive: true
        }
      });

      if (existingSpace) {
        throw new ValidationError('Space with this name already exists');
      }

      const space = await prisma.space.create({
        data: {
          tenantId,
          name: data.name,
          type: data.type,
          description: data.description,
          capacity: data.capacity,
          amenities: JSON.stringify(data.amenities || []),
          hourlyRate: data.hourlyRate,
          isActive: data.isActive ?? true
        }
      });

      logger.info('Space created successfully', {
        spaceId: space.id,
        tenantId,
        spaceName: space.name,
        type: space.type
      });

      return this.formatSpaceResponse(space);
    } catch (error) {
      logger.error('Failed to create space', {
        tenantId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get all spaces for a tenant with filtering
   */
  async getSpaces(
    tenantId: string,
    filters: {
      type?: SpaceType;
      isActive?: boolean;
      capacity?: number;
      amenities?: string[];
    } = {}
  ): Promise<SpaceWithDetails[]> {
    try {
      const whereClause: any = {
        tenantId,
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters.type && { type: filters.type }),
        ...(filters.capacity && { capacity: { gte: filters.capacity } })
      };

      const spaces = await prisma.space.findMany({
        where: whereClause,
        include: {
          bookings: {
            where: {
              status: { in: ['PENDING', 'CONFIRMED'] },
              endTime: { gte: new Date() }
            },
            orderBy: { startTime: 'asc' }
          },
          occupancyTracking: {
            orderBy: { updatedAt: 'desc' },
            take: 1
          }
        },
        orderBy: [
          { type: 'asc' },
          { name: 'asc' }
        ]
      });

      const formattedSpaces = spaces.map(space => this.formatSpaceResponse(space));

      // Filter by amenities if specified
      if (filters.amenities && filters.amenities.length > 0) {
        return formattedSpaces.filter(space => 
          filters.amenities!.every(amenity => space.amenities.includes(amenity))
        );
      }

      return formattedSpaces;
    } catch (error) {
      logger.error('Failed to get spaces', {
        tenantId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get space by ID with full details
   */
  async getSpaceById(tenantId: string, spaceId: string): Promise<SpaceWithDetails | null> {
    try {
      const space = await prisma.space.findFirst({
        where: {
          id: spaceId,
          tenantId
        },
        include: {
          bookings: {
            where: {
              endTime: { gte: new Date() }
            },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            },
            orderBy: { startTime: 'asc' }
          },
          occupancyTracking: {
            orderBy: { updatedAt: 'desc' },
            take: 10
          }
        }
      });

      if (!space) {
        return null;
      }

      return this.formatSpaceResponse(space);
    } catch (error) {
      logger.error('Failed to get space by ID', {
        spaceId,
        tenantId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Update space information
   */
  async updateSpace(
    tenantId: string,
    spaceId: string,
    data: UpdateSpaceData
  ): Promise<SpaceWithDetails> {
    try {
      // Validate update data
      if (Object.keys(data).length === 0) {
        throw new ValidationError('No update data provided');
      }

      // Check if space exists
      const existingSpace = await prisma.space.findFirst({
        where: { id: spaceId, tenantId }
      });

      if (!existingSpace) {
        throw new ValidationError('Space not found');
      }

      // Check for name conflicts if name is being updated
      if (data.name && data.name !== existingSpace.name) {
        const duplicateSpace = await prisma.space.findFirst({
          where: {
            tenantId,
            name: data.name,
            id: { not: spaceId },
            isActive: true
          }
        });

        if (duplicateSpace) {
          throw new ValidationError('Space with this name already exists');
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.type) updateData.type = data.type;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.capacity) updateData.capacity = data.capacity;
      if (data.amenities) updateData.amenities = JSON.stringify(data.amenities);
      if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const updatedSpace = await prisma.space.update({
        where: { id: spaceId },
        data: updateData
      });

      logger.info('Space updated successfully', {
        spaceId,
        tenantId,
        updatedFields: Object.keys(updateData)
      });

      return this.formatSpaceResponse(updatedSpace);
    } catch (error) {
      logger.error('Failed to update space', {
        spaceId,
        tenantId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Delete/deactivate a space
   */
  async deleteSpace(tenantId: string, spaceId: string): Promise<void> {
    try {
      // Check for active bookings
      const activeBookings = await prisma.booking.count({
        where: {
          spaceId,
          tenantId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          endTime: { gte: new Date() }
        }
      });

      if (activeBookings > 0) {
        throw new ValidationError(
          `Cannot delete space with ${activeBookings} active booking(s). Please cancel or complete existing bookings first.`
        );
      }

      // Soft delete by setting isActive to false
      await prisma.space.update({
        where: { id: spaceId },
        data: { isActive: false }
      });

      logger.info('Space deactivated successfully', {
        spaceId,
        tenantId
      });
    } catch (error) {
      logger.error('Failed to delete space', {
        spaceId,
        tenantId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Check space availability for a time period
   */
  async checkSpaceAvailability(
    tenantId: string,
    spaceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{
    isAvailable: boolean;
    conflictingBookings?: any[];
    space?: SpaceWithDetails;
  }> {
    try {
      // Validate time period
      if (startTime >= endTime) {
        throw new ValidationError('Start time must be before end time');
      }

      if (startTime < new Date()) {
        throw new ValidationError('Cannot book in the past');
      }

      // Get space details
      const space = await this.getSpaceById(tenantId, spaceId);
      if (!space) {
        throw new ValidationError('Space not found');
      }

      if (!space.isActive) {
        throw new ValidationError('Space is not active');
      }

      // Check for conflicting bookings
      const conflictingBookings = await prisma.booking.findMany({
        where: {
          spaceId,
          tenantId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          OR: [
            {
              // Booking starts during our time period
              startTime: {
                gte: startTime,
                lt: endTime
              }
            },
            {
              // Booking ends during our time period
              endTime: {
                gt: startTime,
                lte: endTime
              }
            },
            {
              // Booking completely encompasses our time period
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gte: endTime } }
              ]
            }
          ]
        },
        include: {
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

      const isAvailable = conflictingBookings.length === 0;

      return {
        isAvailable,
        conflictingBookings: isAvailable ? undefined : conflictingBookings,
        space
      };
    } catch (error) {
      logger.error('Failed to check space availability', {
        spaceId,
        tenantId,
        startTime,
        endTime,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Find available spaces for a time period
   */
  async findAvailableSpaces(
    tenantId: string,
    query: SpaceAvailabilityQuery
  ): Promise<SpaceWithDetails[]> {
    try {
      // Get all spaces that match basic criteria
      const spaces = await this.getSpaces(tenantId, {
        isActive: true,
        type: query.type,
        capacity: query.capacity,
        amenities: query.amenities
      });

      // Check availability for each space
      const availableSpaces: SpaceWithDetails[] = [];

      for (const space of spaces) {
        const availability = await this.checkSpaceAvailability(
          tenantId,
          space.id,
          query.startTime,
          query.endTime
        );

        if (availability.isAvailable) {
          availableSpaces.push(space);
        }
      }

      return availableSpaces;
    } catch (error) {
      logger.error('Failed to find available spaces', {
        tenantId,
        query,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get space utilization statistics
   */
  async getSpaceUtilization(
    tenantId: string,
    spaceId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalBookings: number;
    totalHours: number;
    averageBookingDuration: number;
    utilizationRate: number;
    popularTimeSlots: any[];
    revenueGenerated: number;
  }> {
    try {
      const whereClause: any = {
        tenantId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        ...(spaceId && { spaceId }),
        ...(startDate && { startTime: { gte: startDate } }),
        ...(endDate && { endTime: { lte: endDate } })
      };

      const bookings = await prisma.booking.findMany({
        where: whereClause,
        include: {
          space: true
        }
      });

      const totalBookings = bookings.length;
      const totalHours = bookings.reduce((total, booking) => {
        const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60);
        return total + duration;
      }, 0);

      const averageBookingDuration = totalBookings > 0 ? totalHours / totalBookings : 0;

      // Calculate utilization rate (simplified)
      const businessHoursPerDay = 12; // 8 AM to 8 PM
      const daysInPeriod = startDate && endDate 
        ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        : 30; // Default to 30 days

      const availableHours = businessHoursPerDay * daysInPeriod;
      const utilizationRate = availableHours > 0 ? (totalHours / availableHours) * 100 : 0;

      // Calculate revenue
      const revenueGenerated = bookings.reduce((total, booking) => {
        return total + (booking.cost ? parseFloat(booking.cost.toString()) : 0);
      }, 0);

      // Popular time slots (simplified)
      const timeSlots: { [key: string]: number } = {};
      bookings.forEach(booking => {
        const hour = booking.startTime.getHours();
        const timeSlot = `${hour}:00-${hour + 1}:00`;
        timeSlots[timeSlot] = (timeSlots[timeSlot] || 0) + 1;
      });

      const popularTimeSlots = Object.entries(timeSlots)
        .map(([timeSlot, count]) => ({ timeSlot, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalBookings,
        totalHours,
        averageBookingDuration,
        utilizationRate,
        popularTimeSlots,
        revenueGenerated
      };
    } catch (error) {
      logger.error('Failed to get space utilization', {
        tenantId,
        spaceId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async validateSpaceData(data: CreateSpaceData): Promise<void> {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Space name is required');
    }

    if (data.capacity <= 0) {
      throw new ValidationError('Capacity must be greater than 0');
    }

    if (data.hourlyRate && data.hourlyRate < 0) {
      throw new ValidationError('Hourly rate cannot be negative');
    }
  }

  private formatSpaceResponse(space: any): SpaceWithDetails {
    return {
      id: space.id,
      tenantId: space.tenantId,
      name: space.name,
      type: space.type,
      description: space.description,
      capacity: space.capacity,
      amenities: space.amenities ? JSON.parse(space.amenities) : [],
      hourlyRate: space.hourlyRate ? parseFloat(space.hourlyRate.toString()) : undefined,
      isActive: space.isActive,
      location: space.location,
      floor: space.floor,
      equipment: space.equipment ? JSON.parse(space.equipment) : [],
      features: space.features ? JSON.parse(space.features) : [],
      createdAt: space.createdAt,
      updatedAt: space.updatedAt,
      bookings: space.bookings,
      occupancyTracking: space.occupancyTracking
    };
  }
}

export const spaceService = new SpaceService();