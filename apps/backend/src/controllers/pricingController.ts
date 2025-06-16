import { Response } from 'express';
import { z } from 'zod';
import { pricingService } from '../services/pricingService';
import { handleController } from '../utils/response';
import { BaseRequest, ErrorCode } from '../types/api';

// Pricing tier schemas
const createPricingTierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  level: z.number().int().min(1, 'Level must be at least 1'),
  features: z.array(z.string()),
  restrictions: z.record(z.any()).default({}),
  isActive: z.boolean().optional().default(true),
});

const updatePricingTierSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  level: z.number().int().min(1).optional(),
  features: z.array(z.string()).optional(),
  restrictions: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

// Pricing rule schemas
const createPricingRuleSchema = z.object({
  tierId: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  ruleType: z.enum(['TIME_BASED', 'USAGE_BASED', 'MEMBER_BASED', 'LOCATION_BASED', 'SEASONAL', 'PROMOTIONAL']),
  spaceType: z.enum(['MEETING_ROOM', 'CONFERENCE_ROOM', 'PHONE_BOOTH', 'EVENT_SPACE', 'COMMON_AREA', 'KITCHEN', 'LOUNGE']).optional(),
  planType: z.enum(['HOT_DESK', 'DEDICATED_DESK', 'PRIVATE_OFFICE', 'MEETING_ROOM', 'VIRTUAL_OFFICE', 'CUSTOM']).optional(),
  timeSlots: z.array(z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    days: z.array(z.number().int().min(0).max(6)),
  })).optional(),
  conditions: z.record(z.any()).default({}),
  basePrice: z.number().min(0, 'Base price must be positive'),
  modifier: z.number().min(0, 'Modifier must be positive'),
  modifierType: z.enum(['MULTIPLIER', 'ADDITION', 'DISCOUNT', 'REPLACEMENT']).default('MULTIPLIER'),
  isActive: z.boolean().optional().default(true),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
});

const updatePricingRuleSchema = createPricingRuleSchema.partial().omit({ tierId: true });

// Price calculation schema
const priceCalculationSchema = z.object({
  planType: z.enum(['HOT_DESK', 'DEDICATED_DESK', 'PRIVATE_OFFICE', 'MEETING_ROOM', 'VIRTUAL_OFFICE', 'CUSTOM']),
  spaceType: z.enum(['MEETING_ROOM', 'CONFERENCE_ROOM', 'PHONE_BOOTH', 'EVENT_SPACE', 'COMMON_AREA', 'KITCHEN', 'LOUNGE']).optional(),
  billingCycle: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  pricingTierId: z.string().optional(),
  quantity: z.number().int().min(1).optional().default(1),
  duration: z.number().int().min(1).optional().default(1),
  discountCode: z.string().optional(),
  timeSlot: z.object({
    start: z.string(),
    end: z.string(),
    days: z.array(z.number().int().min(0).max(6)),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

// Bulk price update schema
const bulkPriceUpdateSchema = z.object({
  updates: z.array(z.object({
    planId: z.string(),
    tierId: z.string(),
    basePrice: z.number().min(0),
  })).min(1, 'At least one update is required'),
});

class PricingController {
  // POST /api/pricing/tiers
  async createPricingTier(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const data = createPricingTierSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const tier = await pricingService.createPricingTier(tenantId, data);
      return tier;
    }, res, 201);
  }

  // GET /api/pricing/tiers
  async getPricingTiers(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const includeInactive = req.query.includeInactive === 'true';
      const tenantId = req.user.tenantId;
      
      const tiers = await pricingService.getPricingTiers(tenantId, includeInactive);
      return tiers;
    }, res);
  }

  // GET /api/pricing/tiers/:id
  async getPricingTierById(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const tier = await pricingService.getPricingTierById(tenantId, id);
      return tier;
    }, res);
  }

  // PUT /api/pricing/tiers/:id
  async updatePricingTier(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const { id } = req.params;
      const data = updatePricingTierSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const tier = await pricingService.updatePricingTier(tenantId, id, data);
      return tier;
    }, res);
  }

  // DELETE /api/pricing/tiers/:id
  async deletePricingTier(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const result = await pricingService.deletePricingTier(tenantId, id);
      return result;
    }, res);
  }

  // POST /api/pricing/rules
  async createPricingRule(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const data = createPricingRuleSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const rule = await pricingService.createPricingRule(tenantId, data);
      return rule;
    }, res, 201);
  }

  // GET /api/pricing/rules
  async getPricingRules(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const tierId = req.query.tierId as string;
      const tenantId = req.user.tenantId;
      
      const rules = await pricingService.getPricingRules(tenantId, tierId);
      return rules;
    }, res);
  }

  // PUT /api/pricing/rules/:id
  async updatePricingRule(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const { id } = req.params;
      const data = updatePricingRuleSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const rule = await pricingService.updatePricingRule(tenantId, id, data);
      return rule;
    }, res);
  }

  // DELETE /api/pricing/rules/:id
  async deletePricingRule(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const result = await pricingService.deletePricingRule(tenantId, id);
      return result;
    }, res);
  }

  // POST /api/pricing/calculate
  async calculatePrice(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const data = priceCalculationSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const calculation = await pricingService.calculatePrice(tenantId, data);
      return calculation;
    }, res);
  }

  // GET /api/pricing/plans
  async getPlansWithPricing(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const pricingTierId = req.query.pricingTierId as string;
      const tenantId = req.user.tenantId;
      
      const plans = await pricingService.getPlansWithPricing(tenantId, pricingTierId);
      return plans;
    }, res);
  }

  // POST /api/pricing/bulk-update
  async bulkUpdatePrices(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const data = bulkPriceUpdateSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const result = await pricingService.bulkUpdatePrices(tenantId, data.updates);
      return result;
    }, res);
  }

  // GET /api/pricing/preview/:planType
  async getPreviewPricing(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const { planType } = req.params;
      const query = z.object({
        billingCycle: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional().default('MONTHLY'),
        pricingTierId: z.string().optional(),
        quantity: z.string().transform(Number).optional().default('1'),
        duration: z.string().transform(Number).optional().default('1'),
      }).parse(req.query);
      
      const tenantId = req.user.tenantId;
      
      // Validate plan type
      const validPlanTypes = ['HOT_DESK', 'DEDICATED_DESK', 'PRIVATE_OFFICE', 'MEETING_ROOM', 'VIRTUAL_OFFICE', 'CUSTOM'];
      if (!validPlanTypes.includes(planType)) {
        throw new Error(ErrorCode.INVALID_INPUT);
      }
      
      const calculation = await pricingService.calculatePrice(tenantId, {
        planType: planType as any,
        billingCycle: query.billingCycle,
        pricingTierId: query.pricingTierId,
        quantity: query.quantity,
        duration: query.duration,
      });
      
      return calculation;
    }, res);
  }

  // GET /api/pricing/tiers/:tierId/rules
  async getRulesByTier(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const { tierId } = req.params;
      const tenantId = req.user.tenantId;
      
      const rules = await pricingService.getPricingRules(tenantId, tierId);
      return rules;
    }, res);
  }

  // POST /api/pricing/rules/validate
  async validatePricingRule(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const data = createPricingRuleSchema.parse(req.body);
      
      // Validate the rule structure and logic
      const validation = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[],
      };

      // Check for conflicting time slots
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

      // Check modifier logic
      if (data.modifierType === 'MULTIPLIER' && data.modifier < 0) {
        validation.errors.push('Multiplier cannot be negative');
        validation.isValid = false;
      }

      if (data.modifierType === 'REPLACEMENT' && data.modifier < 0) {
        validation.errors.push('Replacement price cannot be negative');
        validation.isValid = false;
      }

      // Check date range
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

  private timeRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const parseTime = (time: string): number => {
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

export const pricingController = new PricingController();