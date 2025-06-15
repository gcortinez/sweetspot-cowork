import { ServiceCategory, ServiceType, ServiceAvailability } from '@prisma/client';
export interface ServiceCatalogItem {
    id: string;
    name: string;
    description?: string;
    category: ServiceCategory;
    serviceType: ServiceType;
    availability: ServiceAvailability;
    price: number;
    unit: string;
    maxQuantity?: number;
    requiresApproval: boolean;
    estimatedDeliveryTime?: string;
    instructions?: string;
    tags: string[];
    metadata: Record<string, any>;
    pricingTiers: Array<{
        minQuantity: number;
        maxQuantity?: number;
        pricePerUnit: number;
        discountPercentage?: number;
    }>;
    dynamicPricing: boolean;
    minimumOrder: number;
    isActive: boolean;
    averageRating?: number;
    totalReviews: number;
    totalRequests: number;
    providersCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ServiceFilter {
    category?: ServiceCategory;
    serviceType?: ServiceType;
    availability?: ServiceAvailability;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    requiresApproval?: boolean;
    tags?: string[];
    search?: string;
}
export interface ServiceCreateRequest {
    name: string;
    description?: string;
    category: ServiceCategory;
    serviceType: ServiceType;
    availability: ServiceAvailability;
    price: number;
    unit?: string;
    maxQuantity?: number;
    requiresApproval?: boolean;
    estimatedDeliveryTime?: string;
    instructions?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    pricingTiers?: Array<{
        minQuantity: number;
        maxQuantity?: number;
        pricePerUnit: number;
        discountPercentage?: number;
    }>;
    dynamicPricing?: boolean;
    minimumOrder?: number;
}
export interface ServiceUpdateRequest {
    name?: string;
    description?: string;
    category?: ServiceCategory;
    serviceType?: ServiceType;
    availability?: ServiceAvailability;
    price?: number;
    unit?: string;
    maxQuantity?: number;
    requiresApproval?: boolean;
    estimatedDeliveryTime?: string;
    instructions?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    pricingTiers?: Array<{
        minQuantity: number;
        maxQuantity?: number;
        pricePerUnit: number;
        discountPercentage?: number;
    }>;
    dynamicPricing?: boolean;
    minimumOrder?: number;
    isActive?: boolean;
}
export interface ServiceAnalytics {
    totalServices: number;
    activeServices: number;
    byCategory: Array<{
        category: ServiceCategory;
        count: number;
        totalRevenue: number;
    }>;
    byType: Array<{
        type: ServiceType;
        count: number;
        averagePrice: number;
    }>;
    popularServices: Array<{
        id: string;
        name: string;
        requestCount: number;
        revenue: number;
        rating: number;
    }>;
    revenueMetrics: {
        totalRevenue: number;
        averageOrderValue: number;
        monthlyGrowth: number;
    };
}
export declare class ServiceCatalogService {
    createService(tenantId: string, data: ServiceCreateRequest): Promise<ServiceCatalogItem>;
    updateService(tenantId: string, serviceId: string, data: ServiceUpdateRequest): Promise<ServiceCatalogItem>;
    deleteService(tenantId: string, serviceId: string): Promise<void>;
    getServiceById(tenantId: string, serviceId: string): Promise<ServiceCatalogItem | null>;
    getServiceCatalog(tenantId: string, filters?: ServiceFilter, pagination?: {
        skip?: number;
        take?: number;
    }): Promise<{
        services: ServiceCatalogItem[];
        total: number;
        hasMore: boolean;
    }>;
    getServicesByCategory(tenantId: string, category: ServiceCategory, includeInactive?: boolean): Promise<ServiceCatalogItem[]>;
    getFeaturedServices(tenantId: string, limit?: number): Promise<ServiceCatalogItem[]>;
    searchServices(tenantId: string, searchTerm: string, filters?: ServiceFilter): Promise<ServiceCatalogItem[]>;
    getServiceAnalytics(tenantId: string, startDate?: Date, endDate?: Date): Promise<ServiceAnalytics>;
    private buildServiceWhereClause;
    private mapServiceToItem;
}
export declare const serviceCatalogService: ServiceCatalogService;
//# sourceMappingURL=serviceCatalogService.d.ts.map