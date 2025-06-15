"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomPricingService = exports.RoomPricingService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class RoomPricingService {
    async calculateBookingPrice(tenantId, request) {
        try {
            const space = await prisma_1.prisma.space.findFirst({
                where: {
                    id: request.spaceId,
                    tenantId,
                    isActive: true
                }
            });
            if (!space) {
                throw new errors_1.ValidationError('Space not found or inactive');
            }
            const durationMs = request.endTime.getTime() - request.startTime.getTime();
            const durationHours = durationMs / (1000 * 60 * 60);
            if (durationHours <= 0) {
                throw new errors_1.ValidationError('Invalid booking duration');
            }
            const baseRate = space.hourlyRate ? parseFloat(space.hourlyRate.toString()) : 0;
            const applicableRules = await this.getApplicablePricingRules(tenantId, space, request);
            let finalRate = baseRate;
            const appliedRules = [];
            applicableRules.sort((a, b) => b.priority - a.priority);
            for (const rule of applicableRules) {
                const { adjustment, description } = this.applyPricingRule(finalRate, rule);
                if (adjustment !== 0) {
                    appliedRules.push({
                        rule,
                        adjustment,
                        description
                    });
                    switch (rule.modifier.operation) {
                        case 'ADD':
                            finalRate += adjustment;
                            break;
                        case 'SUBTRACT':
                            finalRate -= adjustment;
                            break;
                        case 'MULTIPLY':
                            finalRate *= (1 + adjustment / 100);
                            break;
                        case 'REPLACE':
                            finalRate = adjustment;
                            break;
                    }
                }
            }
            finalRate = Math.max(0, finalRate);
            const totalCost = finalRate * durationHours;
            const calculation = {
                baseRate,
                appliedRules,
                finalRate,
                totalCost,
                duration: durationHours
            };
            logger_1.logger.info('Pricing calculated', {
                tenantId,
                spaceId: request.spaceId,
                baseRate,
                finalRate,
                totalCost,
                rulesApplied: appliedRules.length
            });
            return calculation;
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate booking price', {
                tenantId,
                request,
                error: error.message
            });
            throw error;
        }
    }
    async createPricingRule(tenantId, rule) {
        try {
            this.validatePricingRule(rule);
            const createdRule = {
                id: this.generateRuleId(),
                ...rule
            };
            await this.storePricingRule(tenantId, createdRule);
            logger_1.logger.info('Pricing rule created', {
                tenantId,
                ruleId: createdRule.id,
                ruleName: createdRule.name,
                type: createdRule.type
            });
            return createdRule;
        }
        catch (error) {
            logger_1.logger.error('Failed to create pricing rule', {
                tenantId,
                error: error.message
            });
            throw error;
        }
    }
    async getPricingRules(tenantId) {
        try {
            return this.getDefaultPricingRules();
        }
        catch (error) {
            logger_1.logger.error('Failed to get pricing rules', {
                tenantId,
                error: error.message
            });
            throw error;
        }
    }
    async updatePricingRule(tenantId, ruleId, updates) {
        try {
            const existingRule = await this.getPricingRuleById(tenantId, ruleId);
            if (!existingRule) {
                throw new errors_1.ValidationError('Pricing rule not found');
            }
            const updatedRule = {
                ...existingRule,
                ...updates,
                id: ruleId
            };
            this.validatePricingRule(updatedRule);
            await this.storePricingRule(tenantId, updatedRule);
            logger_1.logger.info('Pricing rule updated', {
                tenantId,
                ruleId,
                updatedFields: Object.keys(updates)
            });
            return updatedRule;
        }
        catch (error) {
            logger_1.logger.error('Failed to update pricing rule', {
                tenantId,
                ruleId,
                error: error.message
            });
            throw error;
        }
    }
    async deletePricingRule(tenantId, ruleId) {
        try {
            const rule = await this.getPricingRuleById(tenantId, ruleId);
            if (!rule) {
                throw new errors_1.ValidationError('Pricing rule not found');
            }
            await this.updatePricingRule(tenantId, ruleId, { isActive: false });
            logger_1.logger.info('Pricing rule deleted', {
                tenantId,
                ruleId
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete pricing rule', {
                tenantId,
                ruleId,
                error: error.message
            });
            throw error;
        }
    }
    async getPricingEstimates(tenantId, spaceId, date, duration = 1) {
        try {
            const estimates = [];
            for (let hour = 8; hour < 20; hour++) {
                const startTime = new Date(date);
                startTime.setHours(hour, 0, 0, 0);
                const endTime = new Date(startTime);
                endTime.setHours(hour + duration);
                if (endTime.getHours() > 20) {
                    continue;
                }
                const timeSlot = `${hour.toString().padStart(2, '0')}:00-${(hour + duration).toString().padStart(2, '0')}:00`;
                try {
                    const pricing = await this.calculateBookingPrice(tenantId, {
                        spaceId,
                        startTime,
                        endTime
                    });
                    const existingBooking = await prisma_1.prisma.booking.findFirst({
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
                }
                catch (error) {
                    estimates.push({
                        timeSlot,
                        rate: 0,
                        cost: 0,
                        availability: 'UNAVAILABLE'
                    });
                }
            }
            return estimates;
        }
        catch (error) {
            logger_1.logger.error('Failed to get pricing estimates', {
                tenantId,
                spaceId,
                error: error.message
            });
            throw error;
        }
    }
    async getApplicablePricingRules(tenantId, space, request) {
        const allRules = await this.getPricingRules(tenantId);
        const applicableRules = [];
        for (const rule of allRules) {
            if (!rule.isActive)
                continue;
            if (rule.spaceIds && !rule.spaceIds.includes(space.id))
                continue;
            if (rule.spaceTypes && !rule.spaceTypes.includes(space.type))
                continue;
            if (!this.checkTimeConditions(rule.conditions, request.startTime, request.endTime)) {
                continue;
            }
            const duration = (request.endTime.getTime() - request.startTime.getTime()) / (1000 * 60 * 60);
            if (!this.checkDurationConditions(rule.conditions, duration)) {
                continue;
            }
            if (!this.checkCapacityConditions(rule.conditions, space.capacity)) {
                continue;
            }
            if (!this.checkDateValidity(rule, request.startTime)) {
                continue;
            }
            applicableRules.push(rule);
        }
        return applicableRules;
    }
    checkTimeConditions(conditions, startTime, endTime) {
        if (conditions.dayOfWeek) {
            const dayOfWeek = startTime.getDay();
            if (!conditions.dayOfWeek.includes(dayOfWeek)) {
                return false;
            }
        }
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
    checkDurationConditions(conditions, duration) {
        if (conditions.minDuration && duration < conditions.minDuration) {
            return false;
        }
        if (conditions.maxDuration && duration > conditions.maxDuration) {
            return false;
        }
        return true;
    }
    checkCapacityConditions(conditions, capacity) {
        if (conditions.minCapacity && capacity < conditions.minCapacity) {
            return false;
        }
        if (conditions.maxCapacity && capacity > conditions.maxCapacity) {
            return false;
        }
        return true;
    }
    checkDateValidity(rule, date) {
        if (rule.validFrom && date < rule.validFrom) {
            return false;
        }
        if (rule.validTo && date > rule.validTo) {
            return false;
        }
        return true;
    }
    applyPricingRule(currentRate, rule) {
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
    validatePricingRule(rule) {
        if (!rule.name || rule.name.trim().length === 0) {
            throw new errors_1.ValidationError('Rule name is required');
        }
        if (rule.priority < 0 || rule.priority > 100) {
            throw new errors_1.ValidationError('Priority must be between 0 and 100');
        }
        if (rule.modifier.value < 0) {
            throw new errors_1.ValidationError('Modifier value cannot be negative');
        }
    }
    generateRuleId() {
        return `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    async storePricingRule(tenantId, rule) {
        logger_1.logger.debug('Storing pricing rule', { tenantId, ruleId: rule.id, rule });
    }
    async getPricingRuleById(tenantId, ruleId) {
        const rules = await this.getPricingRules(tenantId);
        return rules.find(rule => rule.id === ruleId) || null;
    }
    getDefaultPricingRules() {
        return [
            {
                id: 'peak_hours',
                name: 'Peak Hours Premium',
                type: 'PEAK_HOURS',
                conditions: {
                    dayOfWeek: [1, 2, 3, 4, 5],
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
                    dayOfWeek: [0, 6]
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
                    minDuration: 4
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
exports.RoomPricingService = RoomPricingService;
exports.roomPricingService = new RoomPricingService();
//# sourceMappingURL=roomPricingService.js.map