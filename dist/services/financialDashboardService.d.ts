import { DashboardType, ReportPeriod } from '@prisma/client';
export interface FinancialDashboardData {
    id: string;
    dashboardType: DashboardType;
    period: ReportPeriod;
    startDate: Date;
    endDate: Date;
    kpis: any;
    metrics: any;
    charts: any[];
    alerts: any[];
    trends: any;
    comparisons: any;
    targets: any;
    actuals: any;
    variances: any;
    insights: string[];
    lastRefreshed: Date;
    refreshInterval: number;
    isAutoRefresh: boolean;
    customizations: any;
    sharedWith: string[];
    isPublic: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateDashboardRequest {
    dashboardType: DashboardType;
    period: ReportPeriod;
    startDate: Date;
    endDate: Date;
    customizations?: DashboardCustomizations;
    autoRefresh?: boolean;
    refreshInterval?: number;
}
export interface DashboardCustomizations {
    layout: 'GRID' | 'FLEXIBLE' | 'CUSTOM';
    widgets: Array<{
        id: string;
        type: string;
        position: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        config: any;
        visible: boolean;
    }>;
    filters: {
        dateRange?: 'CUSTOM' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'YEAR_TO_DATE';
        clients?: string[];
        services?: string[];
        locations?: string[];
    };
    theme: {
        colorScheme: 'LIGHT' | 'DARK' | 'AUTO';
        primaryColor: string;
        chartStyle: 'MODERN' | 'CLASSIC' | 'MINIMAL';
    };
}
export interface DashboardKPIs {
    totalRevenue: number;
    revenueGrowth: number;
    recurringRevenue: number;
    averageRevenuePerClient: number;
    revenuePerSquareFoot: number;
    grossProfit: number;
    grossMargin: number;
    operatingProfit: number;
    operatingMargin: number;
    netProfit: number;
    netMargin: number;
    ebitda: number;
    ebitdaMargin: number;
    occupancyRate: number;
    utilizationRate: number;
    customerRetentionRate: number;
    customerLifetimeValue: number;
    customerAcquisitionCost: number;
    churnRate: number;
    cashFlow: number;
    burnRate: number;
    runway: number;
    debtToEquity: number;
    currentRatio: number;
    quickRatio: number;
    costPerClient: number;
    revenuePerEmployee: number;
    assetTurnover: number;
    workingCapitalTurnover: number;
}
export interface DashboardMetrics {
    revenue: {
        current: number;
        previous: number;
        growth: number;
        forecast: number;
        target: number;
        breakdown: {
            membership: number;
            dayPasses: number;
            meetingRooms: number;
            services: number;
            other: number;
        };
    };
    expenses: {
        current: number;
        previous: number;
        growth: number;
        forecast: number;
        budget: number;
        breakdown: {
            rent: number;
            salaries: number;
            utilities: number;
            marketing: number;
            supplies: number;
            other: number;
        };
    };
    customers: {
        total: number;
        active: number;
        new: number;
        churned: number;
        retention: number;
        satisfaction: number;
    };
    operations: {
        occupancy: number;
        utilization: number;
        efficiency: number;
        capacity: number;
        bookings: number;
        cancellations: number;
    };
}
export interface DashboardChart {
    id: string;
    type: 'LINE' | 'BAR' | 'PIE' | 'AREA' | 'SCATTER' | 'GAUGE' | 'HEATMAP';
    title: string;
    description?: string;
    data: any;
    config: {
        xAxis?: string;
        yAxis?: string;
        groupBy?: string;
        aggregation?: 'SUM' | 'AVERAGE' | 'COUNT' | 'MIN' | 'MAX';
        timeframe?: string;
        comparison?: boolean;
    };
    insights: string[];
}
export interface DashboardAlert {
    id: string;
    type: 'WARNING' | 'ERROR' | 'INFO' | 'SUCCESS';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    message: string;
    category: string;
    threshold?: number;
    currentValue?: number;
    recommendedAction?: string;
    createdAt: Date;
    acknowledged: boolean;
    dismissible: boolean;
}
export interface DashboardComparison {
    previousPeriod: {
        revenue: number;
        expenses: number;
        profit: number;
        margin: number;
    };
    yearOverYear: {
        revenue: number;
        expenses: number;
        profit: number;
        margin: number;
    };
    benchmark: {
        industry: {
            revenue: number;
            margin: number;
            efficiency: number;
        };
        target: {
            revenue: number;
            margin: number;
            growth: number;
        };
    };
}
export declare class FinancialDashboardService {
    createDashboard(tenantId: string, userId: string, request: CreateDashboardRequest): Promise<FinancialDashboardData>;
    refreshDashboard(tenantId: string, dashboardId: string): Promise<FinancialDashboardData>;
    private generateDashboardData;
    private generateExecutiveDashboard;
    private generateOperationalDashboard;
    private generateFinancialDashboard;
    private calculateExecutiveKPIs;
    private calculateOperationalKPIs;
    private calculateFinancialKPIs;
    private generateExecutiveCharts;
    private generateOperationalCharts;
    private generateFinancialCharts;
    private generateExecutiveAlerts;
    private generateOperationalAlerts;
    private generateFinancialAlerts;
    private getMonthlyRevenueTrend;
    private getExecutiveMetrics;
    private analyzeTrends;
    private getComparisons;
    private getForecastData;
    private getTargets;
    private calculateVariances;
    private getDefaultCustomizations;
    private generateCustomDashboard;
    private generateExecutiveInsights;
    private generateOperationalInsights;
    private generateFinancialInsights;
    private getOperationalMetrics;
    private getUtilizationTrends;
    private getBookingAnalytics;
    private getCustomerMetrics;
    private getOperationalComparisons;
    private getOperationalTargets;
    private getProfitAnalysisData;
    private getCashFlowData;
    private getReconciliationSummary;
    private getBudgetVariance;
    private getRevenueTrends;
    private getProfitTrends;
    private getCostTrends;
    private getFinancialComparisons;
    private getFinancialTargets;
    private getUtilizationHeatmap;
    private getBookingTrends;
    private getCashFlowChartData;
    private getExpenseBreakdownData;
    getDashboards(tenantId: string, filters?: {
        dashboardType?: DashboardType;
        createdBy?: string;
    }, pagination?: {
        skip?: number;
        take?: number;
    }): Promise<{
        dashboards: FinancialDashboardData[];
        total: number;
        hasMore: boolean;
    }>;
    private mapDashboardToData;
}
export declare const financialDashboardService: FinancialDashboardService;
//# sourceMappingURL=financialDashboardService.d.ts.map