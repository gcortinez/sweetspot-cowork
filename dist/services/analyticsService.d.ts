interface DateRange {
    from: Date;
    to: Date;
}
interface CrmOverviewStats {
    totalLeads: number;
    totalClients: number;
    totalOpportunities: number;
    totalActivities: number;
    totalConversions: number;
    totalRevenue: number;
    conversionRate: number;
    averageDealSize: number;
    averageSalesCycle: number;
    activeUsers: number;
}
interface LeadAnalytics {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    convertedLeads: number;
    lostLeads: number;
    averageLeadScore: number;
    leadsBySource: Array<{
        source: string;
        count: number;
        percentage: number;
        conversionRate: number;
    }>;
    leadsByStatus: Array<{
        status: string;
        count: number;
        percentage: number;
    }>;
    leadTrends: Array<{
        date: string;
        newLeads: number;
        qualifiedLeads: number;
        conversions: number;
    }>;
}
interface SalesAnalytics {
    totalOpportunities: number;
    totalValue: number;
    wonOpportunities: number;
    wonValue: number;
    lostOpportunities: number;
    lostValue: number;
    winRate: number;
    averageDealSize: number;
    averageSalesCycle: number;
    pipelineValue: number;
    forecastedRevenue: number;
    opportunitiesByStage: Array<{
        stage: string;
        count: number;
        value: number;
        percentage: number;
    }>;
    salesTrends: Array<{
        date: string;
        opportunities: number;
        value: number;
        wonDeals: number;
        wonValue: number;
    }>;
    topPerformers: Array<{
        userId: string;
        userName: string;
        opportunitiesWon: number;
        totalValue: number;
        conversionRate: number;
    }>;
}
interface ActivityAnalytics {
    totalActivities: number;
    completedActivities: number;
    pendingActivities: number;
    overdueActivities: number;
    completionRate: number;
    averageResponseTime: number;
    activitiesByType: Array<{
        type: string;
        count: number;
        percentage: number;
        completionRate: number;
    }>;
    activitiesByUser: Array<{
        userId: string;
        userName: string;
        totalActivities: number;
        completedActivities: number;
        completionRate: number;
    }>;
    activityTrends: Array<{
        date: string;
        total: number;
        completed: number;
        completionRate: number;
    }>;
}
interface UserPerformance {
    userId: string;
    userName: string;
    userEmail: string;
    leadsAssigned: number;
    leadsConverted: number;
    conversionRate: number;
    opportunitiesAssigned: number;
    opportunitiesWon: number;
    winRate: number;
    totalRevenue: number;
    activitiesCompleted: number;
    activityCompletionRate: number;
    averageResponseTime: number;
    performanceScore: number;
}
declare class AnalyticsService {
    private getDateRange;
    getCrmOverview(tenantId: string, period?: string): Promise<CrmOverviewStats>;
    getLeadAnalytics(tenantId: string, period?: string): Promise<LeadAnalytics>;
    getSalesAnalytics(tenantId: string, period?: string): Promise<SalesAnalytics>;
    getActivityAnalytics(tenantId: string, period?: string): Promise<ActivityAnalytics>;
    getUserPerformance(tenantId: string, period?: string): Promise<UserPerformance[]>;
    generateCustomReport(tenantId: string, reportType: string, filters: Record<string, any>, metrics: string[], dateRange: DateRange): Promise<any>;
    private generateLeadReport;
    private generateOpportunityReport;
    private generateActivityReport;
    private generateConversionReport;
}
export declare const analyticsService: AnalyticsService;
export {};
//# sourceMappingURL=analyticsService.d.ts.map