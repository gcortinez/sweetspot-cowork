import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';
import { contractLifecycleService, ContractStatus, ContractType } from './contractLifecycleService';
import { contractRenewalService } from './contractRenewalService';

export enum ReportType {
  CONTRACT_OVERVIEW = 'CONTRACT_OVERVIEW',
  REVENUE_ANALYSIS = 'REVENUE_ANALYSIS',
  CLIENT_ANALYSIS = 'CLIENT_ANALYSIS',
  RENEWAL_PERFORMANCE = 'RENEWAL_PERFORMANCE',
  CONTRACT_LIFECYCLE = 'CONTRACT_LIFECYCLE',
  EXPIRY_FORECAST = 'EXPIRY_FORECAST',
  CUSTOM = 'CUSTOM'
}

export enum TimeFrame {
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  LAST_6_MONTHS = 'LAST_6_MONTHS',
  LAST_YEAR = 'LAST_YEAR',
  THIS_MONTH = 'THIS_MONTH',
  THIS_QUARTER = 'THIS_QUARTER',
  THIS_YEAR = 'THIS_YEAR',
  CUSTOM_RANGE = 'CUSTOM_RANGE'
}

export enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  JSON = 'JSON'
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

class ContractAnalyticsService {
  async getContractOverview(tenantId: string, query: AnalyticsQuery): Promise<ContractOverviewMetrics> {
    const dateRange = this.getDateRange(query.timeFrame, query.dateFrom, query.dateTo);
    
    // Mock implementation - in reality would query database
    return {
      totalContracts: 145,
      activeContracts: 98,
      totalValue: 245670,
      averageValue: 1694,
      byStatus: [
        { status: ContractStatus.ACTIVE, count: 98, value: 198450, percentage: 67.6 },
        { status: ContractStatus.PENDING_SIGNATURE, count: 12, value: 18600, percentage: 8.3 },
        { status: ContractStatus.DRAFT, count: 8, value: 9200, percentage: 5.5 },
        { status: ContractStatus.TERMINATED, count: 15, value: 12800, percentage: 10.3 },
        { status: ContractStatus.EXPIRED, count: 12, value: 6620, percentage: 8.3 },
      ],
      byType: [
        { type: ContractType.MEMBERSHIP, count: 89, value: 156780, averageValue: 1762 },
        { type: ContractType.EVENT_SPACE, count: 28, value: 52400, averageValue: 1871 },
        { type: ContractType.MEETING_ROOM, count: 18, value: 21600, averageValue: 1200 },
        { type: ContractType.SERVICE, count: 10, value: 14890, averageValue: 1489 },
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

  async getRevenueAnalysis(tenantId: string, query: AnalyticsQuery): Promise<RevenueAnalysis> {
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
        { type: ContractType.MEMBERSHIP, revenue: 156780, percentage: 63.8, growth: 12.4 },
        { type: ContractType.EVENT_SPACE, revenue: 52400, percentage: 21.3, growth: 18.9 },
        { type: ContractType.MEETING_ROOM, revenue: 21600, percentage: 8.8, growth: 8.7 },
        { type: ContractType.SERVICE, revenue: 14890, percentage: 6.1, growth: 22.1 },
      ],
      revenueProjection: [
        { period: 'Q4 2024', projectedRevenue: 85000, certaintyLevel: 'HIGH', factors: ['Confirmed renewals', 'Pipeline conversion'] },
        { period: 'Q1 2025', projectedRevenue: 92000, certaintyLevel: 'MEDIUM', factors: ['Seasonal demand', 'Market expansion'] },
        { period: 'Q2 2025', projectedRevenue: 98000, certaintyLevel: 'LOW', factors: ['New product launch', 'Market conditions'] },
      ],
    };
  }

  async getClientAnalysis(tenantId: string, query: AnalyticsQuery): Promise<ClientAnalysis> {
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

  async getRenewalPerformance(tenantId: string, query: AnalyticsQuery): Promise<RenewalPerformance> {
    return {
      totalRenewals: 45,
      successfulRenewals: 38,
      renewalRate: 84.4,
      averageRenewalTime: 15.2,
      renewalValue: 156780,
      priceIncreaseRate: 8.5,
      byType: [
        { type: ContractType.MEMBERSHIP, renewalRate: 89.2, averageIncrease: 7.8, count: 28 },
        { type: ContractType.EVENT_SPACE, renewalRate: 76.5, averageIncrease: 12.1, count: 8 },
        { type: ContractType.MEETING_ROOM, renewalRate: 82.1, averageIncrease: 5.5, count: 6 },
        { type: ContractType.SERVICE, renewalRate: 90.0, averageIncrease: 15.2, count: 3 },
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

  async getContractLifecycleMetrics(tenantId: string, query: AnalyticsQuery): Promise<ContractLifecycleMetrics> {
    return {
      averageContractDuration: 365,
      timeToActivation: 7.5,
      timeToTermination: 45.2,
      statusDistribution: [
        { status: ContractStatus.DRAFT, averageDuration: 3.2, count: 8 },
        { status: ContractStatus.PENDING_SIGNATURE, averageDuration: 4.1, count: 12 },
        { status: ContractStatus.ACTIVE, averageDuration: 365, count: 98 },
        { status: ContractStatus.TERMINATED, averageDuration: 298, count: 15 },
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

  async getExpiryForecast(tenantId: string): Promise<ExpiryForecast> {
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

  async generateReport(
    tenantId: string,
    generatedBy: string,
    options: GenerateReportOptions
  ): Promise<GeneratedReport> {
    const query: AnalyticsQuery = {
      timeFrame: options.timeFrame,
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
      contractTypes: options.filters?.contractTypes,
      clientIds: options.filters?.clientIds,
      statuses: options.filters?.statuses,
      groupBy: options.groupBy,
    };

    let data: any;
    let title: string;

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
        throw new ValidationError('Unsupported report type');
    }

    const dateRange = this.getDateRange(options.timeFrame, options.dateFrom, options.dateTo);

    const report: GeneratedReport = {
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

    // In a real implementation, this would generate the actual file
    if (options.format !== ExportFormat.JSON) {
      report.fileUrl = `/api/reports/${report.id}/download`;
    }

    return report;
  }

  async getReportHistory(tenantId: string): Promise<GeneratedReport[]> {
    // Mock implementation
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

  async getDashboardMetrics(tenantId: string): Promise<{
    overview: any;
    recentActivity: any[];
    alerts: any[];
    kpis: any[];
  }> {
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

  private getDateRange(timeFrame: TimeFrame, dateFrom?: Date, dateTo?: Date): { from: Date; to: Date } {
    const now = new Date();
    let from: Date;
    let to: Date = now;

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

  private getRecordCount(data: any): number {
    if (Array.isArray(data)) {
      return data.length;
    }
    if (data.totalContracts) {
      return data.totalContracts;
    }
    return 0;
  }

  private generateId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const contractAnalyticsService = new ContractAnalyticsService();