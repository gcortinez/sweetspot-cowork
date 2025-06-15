import { prisma } from '../lib/prisma';
import {
  SpaceType,
  BookingStatus,
  ApprovalStatus,
  FeatureCategory,
  PriceModifierType,
  MaintenanceType,
  MaintenanceStatus,
  RecurrenceType,
  PricingRuleType
} from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface CreateRoomRequest {
  name: string;
  type: SpaceType;
  description?: string;
  capacity: number;
  hourlyRate?: number;
  amenities?: string[];
  features?: {
    featureId: string;
    quantity: number;
    notes?: string;
  }[];
}

export interface CreateBookingRequest {
  spaceId: string;
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  requiresApproval?: boolean;
}

export interface RoomAvailabilityRequest {
  spaceId: string;
  startTime: Date;
  endTime: Date;
  excludeBookingId?: string;
}

export interface DynamicPricingRequest {
  spaceId: string;
  startTime: Date;
  endTime: Date;
  features?: string[];
  capacity?: number;
}

export interface RoomFeatureRequest {
  name: string;
  description?: string;
  category: FeatureCategory;
}

export interface PricingRuleRequest {
  spaceId?: string;
  name: string;
  description?: string;
  ruleType: PricingRuleType;
  conditions: Record<string, any>;
  basePrice?: number;
  priceModifier: number;
  modifierType: PriceModifierType;
  priority?: number;
  validFrom?: Date;
  validTo?: Date;
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

export interface RoomAnalyticsRequest {
  spaceId?: string;
  startDate: Date;
  endDate: Date;
  granularity?: 'daily' | 'weekly' | 'monthly';
}

// ============================================================================
// ROOM MANAGEMENT SERVICE
// ============================================================================

export class RoomManagementService {
  
  // ============================================================================
  // ROOM INVENTORY MANAGEMENT
  // ============================================================================

  async createRoom(tenantId: string, request: CreateRoomRequest) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Create the space
        const space = await tx.space.create({
          data: {
            tenantId,
            name: request.name,
            type: request.type,
            description: request.description,
            capacity: request.capacity,
            hourlyRate: request.hourlyRate ? Number(request.hourlyRate) : null,
            amenities: request.amenities || [],
            isActive: true,
          },
        });

        // Add features if provided
        if (request.features && request.features.length > 0) {
          await tx.spaceFeature.createMany({
            data: request.features.map(feature => ({
              spaceId: space.id,
              featureId: feature.featureId,
              quantity: feature.quantity,
              notes: feature.notes,
            })),
          });
        }

        // Create default availability (Monday to Friday, 9 AM to 6 PM)
        const defaultAvailability = [];
        for (let day = 1; day <= 5; day++) { // Monday to Friday
          defaultAvailability.push({
            tenantId,
            spaceId: space.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '18:00',
            isAvailable: true,
            recurrenceType: RecurrenceType.WEEKLY,
          });
        }

        await tx.roomAvailability.createMany({
          data: defaultAvailability,
        });

        return space;
      });
    } catch (error) {
      logger.error('Failed to create room', { tenantId, request }, error as Error);
      throw error;
    }
  }

  async updateRoom(tenantId: string, spaceId: string, updates: Partial<CreateRoomRequest>) {
    try {
      return await prisma.$transaction(async (tx) => {
        const space = await tx.space.update({
          where: { id: spaceId, tenantId },
          data: {
            name: updates.name,
            type: updates.type,
            description: updates.description,
            capacity: updates.capacity,
            hourlyRate: updates.hourlyRate ? Number(updates.hourlyRate) : undefined,
            amenities: updates.amenities,
          },
        });

        // Update features if provided
        if (updates.features) {
          // Remove existing features
          await tx.spaceFeature.deleteMany({
            where: { spaceId },
          });

          // Add new features
          if (updates.features.length > 0) {
            await tx.spaceFeature.createMany({
              data: updates.features.map(feature => ({
                spaceId,
                featureId: feature.featureId,
                quantity: feature.quantity,
                notes: feature.notes,
              })),
            });
          }
        }

        return space;
      });
    } catch (error) {
      logger.error('Failed to update room', { tenantId, spaceId, updates }, error as Error);
      throw error;
    }
  }

  async deleteRoom(tenantId: string, spaceId: string) {
    try {
      // Check for active bookings
      const activeBookings = await prisma.booking.count({
        where: {
          spaceId,
          tenantId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
          endTime: { gt: new Date() },
        },
      });

      if (activeBookings > 0) {
        throw new Error(`Cannot delete room with ${activeBookings} active bookings`);
      }

      return await prisma.space.update({
        where: { id: spaceId, tenantId },
        data: { isActive: false },
      });
    } catch (error) {
      logger.error('Failed to delete room', { tenantId, spaceId }, error as Error);
      throw error;
    }
  }

  async getRooms(tenantId: string, filters?: {
    type?: SpaceType;
    isActive?: boolean;
    hasFeatures?: string[];
    minCapacity?: number;
    maxCapacity?: number;
  }) {
    try {
      const whereClause: any = { tenantId };

      if (filters?.type) whereClause.type = filters.type;
      if (filters?.isActive !== undefined) whereClause.isActive = filters.isActive;
      if (filters?.minCapacity) whereClause.capacity = { gte: filters.minCapacity };
      if (filters?.maxCapacity) {
        whereClause.capacity = { 
          ...whereClause.capacity, 
          lte: filters.maxCapacity 
        };
      }

      let rooms = await prisma.space.findMany({
        where: whereClause,
        include: {
          features: {
            include: {
              feature: true,
            },
          },
          availability: true,
          usageAnalytics: {
            where: {
              date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
            orderBy: { date: 'desc' },
            take: 30,
          },
          _count: {
            select: {
              bookings: {
                where: {
                  status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
                  endTime: { gt: new Date() },
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Filter by features if specified
      if (filters?.hasFeatures && filters.hasFeatures.length > 0) {
        rooms = rooms.filter(room => 
          filters.hasFeatures!.every(featureId =>
            room.features.some(spaceFeature => spaceFeature.featureId === featureId)
          )
        );
      }

      return rooms;
    } catch (error) {
      logger.error('Failed to get rooms', { tenantId, filters }, error as Error);
      throw error;
    }
  }

  async getRoomById(tenantId: string, spaceId: string) {
    try {
      return await prisma.space.findFirst({
        where: { id: spaceId, tenantId },
        include: {
          features: {
            include: {
              feature: true,
            },
          },
          availability: {
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
          },
          pricingRules: {
            where: { isActive: true },
            orderBy: { priority: 'desc' },
          },
          maintenanceLogs: {
            orderBy: { scheduledAt: 'desc' },
            take: 10,
          },
          usageAnalytics: {
            where: {
              date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
            orderBy: { date: 'desc' },
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get room by ID', { tenantId, spaceId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // ROOM FEATURES MANAGEMENT
  // ============================================================================

  async createRoomFeature(tenantId: string, request: RoomFeatureRequest) {
    try {
      return await prisma.roomFeature.create({
        data: {
          tenantId,
          name: request.name,
          description: request.description,
          category: request.category,
          isActive: true,
        },
      });
    } catch (error) {
      logger.error('Failed to create room feature', { tenantId, request }, error as Error);
      throw error;
    }
  }

  async getRoomFeatures(tenantId: string, category?: FeatureCategory) {
    try {
      const whereClause: any = { tenantId, isActive: true };
      if (category) whereClause.category = category;

      return await prisma.roomFeature.findMany({
        where: whereClause,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });
    } catch (error) {
      logger.error('Failed to get room features', { tenantId, category }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // ROOM AVAILABILITY
  // ============================================================================

  async checkAvailability(tenantId: string, request: RoomAvailabilityRequest): Promise<boolean> {
    try {
      // Check existing bookings
      const conflictingBookings = await prisma.booking.count({
        where: {
          tenantId,
          spaceId: request.spaceId,
          id: { not: request.excludeBookingId },
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
          OR: [
            {
              startTime: { lt: request.endTime },
              endTime: { gt: request.startTime },
            },
          ],
        },
      });

      if (conflictingBookings > 0) {
        return false;
      }

      // Check room availability schedule
      const startDate = new Date(request.startTime);
      const endDate = new Date(request.endTime);
      
      // For now, check if the time slot falls within general availability
      // In a full implementation, this would check specific availability rules
      const dayOfWeek = startDate.getDay();
      const startTimeStr = startDate.toTimeString().substring(0, 5);
      const endTimeStr = endDate.toTimeString().substring(0, 5);

      const availability = await prisma.roomAvailability.findFirst({
        where: {
          tenantId,
          spaceId: request.spaceId,
          dayOfWeek,
          isAvailable: true,
          startTime: { lte: startTimeStr },
          endTime: { gte: endTimeStr },
        },
      });

      return !!availability;
    } catch (error) {
      logger.error('Failed to check availability', { tenantId, request }, error as Error);
      throw error;
    }
  }

  async getAvailableSlots(
    tenantId: string,
    spaceId: string,
    date: Date,
    durationMinutes: number = 60
  ): Promise<{ startTime: Date; endTime: Date }[]> {
    try {
      const dayOfWeek = date.getDay();
      
      // Get availability rules for this day
      const availabilityRules = await prisma.roomAvailability.findMany({
        where: {
          tenantId,
          spaceId,
          dayOfWeek,
          isAvailable: true,
        },
        orderBy: { startTime: 'asc' },
      });

      if (availabilityRules.length === 0) {
        return [];
      }

      // Get existing bookings for this date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const existingBookings = await prisma.booking.findMany({
        where: {
          tenantId,
          spaceId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
          startTime: { gte: startOfDay },
          endTime: { lte: endOfDay },
        },
        orderBy: { startTime: 'asc' },
      });

      const availableSlots: { startTime: Date; endTime: Date }[] = [];

      for (const rule of availabilityRules) {
        const [startHour, startMinute] = rule.startTime.split(':').map(Number);
        const [endHour, endMinute] = rule.endTime.split(':').map(Number);

        const ruleStart = new Date(date);
        ruleStart.setHours(startHour, startMinute, 0, 0);
        
        const ruleEnd = new Date(date);
        ruleEnd.setHours(endHour, endMinute, 0, 0);

        // Generate 30-minute slots within this availability window
        let currentSlotStart = new Date(ruleStart);
        
        while (currentSlotStart.getTime() + durationMinutes * 60000 <= ruleEnd.getTime()) {
          const currentSlotEnd = new Date(currentSlotStart.getTime() + durationMinutes * 60000);

          // Check if this slot conflicts with existing bookings
          const hasConflict = existingBookings.some(booking => 
            (currentSlotStart < booking.endTime && currentSlotEnd > booking.startTime)
          );

          if (!hasConflict) {
            availableSlots.push({
              startTime: new Date(currentSlotStart),
              endTime: new Date(currentSlotEnd),
            });
          }

          // Move to next 30-minute slot
          currentSlotStart = new Date(currentSlotStart.getTime() + 30 * 60000);
        }
      }

      return availableSlots;
    } catch (error) {
      logger.error('Failed to get available slots', { tenantId, spaceId, date }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // DYNAMIC PRICING
  // ============================================================================

  async calculatePrice(tenantId: string, request: DynamicPricingRequest): Promise<number> {
    try {
      const space = await prisma.space.findFirst({
        where: { id: request.spaceId, tenantId },
        include: {
          pricingRules: {
            where: { isActive: true },
            orderBy: { priority: 'desc' },
          },
        },
      });

      if (!space) {
        throw new Error('Space not found');
      }

      let basePrice = space.hourlyRate ? Number(space.hourlyRate) : 0;
      const duration = (request.endTime.getTime() - request.startTime.getTime()) / (1000 * 60 * 60);

      // Apply pricing rules
      for (const rule of space.pricingRules) {
        if (this.doesRuleApply(rule, request)) {
          const ruleBasePrice = rule.basePrice ? Number(rule.basePrice) : basePrice;
          const modifier = Number(rule.priceModifier);

          switch (rule.modifierType) {
            case PriceModifierType.MULTIPLIER:
              basePrice = ruleBasePrice * modifier;
              break;
            case PriceModifierType.ADDITION:
              basePrice = ruleBasePrice + modifier;
              break;
            case PriceModifierType.DISCOUNT:
              basePrice = ruleBasePrice - modifier;
              break;
            case PriceModifierType.REPLACEMENT:
              basePrice = modifier;
              break;
          }
        }
      }

      // Apply capacity-based pricing
      if (request.capacity && request.capacity > space.capacity) {
        throw new Error('Requested capacity exceeds room capacity');
      }

      const totalPrice = basePrice * duration;
      return Math.max(0, totalPrice); // Ensure price is not negative
    } catch (error) {
      logger.error('Failed to calculate price', { tenantId, request }, error as Error);
      throw error;
    }
  }

  private doesRuleApply(rule: any, request: DynamicPricingRequest): boolean {
    // Check validity period
    if (rule.validFrom && request.startTime < rule.validFrom) return false;
    if (rule.validTo && request.startTime > rule.validTo) return false;

    // Check conditions based on rule type
    const conditions = rule.conditions as Record<string, any>;

    switch (rule.ruleType) {
      case PricingRuleType.TIME_BASED:
        return this.checkTimeBasedRule(conditions, request);
      case PricingRuleType.LOCATION_BASED:
        return this.checkLocationBasedRule(conditions, request);
      case PricingRuleType.MEMBER_BASED:
        return this.checkMemberBasedRule(conditions, request);
      default:
        return true;
    }
  }

  private checkTimeBasedRule(conditions: Record<string, any>, request: DynamicPricingRequest): boolean {
    if (conditions.peakHours) {
      const hour = request.startTime.getHours();
      const peakStart = conditions.peakHours.start || 9;
      const peakEnd = conditions.peakHours.end || 17;
      
      if (conditions.peakHours.isPeak) {
        return hour >= peakStart && hour < peakEnd;
      } else {
        return hour < peakStart || hour >= peakEnd;
      }
    }

    if (conditions.weekends) {
      const dayOfWeek = request.startTime.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      return conditions.weekends === isWeekend;
    }

    return true;
  }

  private checkLocationBasedRule(conditions: Record<string, any>, request: DynamicPricingRequest): boolean {
    if (conditions.spaceTypes && conditions.spaceTypes.length > 0) {
      // This would need space type information passed in the request
      return true; // Simplified for now
    }
    return true;
  }

  private checkMemberBasedRule(conditions: Record<string, any>, request: DynamicPricingRequest): boolean {
    // This would need membership information passed in the request
    return true; // Simplified for now
  }

  async createPricingRule(tenantId: string, request: PricingRuleRequest) {
    try {
      return await prisma.roomPricingRule.create({
        data: {
          tenantId,
          spaceId: request.spaceId,
          name: request.name,
          description: request.description,
          ruleType: request.ruleType,
          conditions: request.conditions,
          basePrice: request.basePrice,
          priceModifier: request.priceModifier,
          modifierType: request.modifierType,
          priority: request.priority || 1,
          validFrom: request.validFrom,
          validTo: request.validTo,
          isActive: true,
        },
      });
    } catch (error) {
      logger.error('Failed to create pricing rule', { tenantId, request }, error as Error);
      throw error;
    }
  }

  async getPricingRules(tenantId: string, spaceId?: string) {
    try {
      const whereClause: any = { tenantId, isActive: true };
      if (spaceId) whereClause.spaceId = spaceId;

      return await prisma.roomPricingRule.findMany({
        where: whereClause,
        include: {
          space: true,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });
    } catch (error) {
      logger.error('Failed to get pricing rules', { tenantId, spaceId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // ROOM ANALYTICS
  // ============================================================================

  async getRoomAnalytics(tenantId: string, request: RoomAnalyticsRequest) {
    try {
      const whereClause: any = {
        tenantId,
        date: {
          gte: request.startDate,
          lte: request.endDate,
        },
      };

      if (request.spaceId) {
        whereClause.spaceId = request.spaceId;
      }

      const analytics = await prisma.roomUsageAnalytics.findMany({
        where: whereClause,
        include: {
          space: true,
        },
        orderBy: { date: 'asc' },
      });

      // Aggregate data based on granularity
      if (request.granularity === 'weekly' || request.granularity === 'monthly') {
        return this.aggregateAnalytics(analytics, request.granularity);
      }

      return analytics;
    } catch (error) {
      logger.error('Failed to get room analytics', { tenantId, request }, error as Error);
      throw error;
    }
  }

  private aggregateAnalytics(analytics: any[], granularity: 'weekly' | 'monthly') {
    const grouped = new Map();

    analytics.forEach(record => {
      let key: string;
      const date = new Date(record.date);

      if (granularity === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }

      if (!grouped.has(key)) {
        grouped.set(key, {
          period: key,
          spaceId: record.spaceId,
          space: record.space,
          totalBookings: 0,
          totalHours: 0,
          revenue: 0,
          noShowCount: 0,
          records: [],
        });
      }

      const group = grouped.get(key);
      group.totalBookings += record.totalBookings;
      group.totalHours += Number(record.totalHours);
      group.revenue += Number(record.revenue);
      group.noShowCount += record.noShowCount;
      group.records.push(record);
    });

    return Array.from(grouped.values()).map(group => ({
      ...group,
      utilizationRate: group.records.length > 0 
        ? group.records.reduce((sum: number, r: any) => sum + Number(r.utilizationRate), 0) / group.records.length
        : 0,
      averageRating: group.records.length > 0
        ? group.records.reduce((sum: number, r: any) => sum + (Number(r.averageRating) || 0), 0) / group.records.length
        : null,
    }));
  }
}

export const roomManagementService = new RoomManagementService();