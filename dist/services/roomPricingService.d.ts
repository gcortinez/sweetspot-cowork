import { SpaceType } from '@prisma/client';
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
    dayOfWeek?: number[];
    timeOfDay?: {
        start: string;
        end: string;
    };
    minDuration?: number;
    maxDuration?: number;
    minCapacity?: number;
    maxCapacity?: number;
    requiredAmenities?: string[];
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
export declare class RoomPricingService {
    calculateBookingPrice(tenantId: string, request: RoomPricingRequest): Promise<PricingCalculation>;
    createPricingRule(tenantId: string, rule: Omit<PricingRule, 'id'>): Promise<PricingRule>;
    getPricingRules(tenantId: string): Promise<PricingRule[]>;
    updatePricingRule(tenantId: string, ruleId: string, updates: Partial<PricingRule>): Promise<PricingRule>;
    deletePricingRule(tenantId: string, ruleId: string): Promise<void>;
    getPricingEstimates(tenantId: string, spaceId: string, date: Date, duration?: number): Promise<Array<{
        timeSlot: string;
        rate: number;
        cost: number;
        availability: 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE';
    }>>;
    private getApplicablePricingRules;
    private checkTimeConditions;
    private checkDurationConditions;
    private checkCapacityConditions;
    private checkDateValidity;
    private applyPricingRule;
    private validatePricingRule;
    private generateRuleId;
    private storePricingRule;
    private getPricingRuleById;
    private getDefaultPricingRules;
}
export declare const roomPricingService: RoomPricingService;
//# sourceMappingURL=roomPricingService.d.ts.map