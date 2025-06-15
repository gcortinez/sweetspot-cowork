import { SpaceType, BookingStatus, FeatureCategory, PriceModifierType, PricingRuleType } from '@prisma/client';
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
export declare class RoomManagementService {
    createRoom(tenantId: string, request: CreateRoomRequest): Promise<{
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        type: import(".prisma/client").$Enums.SpaceType;
        capacity: number;
        amenities: import("@prisma/client/runtime/library").JsonValue | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        isActive: boolean;
    }>;
    updateRoom(tenantId: string, spaceId: string, updates: Partial<CreateRoomRequest>): Promise<{
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        type: import(".prisma/client").$Enums.SpaceType;
        capacity: number;
        amenities: import("@prisma/client/runtime/library").JsonValue | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        isActive: boolean;
    }>;
    deleteRoom(tenantId: string, spaceId: string): Promise<{
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        type: import(".prisma/client").$Enums.SpaceType;
        capacity: number;
        amenities: import("@prisma/client/runtime/library").JsonValue | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        isActive: boolean;
    }>;
    getRooms(tenantId: string, filters?: {
        type?: SpaceType;
        isActive?: boolean;
        hasFeatures?: string[];
        minCapacity?: number;
        maxCapacity?: number;
    }): Promise<({
        features: ({
            feature: {
                tenantId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                category: import(".prisma/client").$Enums.FeatureCategory;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            spaceId: string;
            quantity: number;
            featureId: string;
            isWorking: boolean;
        })[];
        availability: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            spaceId: string;
            startTime: string;
            endTime: string;
            reason: string | null;
            dayOfWeek: number;
            isAvailable: boolean;
            recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
            effectiveFrom: Date;
            effectiveTo: Date | null;
        }[];
        _count: {
            bookings: number;
        };
        usageAnalytics: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            spaceId: string;
            date: Date;
            totalBookings: number;
            totalHours: import("@prisma/client/runtime/library").Decimal;
            utilizationRate: import("@prisma/client/runtime/library").Decimal;
            revenue: import("@prisma/client/runtime/library").Decimal;
            noShowCount: number;
            averageRating: import("@prisma/client/runtime/library").Decimal | null;
            peakHourStart: string | null;
            peakHourEnd: string | null;
        }[];
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        type: import(".prisma/client").$Enums.SpaceType;
        capacity: number;
        amenities: import("@prisma/client/runtime/library").JsonValue | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        isActive: boolean;
    })[]>;
    getRoomById(tenantId: string, spaceId: string): Promise<({
        features: ({
            feature: {
                tenantId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                category: import(".prisma/client").$Enums.FeatureCategory;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            spaceId: string;
            quantity: number;
            featureId: string;
            isWorking: boolean;
        })[];
        availability: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            spaceId: string;
            startTime: string;
            endTime: string;
            reason: string | null;
            dayOfWeek: number;
            isAvailable: boolean;
            recurrenceType: import(".prisma/client").$Enums.RecurrenceType;
            effectiveFrom: Date;
            effectiveTo: Date | null;
        }[];
        pricingRules: {
            tenantId: string;
            conditions: import("@prisma/client/runtime/library").JsonValue;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
            spaceId: string | null;
            validFrom: Date | null;
            priority: number;
            ruleType: import(".prisma/client").$Enums.PricingRuleType;
            basePrice: import("@prisma/client/runtime/library").Decimal | null;
            modifierType: import(".prisma/client").$Enums.PriceModifierType;
            validTo: Date | null;
            priceModifier: import("@prisma/client/runtime/library").Decimal;
        }[];
        maintenanceLogs: {
            tenantId: string;
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.MaintenanceStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            notes: string | null;
            spaceId: string;
            cost: import("@prisma/client/runtime/library").Decimal | null;
            completedAt: Date | null;
            maintenanceType: import(".prisma/client").$Enums.MaintenanceType;
            scheduledAt: Date;
            performedBy: string | null;
        }[];
        usageAnalytics: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            spaceId: string;
            date: Date;
            totalBookings: number;
            totalHours: import("@prisma/client/runtime/library").Decimal;
            utilizationRate: import("@prisma/client/runtime/library").Decimal;
            revenue: import("@prisma/client/runtime/library").Decimal;
            noShowCount: number;
            averageRating: import("@prisma/client/runtime/library").Decimal | null;
            peakHourStart: string | null;
            peakHourEnd: string | null;
        }[];
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        type: import(".prisma/client").$Enums.SpaceType;
        capacity: number;
        amenities: import("@prisma/client/runtime/library").JsonValue | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        isActive: boolean;
    }) | null>;
    createRoomFeature(tenantId: string, request: RoomFeatureRequest): Promise<{
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        category: import(".prisma/client").$Enums.FeatureCategory;
    }>;
    getRoomFeatures(tenantId: string, category?: FeatureCategory): Promise<{
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        category: import(".prisma/client").$Enums.FeatureCategory;
    }[]>;
    checkAvailability(tenantId: string, request: RoomAvailabilityRequest): Promise<boolean>;
    getAvailableSlots(tenantId: string, spaceId: string, date: Date, durationMinutes?: number): Promise<{
        startTime: Date;
        endTime: Date;
    }[]>;
    calculatePrice(tenantId: string, request: DynamicPricingRequest): Promise<number>;
    private doesRuleApply;
    private checkTimeBasedRule;
    private checkLocationBasedRule;
    private checkMemberBasedRule;
    createPricingRule(tenantId: string, request: PricingRuleRequest): Promise<{
        tenantId: string;
        conditions: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        spaceId: string | null;
        validFrom: Date | null;
        priority: number;
        ruleType: import(".prisma/client").$Enums.PricingRuleType;
        basePrice: import("@prisma/client/runtime/library").Decimal | null;
        modifierType: import(".prisma/client").$Enums.PriceModifierType;
        validTo: Date | null;
        priceModifier: import("@prisma/client/runtime/library").Decimal;
    }>;
    getPricingRules(tenantId: string, spaceId?: string): Promise<({
        space: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            type: import(".prisma/client").$Enums.SpaceType;
            capacity: number;
            amenities: import("@prisma/client/runtime/library").JsonValue | null;
            hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
            isActive: boolean;
        } | null;
    } & {
        tenantId: string;
        conditions: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        spaceId: string | null;
        validFrom: Date | null;
        priority: number;
        ruleType: import(".prisma/client").$Enums.PricingRuleType;
        basePrice: import("@prisma/client/runtime/library").Decimal | null;
        modifierType: import(".prisma/client").$Enums.PriceModifierType;
        validTo: Date | null;
        priceModifier: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    getRoomAnalytics(tenantId: string, request: RoomAnalyticsRequest): Promise<any[]>;
    private aggregateAnalytics;
}
export declare const roomManagementService: RoomManagementService;
//# sourceMappingURL=roomManagementService.d.ts.map