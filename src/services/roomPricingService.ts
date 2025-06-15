import { prisma } from '../lib/prisma';
import { SpaceType } from '@prisma/client';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

export interface PricingRule {
  id?: string;
  name: string;
  type: 'PEAK_HOURS' | 'OFF_PEAK' | 'WEEKEND' | 'HOLIDAY' | 'DURATION' | 'CAPACITY' | 'AMENITY';
  spaceTypes?: SpaceType[];
  spaceIds?: string[];
  conditions: PricingConditions;
  modifier: PricingModifier;
  priority: number;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
}

export interface PricingConditions {
  // Time-based conditions
  dayOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  timeOfDay?: {
    start: string; // HH:mm format
    end: string;
  };
  
  // Duration-based conditions
  minDuration?: number; // in hours
  maxDuration?: number;
  
  // Capacity-based conditions
  minCapacity?: number;
  maxCapacity?: number;
  
  // Amenity-based conditions
  requiredAmenities?: string[];
  
  // Date-based conditions
  specificDates?: Date[];
  dateRanges?: Array<{
    start: Date;
    end: Date;
  }>;
}

export interface PricingModifier {
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED_RATE';
  value: number;
  operation: 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'REPLACE';
}

export interface PricingCalculation {
  baseRate: number;
  appliedRules: Array<{
    rule: PricingRule;
    adjustment: number;
    description: string;
  }>;
  finalRate: number;
  totalCost: number;
  duration: number;
}

export interface RoomPricingRequest {
  spaceId: string;
  startTime: Date;
  endTime: Date;
  attendeeCount?: number;
  requiredAmenities?: string[];
}

export class RoomPricingService {
  /**
   * Calculate pricing for a room booking
   */
  async calculateBookingPrice(
    tenantId: string,
    request: RoomPricingRequest
  ): Promise<PricingCalculation> {
    try {
      // Get space details
      const space = await prisma.space.findFirst({
        where: {
          id: request.spaceId,
          tenantId,
          isActive: true
        }
      });

      if (!space) {
        throw new ValidationError('Space not found or inactive');
      }

      // Calculate duration
      const durationMs = request.endTime.getTime() - request.startTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      if (durationHours <= 0) {
        throw new ValidationError('Invalid booking duration');
      }

      // Get base rate
      const baseRate = space.hourlyRate ? parseFloat(space.hourlyRate.toString()) : 0;

      // Get applicable pricing rules
      const applicableRules = await this.getApplicablePricingRules(
        tenantId,
        space,
        request
      );

      // Apply pricing rules
      let finalRate = baseRate;
      const appliedRules: Array<{
        rule: PricingRule;
        adjustment: number;
        description: string;
      }> = [];

      // Sort rules by priority (higher priority first)
      applicableRules.sort((a, b) => b.priority - a.priority);

      for (const rule of applicableRules) {
        const { adjustment, description } = this.applyPricingRule(finalRate, rule);
        
        if (adjustment !== 0) {
          appliedRules.push({
            rule,
            adjustment,
            description
          });

          // Apply the adjustment based on the modifier operation
          switch (rule.modifier.operation) {
            case 'ADD':
              finalRate += adjustment;
              break;
            case 'SUBTRACT':
              finalRate -= adjustment;
              break;
            case 'MULTIPLY':
              finalRate *= (1 + adjustment / 100); // Assuming percentage
              break;
            case 'REPLACE':
              finalRate = adjustment;
              break;
          }
        }
      }

      // Ensure final rate is not negative
      finalRate = Math.max(0, finalRate);

      // Calculate total cost
      const totalCost = finalRate * durationHours;

      const calculation: PricingCalculation = {
        baseRate,
        appliedRules,
        finalRate,
        totalCost,
        duration: durationHours
      };

      logger.info('Pricing calculated', {
        tenantId,
        spaceId: request.spaceId,
        baseRate,
        finalRate,
        totalCost,
        rulesApplied: appliedRules.length
      });

      return calculation;
    } catch (error) {
      logger.error('Failed to calculate booking price', {
        tenantId,
        request,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Create a new pricing rule
   */
  async createPricingRule(
    tenantId: string,
    rule: Omit<PricingRule, 'id'>
  ): Promise<PricingRule> {
    try {
      // Validate rule
      this.validatePricingRule(rule);

      // Create rule in database (simplified - would need proper schema)
      const createdRule: PricingRule = {
        id: this.generateRuleId(),
        ...rule
      };

      // Store in cache or database
      await this.storePricingRule(tenantId, createdRule);

      logger.info('Pricing rule created', {
        tenantId,
        ruleId: createdRule.id,
        ruleName: createdRule.name,
        type: createdRule.type
      });

      return createdRule;
    } catch (error) {
      logger.error('Failed to create pricing rule', {
        tenantId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get all pricing rules for a tenant
   */
  async getPricingRules(tenantId: string): Promise<PricingRule[]> {
    try {
      // For now, return default rules - would be fetched from database
      return this.getDefaultPricingRules();
    } catch (error) {
      logger.error('Failed to get pricing rules', {
        tenantId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Update a pricing rule
   */
  async updatePricingRule(
    tenantId: string,
    ruleId: string,
    updates: Partial<PricingRule>
  ): Promise<PricingRule> {
    try {
      // Get existing rule
      const existingRule = await this.getPricingRuleById(tenantId, ruleId);
      if (!existingRule) {
        throw new ValidationError('Pricing rule not found');
      }

      // Merge updates
      const updatedRule: PricingRule = {
        ...existingRule,
        ...updates,
        id: ruleId // Ensure ID doesn't change
      };

      // Validate updated rule
      this.validatePricingRule(updatedRule);

      // Store updated rule
      await this.storePricingRule(tenantId, updatedRule);

      logger.info('Pricing rule updated', {
        tenantId,
        ruleId,
        updatedFields: Object.keys(updates)
      });

      return updatedRule;
    } catch (error) {
      logger.error('Failed to update pricing rule', {
        tenantId,
        ruleId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Delete a pricing rule
   */
  async deletePricingRule(tenantId: string, ruleId: string): Promise<void> {
    try {
      const rule = await this.getPricingRuleById(tenantId, ruleId);
      if (!rule) {
        throw new ValidationError('Pricing rule not found');
      }

      // Mark as inactive instead of deleting
      await this.updatePricingRule(tenantId, ruleId, { isActive: false });

      logger.info('Pricing rule deleted', {
        tenantId,
        ruleId
      });
    } catch (error) {
      logger.error('Failed to delete pricing rule', {
        tenantId,
        ruleId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get pricing estimates for different time slots
   */
  async getPricingEstimates(
    tenantId: string,
    spaceId: string,
    date: Date,
    duration: number = 1 // hours
  ): Promise<Array<{
    timeSlot: string;
    rate: number;
    cost: number;
    availability: 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE';
  }>> {
    try {
      const estimates: Array<{
        timeSlot: string;
        rate: number;
        cost: number;
        availability: 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE';
      }> = [];

      // Generate time slots for business hours (8 AM to 8 PM)
      for (let hour = 8; hour < 20; hour++) {
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(hour + duration);

        // Skip if end time goes beyond business hours
        if (endTime.getHours() > 20) {
          continue;
        }

        const timeSlot = `${hour.toString().padStart(2, '0')}:00-${(hour + duration).toString().padStart(2, '0')}:00`;

        try {
          // Calculate pricing for this slot
          const pricing = await this.calculateBookingPrice(tenantId, {
            spaceId,
            startTime,
            endTime
          });

          // Check availability (simplified)
          const existingBooking = await prisma.booking.findFirst({
            where: {
              spaceId,
              tenantId,
              status: { in: ['PENDING', 'CONFIRMED'] },
              OR: [
                {
                  startTime: { gte: startTime, lt: endTime }
                },
                {
                  endTime: { gt: startTime, lte: endTime }
                },
                {
                  AND: [
                    { startTime: { lte: startTime } },
                    { endTime: { gte: endTime } }
                  ]
                }
              ]
            }
          });

          const availability = existingBooking ? 'BOOKED' : 'AVAILABLE';

          estimates.push({
            timeSlot,
            rate: pricing.finalRate,
            cost: pricing.totalCost,
            availability
          });
        } catch (error) {
          // If pricing calculation fails, mark as unavailable
          estimates.push({
            timeSlot,
            rate: 0,
            cost: 0,
            availability: 'UNAVAILABLE'
          });
        }
      }

      return estimates;
    } catch (error) {
      logger.error('Failed to get pricing estimates', {
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
  private async getApplicablePricingRules(
    tenantId: string,
    space: any,
    request: RoomPricingRequest
  ): Promise<PricingRule[]> {
    const allRules = await this.getPricingRules(tenantId);
    const applicableRules: PricingRule[] = [];

    for (const rule of allRules) {
      if (!rule.isActive) continue;

      // Check if rule applies to this space
      if (rule.spaceIds && !rule.spaceIds.includes(space.id)) continue;
      if (rule.spaceTypes && !rule.spaceTypes.includes(space.type)) continue;

      // Check time-based conditions
      if (!this.checkTimeConditions(rule.conditions, request.startTime, request.endTime)) {
        continue;
      }

      // Check duration conditions
      const duration = (request.endTime.getTime() - request.startTime.getTime()) / (1000 * 60 * 60);
      if (!this.checkDurationConditions(rule.conditions, duration)) {
        continue;
      }

      // Check capacity conditions
      if (!this.checkCapacityConditions(rule.conditions, space.capacity)) {
        continue;
      }

      // Check date validity
      if (!this.checkDateValidity(rule, request.startTime)) {
        continue;
      }

      applicableRules.push(rule);
    }

    return applicableRules;
  }

  private checkTimeConditions(
    conditions: PricingConditions,
    startTime: Date,
    endTime: Date
  ): boolean {
    // Check day of week
    if (conditions.dayOfWeek) {
      const dayOfWeek = startTime.getDay();
      if (!conditions.dayOfWeek.includes(dayOfWeek)) {
        return false;
      }
    }

    // Check time of day
    if (conditions.timeOfDay) {
      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();
      const endHour = endTime.getHours();
      const endMinute = endTime.getMinutes();

      const [conditionStartHour, conditionStartMinute] = conditions.timeOfDay.start.split(':').map(Number);
      const [conditionEndHour, conditionEndMinute] = conditions.timeOfDay.end.split(':').map(Number);

      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;
      const conditionStartMinutes = conditionStartHour * 60 + conditionStartMinute;
      const conditionEndMinutes = conditionEndHour * 60 + conditionEndMinute;

      if (startTimeMinutes < conditionStartMinutes || endTimeMinutes > conditionEndMinutes) {
        return false;
      }
    }

    return true;
  }

  private checkDurationConditions(conditions: PricingConditions, duration: number): boolean {
    if (conditions.minDuration && duration < conditions.minDuration) {
      return false;
    }
    if (conditions.maxDuration && duration > conditions.maxDuration) {
      return false;
    }
    return true;
  }

  private checkCapacityConditions(conditions: PricingConditions, capacity: number): boolean {
    if (conditions.minCapacity && capacity < conditions.minCapacity) {
      return false;
    }
    if (conditions.maxCapacity && capacity > conditions.maxCapacity) {
      return false;
    }
    return true;
  }

  private checkDateValidity(rule: PricingRule, date: Date): boolean {
    if (rule.validFrom && date < rule.validFrom) {
      return false;
    }
    if (rule.validTo && date > rule.validTo) {
      return false;
    }
    return true;
  }

  private applyPricingRule(
    currentRate: number,
    rule: PricingRule
  ): { adjustment: number; description: string } {
    let adjustment = 0;
    let description = '';

    switch (rule.modifier.type) {
      case 'PERCENTAGE':
        adjustment = (currentRate * rule.modifier.value) / 100;
        description = `${rule.name}: ${rule.modifier.value}% adjustment`;
        break;
      
      case 'FIXED_AMOUNT':
        adjustment = rule.modifier.value;
        description = `${rule.name}: $${rule.modifier.value} adjustment`;
        break;
      
      case 'FIXED_RATE':
        adjustment = rule.modifier.value;
        description = `${rule.name}: Fixed rate $${rule.modifier.value}/hour`;
        break;
    }

    return { adjustment, description };
  }

  private validatePricingRule(rule: Omit<PricingRule, 'id'>): void {
    if (!rule.name || rule.name.trim().length === 0) {
      throw new ValidationError('Rule name is required');
    }

    if (rule.priority < 0 || rule.priority > 100) {
      throw new ValidationError('Priority must be between 0 and 100');
    }

    if (rule.modifier.value < 0) {
      throw new ValidationError('Modifier value cannot be negative');
    }
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private async storePricingRule(tenantId: string, rule: PricingRule): Promise<void> {
    // In a real implementation, this would store in database
    // For now, we'll just log it
    logger.debug('Storing pricing rule', { tenantId, ruleId: rule.id, rule });
  }

  private async getPricingRuleById(tenantId: string, ruleId: string): Promise<PricingRule | null> {
    // In a real implementation, this would fetch from database
    const rules = await this.getPricingRules(tenantId);
    return rules.find(rule => rule.id === ruleId) || null;
  }

  private getDefaultPricingRules(): PricingRule[] {
    return [
      {
        id: 'peak_hours',
        name: 'Peak Hours Premium',
        type: 'PEAK_HOURS',
        conditions: {
          dayOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
          timeOfDay: {
            start: '09:00',
            end: '17:00'
          }
        },
        modifier: {
          type: 'PERCENTAGE',
          value: 25,
          operation: 'ADD'
        },
        priority: 80,
        isActive: true
      },
      {
        id: 'weekend_discount',
        name: 'Weekend Discount',
        type: 'WEEKEND',
        conditions: {
          dayOfWeek: [0, 6] // Saturday and Sunday
        },
        modifier: {
          type: 'PERCENTAGE',
          value: 15,
          operation: 'SUBTRACT'
        },
        priority: 70,
        isActive: true
      },
      {
        id: 'long_booking_discount',
        name: 'Long Booking Discount',
        type: 'DURATION',
        conditions: {
          minDuration: 4 // 4 hours or more
        },
        modifier: {
          type: 'PERCENTAGE',
          value: 10,
          operation: 'SUBTRACT'
        },
        priority: 60,
        isActive: true
      },
      {
        id: 'large_room_premium',
        name: 'Large Room Premium',
        type: 'CAPACITY',
        conditions: {
          minCapacity: 20
        },
        modifier: {
          type: 'PERCENTAGE',
          value: 20,
          operation: 'ADD'
        },
        priority: 50,
        isActive: true
      }
    ];
  }
}

export const roomPricingService = new RoomPricingService();