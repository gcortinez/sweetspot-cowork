"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricingController = void 0;
const zod_1 = require("zod");
const pricingService_1 = require("../services/pricingService");
const response_1 = require("../utils/response");
const createPricingTierSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
    level: zod_1.z.number().int().min(1, 'Level must be at least 1'),
    features: zod_1.z.array(zod_1.z.string()),
    restrictions: zod_1.z.record(zod_1.z.any()).default({}),
    isActive: zod_1.z.boolean().optional().default(true),
});
const updatePricingTierSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    level: zod_1.z.number().int().min(1).optional(),
    features: zod_1.z.array(zod_1.z.string()).optional(),
    restrictions: zod_1.z.record(zod_1.z.any()).optional(),
    isActive: zod_1.z.boolean().optional(),
});
const createPricingRuleSchema = zod_1.z.object({
    tierId: zod_1.z.string(),
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
    ruleType: zod_1.z.enum(['TIME_BASED', 'VOLUME_BASED', 'DURATION_BASED', 'SPACE_BASED', 'SEASONAL', 'MEMBERSHIP', 'DYNAMIC']),
    spaceType: zod_1.z.enum(['HOT_DESK', 'DEDICATED_DESK', 'PRIVATE_OFFICE', 'MEETING_ROOM', 'PHONE_BOOTH', 'LOUNGE', 'KITCHEN', 'CONFERENCE_ROOM', 'EVENT_SPACE']).optional(),
    planType: zod_1.z.enum(['HOT_DESK', 'DEDICATED_DESK', 'PRIVATE_OFFICE', 'MEETING_ROOM', 'VIRTUAL_OFFICE', 'CUSTOM']).optional(),
    timeSlots: zod_1.z.array(zod_1.z.object({
        start: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
        end: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
        days: zod_1.z.array(zod_1.z.number().int().min(0).max(6)),
    })).optional(),
    conditions: zod_1.z.record(zod_1.z.any()).default({}),
    basePrice: zod_1.z.number().min(0, 'Base price must be positive'),
    modifier: zod_1.z.number().min(0, 'Modifier must be positive'),
    modifierType: zod_1.z.enum(['MULTIPLIER', 'FIXED_AMOUNT', 'REPLACEMENT']).default('MULTIPLIER'),
    isActive: zod_1.z.boolean().optional().default(true),
    validFrom: zod_1.z.string().datetime().optional(),
    validTo: zod_1.z.string().datetime().optional(),
});
const updatePricingRuleSchema = createPricingRuleSchema.partial().omit({ tierId: true });
const priceCalculationSchema = zod_1.z.object({
    planType: zod_1.z.enum(['HOT_DESK', 'DEDICATED_DESK', 'PRIVATE_OFFICE', 'MEETING_ROOM', 'VIRTUAL_OFFICE', 'CUSTOM']),
    spaceType: zod_1.z.enum(['HOT_DESK', 'DEDICATED_DESK', 'PRIVATE_OFFICE', 'MEETING_ROOM', 'PHONE_BOOTH', 'LOUNGE', 'KITCHEN', 'CONFERENCE_ROOM', 'EVENT_SPACE']).optional(),
    billingCycle: zod_1.z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
    pricingTierId: zod_1.z.string().optional(),
    quantity: zod_1.z.number().int().min(1).optional().default(1),
    duration: zod_1.z.number().int().min(1).optional().default(1),
    discountCode: zod_1.z.string().optional(),
    timeSlot: zod_1.z.object({
        start: zod_1.z.string(),
        end: zod_1.z.string(),
        days: zod_1.z.array(zod_1.z.number().int().min(0).max(6)),
    }).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
const bulkPriceUpdateSchema = zod_1.z.object({
    updates: zod_1.z.array(zod_1.z.object({
        planId: zod_1.z.string(),
        tierId: zod_1.z.string(),
        basePrice: zod_1.z.number().min(0),
    })).min(1, 'At least one update is required'),
});
class PricingController {
    async createPricingTier(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = createPricingTierSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const tier = await pricingService_1.pricingService.createPricingTier(tenantId, data);
            return tier;
        }, res, 201);
    }
    async getPricingTiers(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const includeInactive = req.query.includeInactive === 'true';
            const tenantId = req.user.tenantId;
            const tiers = await pricingService_1.pricingService.getPricingTiers(tenantId, includeInactive);
            return tiers;
        }, res);
    }
    async getPricingTierById(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const tier = await pricingService_1.pricingService.getPricingTierById(tenantId, id);
            return tier;
        }, res);
    }
    async updatePricingTier(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const data = updatePricingTierSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const tier = await pricingService_1.pricingService.updatePricingTier(tenantId, id, data);
            return tier;
        }, res);
    }
    async deletePricingTier(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const result = await pricingService_1.pricingService.deletePricingTier(tenantId, id);
            return result;
        }, res);
    }
    async createPricingRule(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = createPricingRuleSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const rule = await pricingService_1.pricingService.createPricingRule(tenantId, data);
            return rule;
        }, res, 201);
    }
    async getPricingRules(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const tierId = req.query.tierId;
            const tenantId = req.user.tenantId;
            const rules = await pricingService_1.pricingService.getPricingRules(tenantId, tierId);
            return rules;
        }, res);
    }
    async updatePricingRule(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const data = updatePricingRuleSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const rule = await pricingService_1.pricingService.updatePricingRule(tenantId, id, data);
            return rule;
        }, res);
    }
    async deletePricingRule(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const result = await pricingService_1.pricingService.deletePricingRule(tenantId, id);
            return result;
        }, res);
    }
    async calculatePrice(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = priceCalculationSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const calculation = await pricingService_1.pricingService.calculatePrice(tenantId, data);
            return calculation;
        }, res);
    }
    async getPlansWithPricing(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const pricingTierId = req.query.pricingTierId;
            const tenantId = req.user.tenantId;
            const plans = await pricingService_1.pricingService.getPlansWithPricing(tenantId, pricingTierId);
            return plans;
        }, res);
    }
    async bulkUpdatePrices(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = bulkPriceUpdateSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const result = await pricingService_1.pricingService.bulkUpdatePrices(tenantId, data.updates);
            return result;
        }, res);
    }
    async getPreviewPricing(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { planType } = req.params;
            const query = zod_1.z.object({
                billingCycle: zod_1.z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional().default('MONTHLY'),
                pricingTierId: zod_1.z.string().optional(),
                quantity: zod_1.z.string().transform(Number).optional().default('1'),
                duration: zod_1.z.string().transform(Number).optional().default('1'),
            }).parse(req.query);
            const tenantId = req.user.tenantId;
            const validPlanTypes = ['HOT_DESK', 'DEDICATED_DESK', 'PRIVATE_OFFICE', 'MEETING_ROOM', 'VIRTUAL_OFFICE', 'CUSTOM'];
            if (!validPlanTypes.includes(planType)) {
                throw new Error('Invalid plan type');
            }
            const calculation = await pricingService_1.pricingService.calculatePrice(tenantId, {
                planType: planType,
                billingCycle: query.billingCycle,
                pricingTierId: query.pricingTierId,
                quantity: query.quantity,
                duration: query.duration,
            });
            return calculation;
        }, res);
    }
    async getRulesByTier(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { tierId } = req.params;
            const tenantId = req.user.tenantId;
            const rules = await pricingService_1.pricingService.getPricingRules(tenantId, tierId);
            return rules;
        }, res);
    }
    async validatePricingRule(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = createPricingRuleSchema.parse(req.body);
            const validation = {
                isValid: true,
                errors: [],
                warnings: [],
            };
            if (data.timeSlots && data.timeSlots.length > 1) {
                for (let i = 0; i < data.timeSlots.length - 1; i++) {
                    for (let j = i + 1; j < data.timeSlots.length; j++) {
                        const slot1 = data.timeSlots[i];
                        const slot2 = data.timeSlots[j];
                        const dayOverlap = slot1.days.some(day => slot2.days.includes(day));
                        if (dayOverlap) {
                            const timeOverlap = this.timeRangesOverlap(slot1.start, slot1.end, slot2.start, slot2.end);
                            if (timeOverlap) {
                                validation.warnings.push(`Time slots ${i + 1} and ${j + 1} have overlapping times`);
                            }
                        }
                    }
                }
            }
            if (data.modifierType === 'MULTIPLIER' && data.modifier < 0) {
                validation.errors.push('Multiplier cannot be negative');
                validation.isValid = false;
            }
            if (data.modifierType === 'REPLACEMENT' && data.modifier < 0) {
                validation.errors.push('Replacement price cannot be negative');
                validation.isValid = false;
            }
            if (data.validFrom && data.validTo) {
                const from = new Date(data.validFrom);
                const to = new Date(data.validTo);
                if (from >= to) {
                    validation.errors.push('Valid from date must be before valid to date');
                    validation.isValid = false;
                }
            }
            return validation;
        }, res);
    }
    timeRangesOverlap(start1, end1, start2, end2) {
        const parseTime = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };
        const start1Minutes = parseTime(start1);
        const end1Minutes = parseTime(end1);
        const start2Minutes = parseTime(start2);
        const end2Minutes = parseTime(end2);
        return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
    }
}
exports.pricingController = new PricingController();
//# sourceMappingURL=pricingController.js.map