import { ServiceCategory, ServiceType } from '@prisma/client';
export interface ServiceUsageMetrics {
    serviceId: string;
    serviceName: string;
    category: ServiceCategory;
    type: ServiceType;
    totalRequests: number;
    completedRequests: number;
    cancelledRequests: number;
    averageResponseTime: number;
    averageCompletionTime: number;
    totalRevenue: number;
    averageOrderValue: number;
    customerSatisfaction: number;
    utilizationRate: number;
    trendDirection: 'UP' | 'DOWN' | 'STABLE';
    periodComparison: {
        requestsChange: number;
        revenueChange: number;
    };
}
export interface ServiceDashboardData {
    overview: {
        totalServices: number;
        activeServices: number;
        totalRequests: number;
        totalRevenue: number;
        averageRating: number;
        completionRate: number;
    };
    topPerformingServices: ServiceUsageMetrics[];
    categoryBreakdown: Array<{
        category: ServiceCategory;
        requestCount: number;
        revenue: number;
        averageRating: number;
        marketShare: number;
    }>;
    requestTrends: Array<{
        date: string;
        totalRequests: number;
        completedRequests: number;
        revenue: number;
    }>;
    userSegmentAnalysis: Array<{
        segment: string;
        userCount: number;
        averageSpend: number;
        favoriteServices: string[];
    }>;
    operationalMetrics: {
        averageResponseTime: number;
        averageCompletionTime: number;
        staffUtilization: number;
        pendingApprovals: number;
        overdueRequests: number;
    };
}
export interface ServiceRecommendation {
    type: 'PRICING' | 'PROMOTION' | 'CAPACITY' | 'QUALITY' | 'EXPANSION';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    serviceId?: string;
    serviceName?: string;
    title: string;
    description: string;
    expectedImpact: string;
    actionItems: string[];
    metrics: Record<string, number>;
}
export interface AdvancedAnalytics {
    demandForecasting: Array<{
        serviceId: string;
        serviceName: string;
        predictedDemand: number;
        confidenceLevel: number;
        recommendedCapacity: number;
    }>;
    priceOptimization: Array<{
        serviceId: string;
        serviceName: string;
        currentPrice: number;
        optimalPrice: number;
        expectedRevenueLift: number;
    }>;
    customerSegments: Array<{
        segmentName: string;
        characteristics: string[];
        servicePreferences: Array<{
            serviceId: string;
            serviceName: string;
            usageFrequency: number;
        }>;
        spendingPattern: {
            averageMonthlySpend: number;
            seasonality: string;
        };
    }>;
    marketOpportunities: Array<{
        category: ServiceCategory;
        gapDescription: string;
        potentialRevenue: number;
        implementationComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
}
export interface UsageTrackingData {
    serviceId: string;
    userId: string;
    requestId: string;
    action: 'REQUEST_CREATED' | 'REQUEST_APPROVED' | 'REQUEST_STARTED' | 'REQUEST_COMPLETED' | 'REQUEST_CANCELLED' | 'REVIEW_SUBMITTED';
    metadata: Record<string, any>;
    timestamp: Date;
}
export declare class ServiceAnalyticsService {
    trackServiceUsage(tenantId: string, data: UsageTrackingData): Promise<void>;
    generateUsageReport(tenantId: string, startDate: Date, endDate: Date, serviceIds?: string[]): Promise<ServiceUsageMetrics[]>;
    generateDashboardData(tenantId: string, startDate: Date, endDate: Date): Promise<ServiceDashboardData>;
    generateRecommendations(tenantId: string, timeframe?: 'LAST_WEEK' | 'LAST_MONTH' | 'LAST_QUARTER'): Promise<ServiceRecommendation[]>;
    generateAdvancedAnalytics(tenantId: string, analysisType?: 'DEMAND_FORECAST' | 'PRICE_OPTIMIZATION' | 'CUSTOMER_SEGMENTS' | 'MARKET_OPPORTUNITIES' | 'ALL'): Promise<Partial<AdvancedAnalytics>>;
    private generateDailyTrends;
    private generateDemandForecast;
    private generatePriceOptimization;
    private generateCustomerSegments;
    private generateMarketOpportunities;
}
export declare const serviceAnalyticsService: ServiceAnalyticsService;
//# sourceMappingURL=serviceAnalyticsService.d.ts.map