import { FinancialReportType, ReportPeriod, ReportStatus } from '@prisma/client';
export interface FinancialReportData {
    id: string;
    reportType: FinancialReportType;
    period: ReportPeriod;
    startDate: Date;
    endDate: Date;
    title: string;
    description?: string;
    data: any;
    metadata: any;
    status: ReportStatus;
    generatedBy: string;
    generatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateFinancialReportRequest {
    reportType: FinancialReportType;
    period: ReportPeriod;
    startDate: Date;
    endDate: Date;
    title: string;
    description?: string;
    customFilters?: Record<string, any>;
}
export interface IncomeStatementData {
    revenue: {
        total: number;
        breakdown: {
            membership: number;
            dayPasses: number;
            meetings: number;
            services: number;
            other: number;
        };
        monthlyTrend: Array<{
            month: string;
            amount: number;
        }>;
    };
    expenses: {
        total: number;
        breakdown: {
            rent: number;
            utilities: number;
            staff: number;
            marketing: number;
            supplies: number;
            other: number;
        };
        monthlyTrend: Array<{
            month: string;
            amount: number;
        }>;
    };
    grossProfit: number;
    grossMargin: number;
    operatingExpenses: number;
    operatingProfit: number;
    operatingMargin: number;
    netProfit: number;
    netMargin: number;
    ebitda: number;
}
export interface BalanceSheetData {
    assets: {
        current: {
            cash: number;
            accountsReceivable: number;
            prepaidExpenses: number;
            inventory: number;
            total: number;
        };
        fixed: {
            equipment: number;
            furniture: number;
            leaseholdImprovements: number;
            depreciation: number;
            total: number;
        };
        total: number;
    };
    liabilities: {
        current: {
            accountsPayable: number;
            accruals: number;
            deposits: number;
            total: number;
        };
        longTerm: {
            loans: number;
            total: number;
        };
        total: number;
    };
    equity: {
        ownerEquity: number;
        retainedEarnings: number;
        total: number;
    };
}
export interface CashFlowData {
    operating: {
        netIncome: number;
        depreciation: number;
        accountsReceivableChange: number;
        accountsPayableChange: number;
        total: number;
    };
    investing: {
        equipmentPurchases: number;
        total: number;
    };
    financing: {
        loanProceeds: number;
        loanPayments: number;
        ownerContributions: number;
        ownerDrawings: number;
        total: number;
    };
    netCashFlow: number;
    beginningCash: number;
    endingCash: number;
    monthlyFlow: Array<{
        month: string;
        amount: number;
    }>;
}
export interface RevenueAnalysisData {
    totalRevenue: number;
    revenueGrowth: number;
    averageRevenuePerClient: number;
    clientRetentionRate: number;
    revenueBySource: Array<{
        source: string;
        amount: number;
        percentage: number;
    }>;
    revenueByClient: Array<{
        clientId: string;
        clientName: string;
        amount: number;
    }>;
    monthlyRecurring: number;
    oneTimeRevenue: number;
    seasonalTrends: Array<{
        month: string;
        amount: number;
        yoyGrowth: number;
    }>;
    forecastAccuracy: number;
}
export interface ExpenseBreakdownData {
    totalExpenses: number;
    expenseGrowth: number;
    expenseByCategory: Array<{
        category: string;
        amount: number;
        percentage: number;
    }>;
    fixedExpenses: number;
    variableExpenses: number;
    expenseRatio: number;
    costPerClient: number;
    monthlyTrend: Array<{
        month: string;
        amount: number;
    }>;
    budgetVariance: Array<{
        category: string;
        budget: number;
        actual: number;
        variance: number;
    }>;
}
export interface ProfitLossData {
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    grossMargin: number;
    operatingExpenses: {
        salaries: number;
        rent: number;
        utilities: number;
        marketing: number;
        insurance: number;
        depreciation: number;
        other: number;
        total: number;
    };
    operatingIncome: number;
    operatingMargin: number;
    otherIncome: number;
    interestExpense: number;
    taxExpense: number;
    netIncome: number;
    netMargin: number;
    earningsPerShare?: number;
}
export interface BudgetVarianceData {
    period: string;
    budget: {
        revenue: number;
        expenses: number;
        profit: number;
    };
    actual: {
        revenue: number;
        expenses: number;
        profit: number;
    };
    variance: {
        revenue: {
            amount: number;
            percentage: number;
        };
        expenses: {
            amount: number;
            percentage: number;
        };
        profit: {
            amount: number;
            percentage: number;
        };
    };
    categoryVariances: Array<{
        category: string;
        budget: number;
        actual: number;
        variance: number;
        variancePercent: number;
    }>;
}
export interface ReportFilter {
    reportType?: FinancialReportType;
    period?: ReportPeriod;
    startDate?: Date;
    endDate?: Date;
    status?: ReportStatus;
    generatedBy?: string;
}
export declare class FinancialReportService {
    generateReport(tenantId: string, userId: string, request: CreateFinancialReportRequest): Promise<FinancialReportData>;
    private generateReportData;
    private generateIncomeStatement;
    private generateBalanceSheet;
    private generateCashFlow;
    private generateRevenueAnalysis;
    private generateExpenseBreakdown;
    private generateBudgetVariance;
    private getMonthlyRevenueTrend;
    private getMonthlyExpenseTrend;
    private getMonthlyCashFlow;
    private categorizeRevenueBySource;
    private getSeasonalTrends;
    private generateProfitLoss;
    private generateTaxReport;
    getReports(tenantId: string, filters?: ReportFilter, pagination?: {
        skip?: number;
        take?: number;
    }): Promise<{
        reports: FinancialReportData[];
        total: number;
        hasMore: boolean;
    }>;
    getReportById(tenantId: string, reportId: string): Promise<FinancialReportData | null>;
    deleteReport(tenantId: string, reportId: string): Promise<void>;
    private buildReportWhereClause;
    private mapReportToData;
}
export declare const financialReportService: FinancialReportService;
//# sourceMappingURL=financialReportService.d.ts.map