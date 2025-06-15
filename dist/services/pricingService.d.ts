import { PricingTier, PricingRule, Plan, PlanType, SpaceType, BillingCycle, PricingRuleType, ModifierType } from '@prisma/client';
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
    duration?: number;
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
declare class PricingService {
    createPricingTier(tenantId: string, data: CreatePricingTierData): Promise<PricingTier>;
    getPricingTiers(tenantId: string, includeInactive?: boolean): Promise<PricingTierWithRules[]>;
    getPricingTierById(tenantId: string, tierId: string): Promise<PricingTierWithRules>;
    updatePricingTier(tenantId: string, tierId: string, data: Partial<CreatePricingTierData>): Promise<PricingTier>;
    deletePricingTier(tenantId: string, tierId: string): Promise<{
        success: boolean;
    }>;
    createPricingRule(tenantId: string, data: CreatePricingRuleData): Promise<PricingRule>;
    getPricingRules(tenantId: string, tierId?: string): Promise<PricingRule[]>;
    updatePricingRule(tenantId: string, ruleId: string, data: Partial<CreatePricingRuleData>): Promise<PricingRule>;
    deletePricingRule(tenantId: string, ruleId: string): Promise<{
        success: boolean;
    }>;
    calculatePrice(tenantId: string, request: PriceCalculationRequest): Promise<PriceCalculationResult>;
    private ruleApplies;
    private applyPricingRule;
    private getBillingCycleMultiplier;
    private applyDiscountCode;
    private timeRangesOverlap;
    getPlansWithPricing(tenantId: string, pricingTierId?: string): Promise<Array<Plan & {
        tiers: Array<{
            tier: PricingTier;
            basePrice: number;
            features: string[];
        }>;
    }>>;
    bulkUpdatePrices(tenantId: string, updates: Array<{
        planId: string;
        tierId: string;
        basePrice: number;
    }>): Promise<{
        updated: number;
        errors: Array<{
            planId: string;
            tierId: string;
            error: string;
        }>;
    }>;
}
export declare const pricingService: PricingService;
export {};
//# sourceMappingURL=pricingService.d.ts.map