import { PrismaClient, PricingTier, PricingRule, Plan, PlanType, SpaceType, BillingCycle, PricingRuleType, ModifierType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';

interface CreatePricingTierData {
  name: string;
  description?: string;
  level: number;
  features: string[];
  restrictions: Record<string, any>;
  isActive?: boolean;
}

interface CreatePricingRuleData {
  tierId: string;
  name: string;
  description?: string;
  ruleType: PricingRuleType;
  spaceType?: SpaceType;
  planType?: PlanType;
  timeSlots?: Array<{
    start: string;
    end: string;
    days: number[];
  }>;
  conditions: Record<string, any>;
  basePrice: number;
  modifier: number;
  modifierType: ModifierType;
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
}

interface PriceCalculationRequest {
  planType: PlanType;
  spaceType?: SpaceType;
  billingCycle: BillingCycle;
  pricingTierId?: string;
  quantity?: number;
  duration?: number; // in months
  discountCode?: string;
  timeSlot?: {
    start: string;
    end: string;
    days: number[];
  };
  metadata?: Record<string, any>;
}

interface PriceCalculationResult {
  basePrice: number;
  adjustments: Array<{
    type: string;
    description: string;
    amount: number;
    percentage?: number;
  }>;
  discounts: Array<{
    type: string;
    description: string;
    amount: number;
  }>;
  subtotal: number;
  taxes: number;
  total: number;
  currency: string;
  breakdown: {
    unitPrice: number;
    quantity: number;
    duration: number;
    adjustedPrice: number;
  };
}

interface PricingTierWithRules extends PricingTier {
  pricingRules: PricingRule[];
  planTiers: Array<{
    plan: Plan;
    basePrice: number;
    features: string[];
  }>;
}

class PricingService {
  async createPricingTier(tenantId: string, data: CreatePricingTierData): Promise<PricingTier> {
    // Check if tier level already exists
    const existingTier = await prisma.pricingTier.findFirst({
      where: { tenantId, level: data.level },
    });

    if (existingTier) {
      throw new ValidationError(`Pricing tier with level ${data.level} already exists`);
    }

    const tier = await prisma.pricingTier.create({
      data: {
        ...data,
        tenantId,
        features: data.features,
        restrictions: data.restrictions,
        isActive: data.isActive ?? true,
      },
    });

    return tier;
  }

  async getPricingTiers(tenantId: string, includeInactive = false): Promise<PricingTierWithRules[]> {
    const where: any = { tenantId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const tiers = await prisma.pricingTier.findMany({
      where,
      include: {
        pricingRules: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        planTiers: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: { level: 'asc' },
    });

    return tiers;
  }

  async getPricingTierById(tenantId: string, tierId: string): Promise<PricingTierWithRules> {
    const tier = await prisma.pricingTier.findFirst({
      where: { id: tierId, tenantId },
      include: {
        pricingRules: {
          orderBy: { createdAt: 'desc' },
        },
        planTiers: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!tier) {
      throw new NotFoundError('Pricing tier not found');
    }

    return tier;
  }

  async updatePricingTier(tenantId: string, tierId: string, data: Partial<CreatePricingTierData>): Promise<PricingTier> {
    const tier = await prisma.pricingTier.findFirst({
      where: { id: tierId, tenantId },
    });

    if (!tier) {
      throw new NotFoundError('Pricing tier not found');
    }

    // Check level uniqueness if updating level
    if (data.level && data.level !== tier.level) {
      const existingTier = await prisma.pricingTier.findFirst({
        where: { tenantId, level: data.level, id: { not: tierId } },
      });

      if (existingTier) {
        throw new ValidationError(`Pricing tier with level ${data.level} already exists`);
      }
    }

    const updatedTier = await prisma.pricingTier.update({
      where: { id: tierId },
      data: {
        ...data,
        features: data.features,
        restrictions: data.restrictions,
      },
    });

    return updatedTier;
  }

  async deletePricingTier(tenantId: string, tierId: string): Promise<{ success: boolean }> {
    const tier = await prisma.pricingTier.findFirst({
      where: { id: tierId, tenantId },
      include: {
        pricingRules: true,
        planTiers: true,
      },
    });

    if (!tier) {
      throw new NotFoundError('Pricing tier not found');
    }

    if (tier.pricingRules.length > 0 || tier.planTiers.length > 0) {
      throw new ValidationError('Cannot delete pricing tier with associated rules or plans');
    }

    await prisma.pricingTier.delete({
      where: { id: tierId },
    });

    return { success: true };
  }

  async createPricingRule(tenantId: string, data: CreatePricingRuleData): Promise<PricingRule> {
    // Validate tier exists
    const tier = await prisma.pricingTier.findFirst({
      where: { id: data.tierId, tenantId },
    });

    if (!tier) {
      throw new NotFoundError('Pricing tier not found');
    }

    const rule = await prisma.pricingRule.create({
      data: {
        ...data,
        tenantId,
        timeSlots: data.timeSlots || [],
        conditions: data.conditions,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validTo: data.validTo ? new Date(data.validTo) : undefined,
        isActive: data.isActive ?? true,
      },
      include: {
        tier: true,
      },
    });

    return rule;
  }

  async getPricingRules(tenantId: string, tierId?: string): Promise<PricingRule[]> {
    const where: any = { tenantId };
    if (tierId) {
      where.tierId = tierId;
    }

    const rules = await prisma.pricingRule.findMany({
      where,
      include: {
        tier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rules;
  }

  async updatePricingRule(tenantId: string, ruleId: string, data: Partial<CreatePricingRuleData>): Promise<PricingRule> {
    const rule = await prisma.pricingRule.findFirst({
      where: { id: ruleId, tenantId },
    });

    if (!rule) {
      throw new NotFoundError('Pricing rule not found');
    }

    const updatedRule = await prisma.pricingRule.update({
      where: { id: ruleId },
      data: {
        ...data,
        timeSlots: data.timeSlots || rule.timeSlots,
        conditions: data.conditions || rule.conditions,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validTo: data.validTo ? new Date(data.validTo) : undefined,
      },
      include: {
        tier: true,
      },
    });

    return updatedRule;
  }

  async deletePricingRule(tenantId: string, ruleId: string): Promise<{ success: boolean }> {
    const rule = await prisma.pricingRule.findFirst({
      where: { id: ruleId, tenantId },
    });

    if (!rule) {
      throw new NotFoundError('Pricing rule not found');
    }

    await prisma.pricingRule.delete({
      where: { id: ruleId },
    });

    return { success: true };
  }

  async calculatePrice(tenantId: string, request: PriceCalculationRequest): Promise<PriceCalculationResult> {
    // Get base plan and tier
    const plan = await prisma.plan.findFirst({
      where: { tenantId, type: request.planType },
      include: {
        planTiers: {
          include: {
            tier: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    // Determine base price
    let basePrice = plan.price.toNumber();
    let tier: PricingTier | null = null;

    if (request.pricingTierId) {
      tier = await prisma.pricingTier.findFirst({
        where: { id: request.pricingTierId, tenantId },
      });

      if (tier) {
        const planTier = plan.planTiers.find(pt => pt.tierId === tier!.id);
        if (planTier) {
          basePrice = planTier.basePrice.toNumber();
        }
      }
    }

    // Initialize calculation
    const quantity = request.quantity || 1;
    const duration = request.duration || 1;
    let adjustedPrice = basePrice;
    const adjustments: PriceCalculationResult['adjustments'] = [];
    const discounts: PriceCalculationResult['discounts'] = [];

    // Apply pricing rules
    if (tier) {
      const rules = await prisma.pricingRule.findMany({
        where: {
          tenantId,
          tierId: tier.id,
          isActive: true,
          OR: [
            { validFrom: null },
            { validFrom: { lte: new Date() } },
          ],
          AND: [
            {
              OR: [
                { validTo: null },
                { validTo: { gte: new Date() } },
              ],
            },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });

      for (const rule of rules) {
        if (this.ruleApplies(rule, request)) {
          const adjustment = this.applyPricingRule(adjustedPrice, rule);
          adjustedPrice = adjustment.newPrice;
          adjustments.push({
            type: rule.ruleType,
            description: rule.name,
            amount: adjustment.amount,
            percentage: adjustment.percentage,
          });
        }
      }
    }

    // Apply billing cycle adjustments
    const cycleMultiplier = this.getBillingCycleMultiplier(request.billingCycle);
    adjustedPrice *= cycleMultiplier;

    if (cycleMultiplier !== 1) {
      adjustments.push({
        type: 'BILLING_CYCLE',
        description: `${request.billingCycle} billing discount`,
        amount: adjustedPrice - (basePrice * quantity * duration),
        percentage: ((cycleMultiplier - 1) * 100),
      });
    }

    // Apply quantity and duration
    const subtotalBeforeDiscounts = adjustedPrice * quantity * duration;

    // Apply discount code if provided
    if (request.discountCode) {
      const discount = await this.applyDiscountCode(tenantId, request.discountCode, subtotalBeforeDiscounts);
      if (discount) {
        discounts.push(discount);
      }
    }

    // Calculate totals
    const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
    const subtotal = subtotalBeforeDiscounts - totalDiscounts;
    const taxes = subtotal * 0.1; // 10% tax rate - should be configurable
    const total = subtotal + taxes;

    return {
      basePrice,
      adjustments,
      discounts,
      subtotal,
      taxes,
      total,
      currency: 'USD',
      breakdown: {
        unitPrice: adjustedPrice,
        quantity,
        duration,
        adjustedPrice,
      },
    };
  }

  private ruleApplies(rule: PricingRule, request: PriceCalculationRequest): boolean {
    // Check plan type
    if (rule.planType && rule.planType !== request.planType) {
      return false;
    }

    // Check space type
    if (rule.spaceType && rule.spaceType !== request.spaceType) {
      return false;
    }

    // Check time slots
    if (rule.timeSlots && request.timeSlot) {
      const ruleSlots = rule.timeSlots as any[];
      const requestSlot = request.timeSlot;

      const timeMatches = ruleSlots.some(slot => {
        const dayMatches = slot.days.some((day: number) => requestSlot.days.includes(day));
        const timeOverlaps = this.timeRangesOverlap(
          slot.start,
          slot.end,
          requestSlot.start,
          requestSlot.end
        );
        return dayMatches && timeOverlaps;
      });

      if (!timeMatches) {
        return false;
      }
    }

    // Check additional conditions
    const conditions = rule.conditions as Record<string, any>;
    for (const [key, value] of Object.entries(conditions)) {
      const requestValue = request.metadata?.[key];
      if (requestValue !== value) {
        return false;
      }
    }

    return true;
  }

  private applyPricingRule(currentPrice: number, rule: PricingRule): { newPrice: number; amount: number; percentage?: number } {
    const modifier = rule.modifier.toNumber();

    switch (rule.modifierType) {
      case 'MULTIPLIER':
        const newPriceMultiplier = currentPrice * modifier;
        return {
          newPrice: newPriceMultiplier,
          amount: newPriceMultiplier - currentPrice,
          percentage: (modifier - 1) * 100,
        };

      case 'FIXED_AMOUNT':
        const newPriceFixed = currentPrice + modifier;
        return {
          newPrice: Math.max(0, newPriceFixed),
          amount: modifier,
        };

      case 'REPLACEMENT':
        return {
          newPrice: modifier,
          amount: modifier - currentPrice,
        };

      default:
        return { newPrice: currentPrice, amount: 0 };
    }
  }

  private getBillingCycleMultiplier(cycle: BillingCycle): number {
    switch (cycle) {
      case 'DAILY':
        return 1;
      case 'WEEKLY':
        return 6.5; // 7% discount for weekly
      case 'MONTHLY':
        return 28; // ~7% discount for monthly
      case 'QUARTERLY':
        return 81; // 10% discount for quarterly (3 months * 30 days * 0.9)
      case 'YEARLY':
        return 300; // 18% discount for yearly (12 months * 30 days * 0.82)
      default:
        return 1;
    }
  }

  private async applyDiscountCode(tenantId: string, code: string, amount: number): Promise<{ type: string; description: string; amount: number } | null> {
    const discountCode = await prisma.discountCode.findFirst({
      where: {
        tenantId,
        code,
        isActive: true,
        validFrom: { lte: new Date() },
        validTo: { gte: new Date() },
      },
    });

    if (!discountCode) {
      return null;
    }

    // Check usage limit
    if (discountCode.usageLimit && discountCode.usageCount >= discountCode.usageLimit) {
      return null;
    }

    // Check minimum amount
    if (discountCode.minAmount && amount < discountCode.minAmount.toNumber()) {
      return null;
    }

    let discountAmount = 0;
    const discountValue = discountCode.value.toNumber();

    switch (discountCode.discountType) {
      case 'PERCENTAGE':
        discountAmount = (amount * discountValue) / 100;
        break;
      case 'FIXED_AMOUNT':
        discountAmount = discountValue;
        break;
      case 'FREE_DAYS':
        // For free days, calculate equivalent monetary value
        discountAmount = (amount / 30) * discountValue; // Assuming monthly pricing
        break;
    }

    // Apply max discount limit
    if (discountCode.maxDiscount && discountAmount > discountCode.maxDiscount.toNumber()) {
      discountAmount = discountCode.maxDiscount.toNumber();
    }

    // Update usage count
    await prisma.discountCode.update({
      where: { id: discountCode.id },
      data: { usageCount: { increment: 1 } },
    });

    return {
      type: discountCode.discountType,
      description: discountCode.name,
      amount: discountAmount,
    };
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

  async getPlansWithPricing(tenantId: string, pricingTierId?: string): Promise<Array<Plan & { tiers: Array<{ tier: PricingTier; basePrice: number; features: string[] }> }>> {
    const plans = await prisma.plan.findMany({
      where: { tenantId, isActive: true },
      include: {
        planTiers: {
          include: {
            tier: true,
          },
          where: pricingTierId ? { tierId: pricingTierId } : undefined,
        },
      },
    });

    return plans.map(plan => ({
      ...plan,
      tiers: plan.planTiers.map(pt => ({
        tier: pt.tier,
        basePrice: pt.basePrice.toNumber(),
        features: pt.features as string[] || [],
      })),
    }));
  }

  async bulkUpdatePrices(tenantId: string, updates: Array<{ planId: string; tierId: string; basePrice: number }>): Promise<{ updated: number; errors: Array<{ planId: string; tierId: string; error: string }> }> {
    const results = { updated: 0, errors: [] as Array<{ planId: string; tierId: string; error: string }> };

    for (const update of updates) {
      try {
        const planTier = await prisma.planTier.findFirst({
          where: {
            planId: update.planId,
            tierId: update.tierId,
            plan: { tenantId },
          },
        });

        if (!planTier) {
          results.errors.push({
            planId: update.planId,
            tierId: update.tierId,
            error: 'Plan tier combination not found',
          });
          continue;
        }

        await prisma.planTier.update({
          where: { id: planTier.id },
          data: { basePrice: update.basePrice },
        });

        results.updated++;
      } catch (error) {
        results.errors.push({
          planId: update.planId,
          tierId: update.tierId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}

export const pricingService = new PricingService();