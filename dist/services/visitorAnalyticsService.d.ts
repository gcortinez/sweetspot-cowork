import { VisitorPurpose, AnalyticsPeriod } from '@prisma/client';
export interface VisitorAnalyticsData {
    id: string;
    date: Date;
    period: AnalyticsPeriod;
    totalVisitors: number;
    uniqueVisitors: number;
    returningVisitors: number;
    averageVisitDuration?: number;
    onTimeArrivals: number;
    lateArrivals: number;
    earlyDepartures: number;
    noShows: number;
    preRegistrations: number;
    walkIns: number;
    purposeBreakdown: Record<string, number>;
    peakHour?: string;
    peakDay?: string;
    busyHours: string[];
    hostUtilization: Record<string, number>;
    accessCodesGenerated: number;
    accessCodesUsed: number;
    companyBreakdown: Record<string, number>;
    visitorSources: Record<string, number>;
    averageProcessingTime?: number;
    automationRate?: number;
    weekOverWeekGrowth?: number;
    monthOverMonthGrowth?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface AnalyticsFilter {
    startDate: Date;
    endDate: Date;
    period?: AnalyticsPeriod;
    hostUserId?: string;
    purpose?: VisitorPurpose;
    includeWeekends?: boolean;
}
export interface VisitorTrends {
    period: string;
    totalVisitors: number;
    uniqueVisitors: number;
    averageDuration: number;
    conversionRate: number;
    satisfactionScore?: number;
    growthRate: number;
}
export interface PeakAnalysis {
    peakHours: Array<{
        hour: number;
        visitorCount: number;
        averageDuration: number;
    }>;
    peakDays: Array<{
        dayOfWeek: number;
        dayName: string;
        visitorCount: number;
        averageDuration: number;
    }>;
    seasonalPatterns: Array<{
        month: number;
        monthName: string;
        visitorCount: number;
        averageDuration: number;
    }>;
}
export interface HostPerformance {
    hostId: string;
    hostName: string;
    totalVisitors: number;
    averageVisitDuration: number;
    onTimeRate: number;
    preRegistrationRate: number;
    noShowRate: number;
    visitorSatisfaction?: number;
    responseTime: number;
}
export interface ConversionFunnel {
    preRegistrations: number;
    approved: number;
    checkedIn: number;
    completed: number;
    approvalRate: number;
    showUpRate: number;
    completionRate: number;
}
export interface SecurityMetrics {
    totalAccessAttempts: number;
    successfulAccess: number;
    failedAttempts: number;
    violations: number;
    averageAccessTime: number;
    suspiciousActivity: number;
    complianceRate: number;
}
declare class VisitorAnalyticsService {
    generateDailyAnalytics(tenantId: string, date?: Date): Promise<VisitorAnalyticsData>;
    generateWeeklyAnalytics(tenantId: string, weekStartDate?: Date): Promise<VisitorAnalyticsData>;
    generateMonthlyAnalytics(tenantId: string, month: number, year: number): Promise<VisitorAnalyticsData>;
    getAnalytics(tenantId: string, filters: AnalyticsFilter, pagination?: {
        skip?: number;
        take?: number;
    }): Promise<{
        analytics: VisitorAnalyticsData[];
        total: number;
    }>;
    getVisitorTrends(tenantId: string, period: AnalyticsPeriod, startDate: Date, endDate: Date): Promise<VisitorTrends[]>;
    getPeakAnalysis(tenantId: string, startDate: Date, endDate: Date): Promise<PeakAnalysis>;
    getHostPerformance(tenantId: string, startDate: Date, endDate: Date, hostUserId?: string): Promise<HostPerformance[]>;
    getConversionFunnel(tenantId: string, startDate: Date, endDate: Date): Promise<ConversionFunnel>;
    private calculateAnalytics;
    private aggregateAnalytics;
    private mergeBreakdown;
    private calculateGrowthRate;
    private calculateConversionRate;
    private formatPeriod;
    private mapAnalyticsToData;
}
export declare const visitorAnalyticsService: VisitorAnalyticsService;
export {};
//# sourceMappingURL=visitorAnalyticsService.d.ts.map