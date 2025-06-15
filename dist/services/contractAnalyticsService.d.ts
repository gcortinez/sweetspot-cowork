import { ContractStatus, ContractType } from './contractLifecycleService';
export declare enum ReportType {
    CONTRACT_OVERVIEW = "CONTRACT_OVERVIEW",
    REVENUE_ANALYSIS = "REVENUE_ANALYSIS",
    CLIENT_ANALYSIS = "CLIENT_ANALYSIS",
    RENEWAL_PERFORMANCE = "RENEWAL_PERFORMANCE",
    CONTRACT_LIFECYCLE = "CONTRACT_LIFECYCLE",
    EXPIRY_FORECAST = "EXPIRY_FORECAST",
    CUSTOM = "CUSTOM"
}
export declare enum TimeFrame {
    LAST_7_DAYS = "LAST_7_DAYS",
    LAST_30_DAYS = "LAST_30_DAYS",
    LAST_90_DAYS = "LAST_90_DAYS",
    LAST_6_MONTHS = "LAST_6_MONTHS",
    LAST_YEAR = "LAST_YEAR",
    THIS_MONTH = "THIS_MONTH",
    THIS_QUARTER = "THIS_QUARTER",
    THIS_YEAR = "THIS_YEAR",
    CUSTOM_RANGE = "CUSTOM_RANGE"
}
export declare enum ExportFormat {
    PDF = "PDF",
    EXCEL = "EXCEL",
    CSV = "CSV",
    JSON = "JSON"
}
interface AnalyticsQuery {
    timeFrame: TimeFrame;
    dateFrom?: Date;
    dateTo?: Date;
    contractTypes?: ContractType[];
    clientIds?: string[];
    statuses?: ContractStatus[];
    includeRenewals?: boolean;
    groupBy?: 'month' | 'quarter' | 'year' | 'week';
}
interface ContractOverviewMetrics {
    totalContracts: number;
    activeContracts: number;
    totalValue: number;
    averageValue: number;
    byStatus: Array<{
        status: ContractStatus;
        count: number;
        value: number;
        percentage: number;
    }>;
    byType: Array<{
        type: ContractType;
        count: number;
        value: number;
        averageValue: number;
    }>;
    byMonth: Array<{
        month: string;
        year: number;
        contractsCreated: number;
        contractsActivated: number;
        contractsTerminated: number;
        value: number;
    }>;
    topClients: Array<{
        clientId: string;
        clientName: string;
        contractCount: number;
        totalValue: number;
        activeContracts: number;
    }>;
}
interface RevenueAnalysis {
    totalRevenue: number;
    recurringRevenue: number;
    oneTimeRevenue: number;
    projectedRevenue: number;
    revenueGrowth: number;
    averageContractValue: number;
    byPeriod: Array<{
        period: string;
        year: number;
        revenue: number;
        contractCount: number;
        newContracts: number;
        renewedContracts: number;
    }>;
    byContractType: Array<{
        type: ContractType;
        revenue: number;
        percentage: number;
        growth: number;
    }>;
    revenueProjection: Array<{
        period: string;
        projectedRevenue: number;
        certaintyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
        factors: string[];
    }>;
}
interface ClientAnalysis {
    totalClients: number;
    activeClients: number;
    newClients: number;
    churnedClients: number;
    retentionRate: number;
    averageContractsPerClient: number;
    clientValue: Array<{
        segment: string;
        clientCount: number;
        totalValue: number;
        averageValue: number;
        percentage: number;
    }>;
    clientLifecycle: Array<{
        clientId: string;
        clientName: string;
        firstContract: Date;
        lastContract: Date;
        totalContracts: number;
        totalValue: number;
        status: 'ACTIVE' | 'CHURNED' | 'PROSPECT';
        lastActivity: Date;
    }>;
    churnAnalysis: {
        churnRate: number;
        churnReasons: Array<{
            reason: string;
            count: number;
            percentage: number;
        }>;
        atRiskClients: Array<{
            clientId: string;
            clientName: string;
            riskScore: number;
            riskFactors: string[];
            lastActivity: Date;
        }>;
    };
}
interface RenewalPerformance {
    totalRenewals: number;
    successfulRenewals: number;
    renewalRate: number;
    averageRenewalTime: number;
    renewalValue: number;
    priceIncreaseRate: number;
    byType: Array<{
        type: ContractType;
        renewalRate: number;
        averageIncrease: number;
        count: number;
    }>;
    trends: Array<{
        period: string;
        renewalRate: number;
        averageValue: number;
        priceIncrease: number;
    }>;
    upcomingRenewals: Array<{
        contractId: string;
        clientName: string;
        currentValue: number;
        expiryDate: Date;
        renewalProbability: number;
        estimatedValue: number;
    }>;
}
interface ContractLifecycleMetrics {
    averageContractDuration: number;
    timeToActivation: number;
    timeToTermination: number;
    statusDistribution: Array<{
        status: ContractStatus;
        averageDuration: number;
        count: number;
    }>;
    lifecycle: Array<{
        stage: string;
        averageDays: number;
        conversionRate: number;
    }>;
    bottlenecks: Array<{
        stage: string;
        averageDelay: number;
        factors: string[];
    }>;
}
interface ExpiryForecast {
    next30Days: number;
    next60Days: number;
    next90Days: number;
    next6Months: number;
    valueAtRisk: number;
    byMonth: Array<{
        month: string;
        year: number;
        expiringContracts: number;
        expiringValue: number;
        renewalProbability: number;
    }>;
    criticalExpirations: Array<{
        contractId: string;
        clientName: string;
        value: number;
        expiryDate: Date;
        renewalStatus: string;
        actionRequired: string[];
    }>;
}
interface GenerateReportOptions {
    type: ReportType;
    timeFrame: TimeFrame;
    dateFrom?: Date;
    dateTo?: Date;
    format: ExportFormat;
    includeCharts?: boolean;
    filters?: {
        contractTypes?: ContractType[];
        clientIds?: string[];
        statuses?: ContractStatus[];
    };
    customFields?: string[];
    groupBy?: 'month' | 'quarter' | 'year';
}
interface GeneratedReport {
    id: string;
    type: ReportType;
    format: ExportFormat;
    title: string;
    generatedAt: Date;
    fileUrl?: string;
    data: any;
    metadata: {
        totalRecords: number;
        dateRange: {
            from: Date;
            to: Date;
        };
        filters: any;
        generatedBy: string;
    };
}
declare class ContractAnalyticsService {
    getContractOverview(tenantId: string, query: AnalyticsQuery): Promise<ContractOverviewMetrics>;
    getRevenueAnalysis(tenantId: string, query: AnalyticsQuery): Promise<RevenueAnalysis>;
    getClientAnalysis(tenantId: string, query: AnalyticsQuery): Promise<ClientAnalysis>;
    getRenewalPerformance(tenantId: string, query: AnalyticsQuery): Promise<RenewalPerformance>;
    getContractLifecycleMetrics(tenantId: string, query: AnalyticsQuery): Promise<ContractLifecycleMetrics>;
    getExpiryForecast(tenantId: string): Promise<ExpiryForecast>;
    generateReport(tenantId: string, generatedBy: string, options: GenerateReportOptions): Promise<GeneratedReport>;
    getReportHistory(tenantId: string): Promise<GeneratedReport[]>;
    getDashboardMetrics(tenantId: string): Promise<{
        overview: any;
        recentActivity: any[];
        alerts: any[];
        kpis: any[];
    }>;
    private getDateRange;
    private getRecordCount;
    private generateId;
}
export declare const contractAnalyticsService: ContractAnalyticsService;
export {};
//# sourceMappingURL=contractAnalyticsService.d.ts.map