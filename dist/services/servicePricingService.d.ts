import { ServiceCategory, ServiceType } from '@prisma/client';
export interface PricingTier {
    minQuantity: number;
    maxQuantity?: number;
    pricePerUnit: number;
    discountPercentage?: number;
}
export interface DynamicPricingRequest {
    serviceId: string;
    quantity: number;
    requestedDeliveryTime?: Date;
    userId?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}
export interface PricingResult {
    basePrice: number;
    quantity: number;
    subtotal: number;
    appliedTier?: PricingTier;
    demandMultiplier: number;
    timeMultiplier: number;
    priorityMultiplier: number;
    volumeDiscount: number;
    finalPrice: number;
    savings: number;
    breakdown: Array<{
        description: string;
        amount: number;
        type: 'base' | 'multiplier' | 'discount' | 'fee';
    }>;
}
export interface BulkPricingRule {
    id: string;
    tenantId: string;
    serviceId?: string;
    category?: ServiceCategory;
    serviceType?: ServiceType;
    minQuantity: number;
    discountPercentage: number;
    isActive: boolean;
    validFrom?: Date;
    validUntil?: Date;
}
export interface DemandPricingConfig {
    tenantId: string;
    serviceId: string;
    enableDemandPricing: boolean;
    demandThresholds: Array<{
        requestsPerHour: number;
        multiplier: number;
    }>;
    timeBasedPricing: Array<{
        startHour: number;
        endHour: number;
        multiplier: number;
        daysOfWeek: number[];
    }>;
}
export interface PricingAnalytics {
    averageOrderValue: number;
    totalRevenue: number;
    pricingEfficiency: number;
    demandPricingImpact: number;
    volumeDiscountUtilization: number;
    priceElasticity: number;
    revenueByPriceRange: Array<{
        priceRange: string;
        orderCount: number;
        revenue: number;
    }>;
    optimalPriceRecommendations: Array<{
        serviceId: string;
        serviceName: string;
        currentPrice: number;
        recommendedPrice: number;
        expectedImpact: string;
    }>;
}
export declare class ServicePricingService {
    calculatePrice(tenantId: string, request: DynamicPricingRequest): Promise<PricingResult>;
    bulkCalculatePrice(tenantId: string, requests: DynamicPricingRequest[]): Promise<PricingResult[]>;
    updateServicePricingConfig(tenantId: string, serviceId: string, config: {
        price?: number;
        pricingTiers?: PricingTier[];
        dynamicPricing?: boolean;
        minimumOrder?: number;
    }): Promise<void>;
    createBulkPricingRule(tenantId: string, rule: Omit<BulkPricingRule, 'id' | 'tenantId'>): Promise<BulkPricingRule>;
    analyzePricingPerformance(tenantId: string, serviceId?: string, startDate?: Date, endDate?: Date): Promise<PricingAnalytics>;
    optimizePriceForService(tenantId: string, serviceId: string, targetMetric: 'revenue' | 'volume' | 'profit'): Promise<{
        currentPrice: number;
        recommendedPrice: number;
        expectedChange: string;
        confidence: number;
    }>;
    applySeasonalPricing(tenantId: string, serviceIds: string[], seasonalMultiplier: number, startDate: Date, endDate: Date): Promise<void>;
    applyPromotionalPricing(tenantId: string, serviceId: string, discountPercentage: number, validUntil: Date, conditions?: {
        minimumQuantity?: number;
        maxUses?: number;
        userSegment?: string;
    }): Promise<string>;
    private findApplicablePricingTier;
    private calculateDemandMultiplier;
    private calculateTimeMultiplier;
    private calculatePriorityMultiplier;
    private calculateVolumeDiscount;
}
export declare const servicePricingService: ServicePricingService;
//# sourceMappingURL=servicePricingService.d.ts.map