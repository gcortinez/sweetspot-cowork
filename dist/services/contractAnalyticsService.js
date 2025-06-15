"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractAnalyticsService = exports.ExportFormat = exports.TimeFrame = exports.ReportType = void 0;
const errors_1 = require("../utils/errors");
const contractLifecycleService_1 = require("./contractLifecycleService");
var ReportType;
(function (ReportType) {
    ReportType["CONTRACT_OVERVIEW"] = "CONTRACT_OVERVIEW";
    ReportType["REVENUE_ANALYSIS"] = "REVENUE_ANALYSIS";
    ReportType["CLIENT_ANALYSIS"] = "CLIENT_ANALYSIS";
    ReportType["RENEWAL_PERFORMANCE"] = "RENEWAL_PERFORMANCE";
    ReportType["CONTRACT_LIFECYCLE"] = "CONTRACT_LIFECYCLE";
    ReportType["EXPIRY_FORECAST"] = "EXPIRY_FORECAST";
    ReportType["CUSTOM"] = "CUSTOM";
})(ReportType || (exports.ReportType = ReportType = {}));
var TimeFrame;
(function (TimeFrame) {
    TimeFrame["LAST_7_DAYS"] = "LAST_7_DAYS";
    TimeFrame["LAST_30_DAYS"] = "LAST_30_DAYS";
    TimeFrame["LAST_90_DAYS"] = "LAST_90_DAYS";
    TimeFrame["LAST_6_MONTHS"] = "LAST_6_MONTHS";
    TimeFrame["LAST_YEAR"] = "LAST_YEAR";
    TimeFrame["THIS_MONTH"] = "THIS_MONTH";
    TimeFrame["THIS_QUARTER"] = "THIS_QUARTER";
    TimeFrame["THIS_YEAR"] = "THIS_YEAR";
    TimeFrame["CUSTOM_RANGE"] = "CUSTOM_RANGE";
})(TimeFrame || (exports.TimeFrame = TimeFrame = {}));
var ExportFormat;
(function (ExportFormat) {
    ExportFormat["PDF"] = "PDF";
    ExportFormat["EXCEL"] = "EXCEL";
    ExportFormat["CSV"] = "CSV";
    ExportFormat["JSON"] = "JSON";
})(ExportFormat || (exports.ExportFormat = ExportFormat = {}));
class ContractAnalyticsService {
    async getContractOverview(tenantId, query) {
        const dateRange = this.getDateRange(query.timeFrame, query.dateFrom, query.dateTo);
        return {
            totalContracts: 145,
            activeContracts: 98,
            totalValue: 245670,
            averageValue: 1694,
            byStatus: [
                { status: contractLifecycleService_1.ContractStatus.ACTIVE, count: 98, value: 198450, percentage: 67.6 },
                { status: contractLifecycleService_1.ContractStatus.PENDING_SIGNATURE, count: 12, value: 18600, percentage: 8.3 },
                { status: contractLifecycleService_1.ContractStatus.DRAFT, count: 8, value: 9200, percentage: 5.5 },
                { status: contractLifecycleService_1.ContractStatus.TERMINATED, count: 15, value: 12800, percentage: 10.3 },
                { status: contractLifecycleService_1.ContractStatus.EXPIRED, count: 12, value: 6620, percentage: 8.3 },
            ],
            byType: [
                { type: contractLifecycleService_1.ContractType.MEMBERSHIP, count: 89, value: 156780, averageValue: 1762 },
                { type: contractLifecycleService_1.ContractType.EVENT_SPACE, count: 28, value: 52400, averageValue: 1871 },
                { type: contractLifecycleService_1.ContractType.MEETING_ROOM, count: 18, value: 21600, averageValue: 1200 },
                { type: contractLifecycleService_1.ContractType.SERVICE, count: 10, value: 14890, averageValue: 1489 },
            ],
            byMonth: [
                { month: 'January', year: 2024, contractsCreated: 12, contractsActivated: 10, contractsTerminated: 2, value: 18600 },
                { month: 'February', year: 2024, contractsCreated: 15, contractsActivated: 13, contractsTerminated: 1, value: 22100 },
                { month: 'March', year: 2024, contractsCreated: 18, contractsActivated: 16, contractsTerminated: 3, value: 28750 },
            ],
            topClients: [
                { clientId: 'client-1', clientName: 'Tech Corp', contractCount: 5, totalValue: 12450, activeContracts: 4 },
                { clientId: 'client-2', clientName: 'Design Studio', contractCount: 3, totalValue: 8900, activeContracts: 3 },
                { clientId: 'client-3', clientName: 'Startup Inc', contractCount: 4, totalValue: 7200, activeContracts: 2 },
            ],
        };
    }
    async getRevenueAnalysis(tenantId, query) {
        const dateRange = this.getDateRange(query.timeFrame, query.dateFrom, query.dateTo);
        return {
            totalRevenue: 245670,
            recurringRevenue: 198450,
            oneTimeRevenue: 47220,
            projectedRevenue: 312000,
            revenueGrowth: 15.6,
            averageContractValue: 1694,
            byPeriod: [
                { period: 'Q1 2024', year: 2024, revenue: 68450, contractCount: 45, newContracts: 12, renewedContracts: 8 },
                { period: 'Q2 2024', year: 2024, revenue: 72100, contractCount: 52, newContracts: 15, renewedContracts: 10 },
                { period: 'Q3 2024', year: 2024, revenue: 78200, contractCount: 48, newContracts: 18, renewedContracts: 12 },
            ],
            byContractType: [
                { type: contractLifecycleService_1.ContractType.MEMBERSHIP, revenue: 156780, percentage: 63.8, growth: 12.4 },
                { type: contractLifecycleService_1.ContractType.EVENT_SPACE, revenue: 52400, percentage: 21.3, growth: 18.9 },
                { type: contractLifecycleService_1.ContractType.MEETING_ROOM, revenue: 21600, percentage: 8.8, growth: 8.7 },
                { type: contractLifecycleService_1.ContractType.SERVICE, revenue: 14890, percentage: 6.1, growth: 22.1 },
            ],
            revenueProjection: [
                { period: 'Q4 2024', projectedRevenue: 85000, certaintyLevel: 'HIGH', factors: ['Confirmed renewals', 'Pipeline conversion'] },
                { period: 'Q1 2025', projectedRevenue: 92000, certaintyLevel: 'MEDIUM', factors: ['Seasonal demand', 'Market expansion'] },
                { period: 'Q2 2025', projectedRevenue: 98000, certaintyLevel: 'LOW', factors: ['New product launch', 'Market conditions'] },
            ],
        };
    }
    async getClientAnalysis(tenantId, query) {
        return {
            totalClients: 87,
            activeClients: 72,
            newClients: 18,
            churnedClients: 5,
            retentionRate: 94.2,
            averageContractsPerClient: 1.67,
            clientValue: [
                { segment: 'Enterprise', clientCount: 12, totalValue: 89650, averageValue: 7470, percentage: 36.5 },
                { segment: 'Mid-Market', clientCount: 28, totalValue: 98400, averageValue: 3514, percentage: 40.1 },
                { segment: 'Small Business', clientCount: 47, totalValue: 57620, averageValue: 1225, percentage: 23.4 },
            ],
            clientLifecycle: [
                { clientId: 'client-1', clientName: 'Tech Corp', firstContract: new Date('2023-01-15'), lastContract: new Date('2024-01-15'), totalContracts: 5, totalValue: 12450, status: 'ACTIVE', lastActivity: new Date('2024-02-10') },
                { clientId: 'client-2', clientName: 'Design Studio', firstContract: new Date('2023-03-20'), lastContract: new Date('2024-03-20'), totalContracts: 3, totalValue: 8900, status: 'ACTIVE', lastActivity: new Date('2024-03-15') },
            ],
            churnAnalysis: {
                churnRate: 5.7,
                churnReasons: [
                    { reason: 'Price sensitivity', count: 2, percentage: 40.0 },
                    { reason: 'Relocation', count: 1, percentage: 20.0 },
                    { reason: 'Business closure', count: 1, percentage: 20.0 },
                    { reason: 'Service dissatisfaction', count: 1, percentage: 20.0 },
                ],
                atRiskClients: [
                    { clientId: 'client-4', clientName: 'Risk Client', riskScore: 85, riskFactors: ['Payment delays', 'Reduced usage'], lastActivity: new Date('2024-01-20') },
                ],
            },
        };
    }
    async getRenewalPerformance(tenantId, query) {
        return {
            totalRenewals: 45,
            successfulRenewals: 38,
            renewalRate: 84.4,
            averageRenewalTime: 15.2,
            renewalValue: 156780,
            priceIncreaseRate: 8.5,
            byType: [
                { type: contractLifecycleService_1.ContractType.MEMBERSHIP, renewalRate: 89.2, averageIncrease: 7.8, count: 28 },
                { type: contractLifecycleService_1.ContractType.EVENT_SPACE, renewalRate: 76.5, averageIncrease: 12.1, count: 8 },
                { type: contractLifecycleService_1.ContractType.MEETING_ROOM, renewalRate: 82.1, averageIncrease: 5.5, count: 6 },
                { type: contractLifecycleService_1.ContractType.SERVICE, renewalRate: 90.0, averageIncrease: 15.2, count: 3 },
            ],
            trends: [
                { period: 'Q1 2024', renewalRate: 82.1, averageValue: 3890, priceIncrease: 6.8 },
                { period: 'Q2 2024', renewalRate: 85.7, averageValue: 4125, priceIncrease: 8.9 },
                { period: 'Q3 2024', renewalRate: 86.2, averageValue: 4280, priceIncrease: 9.8 },
            ],
            upcomingRenewals: [
                { contractId: 'contract-1', clientName: 'Tech Corp', currentValue: 2890, expiryDate: new Date('2024-12-31'), renewalProbability: 92, estimatedValue: 3120 },
                { contractId: 'contract-2', clientName: 'Design Studio', currentValue: 1650, expiryDate: new Date('2025-01-15'), renewalProbability: 78, estimatedValue: 1780 },
            ],
        };
    }
    async getContractLifecycleMetrics(tenantId, query) {
        return {
            averageContractDuration: 365,
            timeToActivation: 7.5,
            timeToTermination: 45.2,
            statusDistribution: [
                { status: contractLifecycleService_1.ContractStatus.DRAFT, averageDuration: 3.2, count: 8 },
                { status: contractLifecycleService_1.ContractStatus.PENDING_SIGNATURE, averageDuration: 4.1, count: 12 },
                { status: contractLifecycleService_1.ContractStatus.ACTIVE, averageDuration: 365, count: 98 },
                { status: contractLifecycleService_1.ContractStatus.TERMINATED, averageDuration: 298, count: 15 },
            ],
            lifecycle: [
                { stage: 'Draft to Pending', averageDays: 2.1, conversionRate: 95.2 },
                { stage: 'Pending to Active', averageDays: 5.4, conversionRate: 89.7 },
                { stage: 'Active to Renewal', averageDays: 350, conversionRate: 84.4 },
                { stage: 'Active to Termination', averageDays: 298, conversionRate: 8.9 },
            ],
            bottlenecks: [
                { stage: 'Signature Collection', averageDelay: 3.2, factors: ['Client availability', 'Document review time'] },
                { stage: 'Contract Activation', averageDelay: 1.8, factors: ['Payment processing', 'Setup completion'] },
            ],
        };
    }
    async getExpiryForecast(tenantId) {
        return {
            next30Days: 8,
            next60Days: 15,
            next90Days: 23,
            next6Months: 67,
            valueAtRisk: 89650,
            byMonth: [
                { month: 'December', year: 2024, expiringContracts: 8, expiringValue: 12450, renewalProbability: 85.2 },
                { month: 'January', year: 2025, expiringContracts: 12, expiringValue: 18900, renewalProbability: 78.9 },
                { month: 'February', year: 2025, expiringContracts: 15, expiringValue: 23600, renewalProbability: 82.1 },
            ],
            criticalExpirations: [
                { contractId: 'contract-1', clientName: 'Major Client', value: 12000, expiryDate: new Date('2024-12-15'), renewalStatus: 'PENDING', actionRequired: ['Schedule renewal meeting', 'Prepare proposal'] },
                { contractId: 'contract-2', clientName: 'Enterprise Corp', value: 8500, expiryDate: new Date('2024-12-31'), renewalStatus: 'NO_ACTION', actionRequired: ['Initial contact', 'Risk assessment'] },
            ],
        };
    }
    async generateReport(tenantId, generatedBy, options) {
        const query = {
            timeFrame: options.timeFrame,
            dateFrom: options.dateFrom,
            dateTo: options.dateTo,
            contractTypes: options.filters?.contractTypes,
            clientIds: options.filters?.clientIds,
            statuses: options.filters?.statuses,
            groupBy: options.groupBy,
        };
        let data;
        let title;
        switch (options.type) {
            case ReportType.CONTRACT_OVERVIEW:
                data = await this.getContractOverview(tenantId, query);
                title = 'Contract Overview Report';
                break;
            case ReportType.REVENUE_ANALYSIS:
                data = await this.getRevenueAnalysis(tenantId, query);
                title = 'Revenue Analysis Report';
                break;
            case ReportType.CLIENT_ANALYSIS:
                data = await this.getClientAnalysis(tenantId, query);
                title = 'Client Analysis Report';
                break;
            case ReportType.RENEWAL_PERFORMANCE:
                data = await this.getRenewalPerformance(tenantId, query);
                title = 'Renewal Performance Report';
                break;
            case ReportType.CONTRACT_LIFECYCLE:
                data = await this.getContractLifecycleMetrics(tenantId, query);
                title = 'Contract Lifecycle Report';
                break;
            case ReportType.EXPIRY_FORECAST:
                data = await this.getExpiryForecast(tenantId);
                title = 'Contract Expiry Forecast';
                break;
            default:
                throw new errors_1.ValidationError('Unsupported report type');
        }
        const dateRange = this.getDateRange(options.timeFrame, options.dateFrom, options.dateTo);
        const report = {
            id: this.generateId(),
            type: options.type,
            format: options.format,
            title,
            generatedAt: new Date(),
            data,
            metadata: {
                totalRecords: this.getRecordCount(data),
                dateRange,
                filters: options.filters || {},
                generatedBy,
            },
        };
        if (options.format !== ExportFormat.JSON) {
            report.fileUrl = `/api/reports/${report.id}/download`;
        }
        return report;
    }
    async getReportHistory(tenantId) {
        return [
            {
                id: 'report-1',
                type: ReportType.CONTRACT_OVERVIEW,
                format: ExportFormat.PDF,
                title: 'Monthly Contract Overview - March 2024',
                generatedAt: new Date('2024-03-31'),
                fileUrl: '/api/reports/report-1/download',
                data: {},
                metadata: {
                    totalRecords: 145,
                    dateRange: { from: new Date('2024-03-01'), to: new Date('2024-03-31') },
                    filters: {},
                    generatedBy: 'user-admin',
                },
            },
        ];
    }
    async getDashboardMetrics(tenantId) {
        const overview = await this.getContractOverview(tenantId, { timeFrame: TimeFrame.THIS_MONTH });
        const renewals = await this.getRenewalPerformance(tenantId, { timeFrame: TimeFrame.THIS_MONTH });
        const expiry = await this.getExpiryForecast(tenantId);
        return {
            overview: {
                totalContracts: overview.totalContracts,
                activeContracts: overview.activeContracts,
                totalValue: overview.totalValue,
                renewalRate: renewals.renewalRate,
            },
            recentActivity: [
                { type: 'CONTRACT_CREATED', description: 'New membership contract for Tech Corp', timestamp: new Date() },
                { type: 'CONTRACT_RENEWED', description: 'Design Studio contract renewed', timestamp: new Date() },
                { type: 'CONTRACT_EXPIRING', description: 'Enterprise Corp contract expires in 15 days', timestamp: new Date() },
            ],
            alerts: [
                { type: 'EXPIRING_SOON', message: `${expiry.next30Days} contracts expire in 30 days`, severity: 'WARNING' },
                { type: 'RENEWAL_NEEDED', message: `${expiry.criticalExpirations.length} critical renewals need attention`, severity: 'HIGH' },
                { type: 'PAYMENT_OVERDUE', message: '3 contracts have overdue payments', severity: 'HIGH' },
            ],
            kpis: [
                { name: 'Active Contracts', value: overview.activeContracts, change: '+5.2%', trend: 'up' },
                { name: 'Monthly Revenue', value: overview.totalValue, change: '+12.8%', trend: 'up' },
                { name: 'Renewal Rate', value: `${renewals.renewalRate}%`, change: '+2.1%', trend: 'up' },
                { name: 'Average Contract Value', value: overview.averageValue, change: '+8.5%', trend: 'up' },
            ],
        };
    }
    getDateRange(timeFrame, dateFrom, dateTo) {
        const now = new Date();
        let from;
        let to = now;
        switch (timeFrame) {
            case TimeFrame.LAST_7_DAYS:
                from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case TimeFrame.LAST_30_DAYS:
                from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case TimeFrame.LAST_90_DAYS:
                from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case TimeFrame.LAST_6_MONTHS:
                from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                break;
            case TimeFrame.LAST_YEAR:
                from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            case TimeFrame.THIS_MONTH:
                from = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case TimeFrame.THIS_QUARTER:
                const quarter = Math.floor(now.getMonth() / 3);
                from = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case TimeFrame.THIS_YEAR:
                from = new Date(now.getFullYear(), 0, 1);
                break;
            case TimeFrame.CUSTOM_RANGE:
                from = dateFrom || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                to = dateTo || now;
                break;
            default:
                from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        return { from, to };
    }
    getRecordCount(data) {
        if (Array.isArray(data)) {
            return data.length;
        }
        if (data.totalContracts) {
            return data.totalContracts;
        }
        return 0;
    }
    generateId() {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.contractAnalyticsService = new ContractAnalyticsService();
//# sourceMappingURL=contractAnalyticsService.js.map