import { prisma } from '../lib/prisma';
import {
  FinancialReportType,
  ReportPeriod,
  ReportStatus,
  ForecastType,
  ForecastPeriod,
  ForecastMethod,
  ForecastStatus,
  AnalysisType,
  DashboardType,
  Prisma
} from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

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
    monthlyTrend: Array<{ month: string; amount: number }>;
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
    monthlyTrend: Array<{ month: string; amount: number }>;
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
  monthlyFlow: Array<{ month: string; amount: number }>;
}

export interface RevenueAnalysisData {
  totalRevenue: number;
  revenueGrowth: number;
  averageRevenuePerClient: number;
  clientRetentionRate: number;
  revenueBySource: Array<{ source: string; amount: number; percentage: number }>;
  revenueByClient: Array<{ clientId: string; clientName: string; amount: number }>;
  monthlyRecurring: number;
  oneTimeRevenue: number;
  seasonalTrends: Array<{ month: string; amount: number; yoyGrowth: number }>;
  forecastAccuracy: number;
}

export interface ExpenseBreakdownData {
  totalExpenses: number;
  expenseGrowth: number;
  expenseByCategory: Array<{ category: string; amount: number; percentage: number }>;
  fixedExpenses: number;
  variableExpenses: number;
  expenseRatio: number;
  costPerClient: number;
  monthlyTrend: Array<{ month: string; amount: number }>;
  budgetVariance: Array<{ category: string; budget: number; actual: number; variance: number }>;
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
    revenue: { amount: number; percentage: number };
    expenses: { amount: number; percentage: number };
    profit: { amount: number; percentage: number };
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

// ============================================================================
// FINANCIAL REPORT SERVICE
// ============================================================================

export class FinancialReportService {

  // ============================================================================
  // REPORT GENERATION
  // ============================================================================

  async generateReport(
    tenantId: string,
    userId: string,
    request: CreateFinancialReportRequest
  ): Promise<FinancialReportData> {
    try {
      const reportData = await this.generateReportData(tenantId, request);
      
      const report = await prisma.financialReport.create({
        data: {
          tenantId,
          reportType: request.reportType,
          period: request.period,
          startDate: request.startDate,
          endDate: request.endDate,
          title: request.title,
          description: request.description,
          data: reportData,
          metadata: {
            generationTime: new Date().toISOString(),
            filters: request.customFilters || {},
            version: '1.0',
          },
          status: ReportStatus.COMPLETED,
          generatedBy: userId,
        },
      });

      logger.info('Financial report generated successfully', {
        tenantId,
        reportId: report.id,
        reportType: request.reportType,
        userId,
      });

      return this.mapReportToData(report);
    } catch (error) {
      logger.error('Failed to generate financial report', {
        tenantId,
        request,
        userId,
      }, error as Error);
      throw error;
    }
  }

  private async generateReportData(
    tenantId: string,
    request: CreateFinancialReportRequest
  ): Promise<any> {
    switch (request.reportType) {
      case FinancialReportType.INCOME_STATEMENT:
        return await this.generateIncomeStatement(tenantId, request.startDate, request.endDate);
      case FinancialReportType.BALANCE_SHEET:
        return await this.generateBalanceSheet(tenantId, request.endDate);
      case FinancialReportType.CASH_FLOW:
        return await this.generateCashFlow(tenantId, request.startDate, request.endDate);
      case FinancialReportType.REVENUE_ANALYSIS:
        return await this.generateRevenueAnalysis(tenantId, request.startDate, request.endDate);
      case FinancialReportType.EXPENSE_BREAKDOWN:
        return await this.generateExpenseBreakdown(tenantId, request.startDate, request.endDate);
      case FinancialReportType.PROFIT_LOSS:
        return await this.generateProfitLoss(tenantId, request.startDate, request.endDate);
      case FinancialReportType.BUDGET_VARIANCE:
        return await this.generateBudgetVariance(tenantId, request.startDate, request.endDate);
      case FinancialReportType.TAX_REPORT:
        return await this.generateTaxReport(tenantId, request.startDate, request.endDate);
      default:
        throw new Error(`Unsupported report type: ${request.reportType}`);
    }
  }

  // ============================================================================
  // INCOME STATEMENT GENERATION
  // ============================================================================

  private async generateIncomeStatement(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IncomeStatementData> {
    // Get all invoices in the period
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
        status: 'PAID',
      },
      include: {
        items: true,
        client: true,
      },
    });

    // Calculate revenue breakdown
    const revenueBreakdown = {
      membership: 0,
      dayPasses: 0,
      meetings: 0,
      services: 0,
      other: 0,
    };

    let totalRevenue = 0;

    invoices.forEach(invoice => {
      const amount = Number(invoice.total);
      totalRevenue += amount;

      // Categorize revenue based on invoice items
      invoice.items.forEach(item => {
        const itemAmount = Number(item.total);
        const description = item.description.toLowerCase();
        
        if (description.includes('membership') || description.includes('plan')) {
          revenueBreakdown.membership += itemAmount;
        } else if (description.includes('day pass') || description.includes('daily')) {
          revenueBreakdown.dayPasses += itemAmount;
        } else if (description.includes('meeting') || description.includes('room')) {
          revenueBreakdown.meetings += itemAmount;
        } else if (description.includes('service')) {
          revenueBreakdown.services += itemAmount;
        } else {
          revenueBreakdown.other += itemAmount;
        }
      });
    });

    // Get monthly revenue trend
    const monthlyTrend = await this.getMonthlyRevenueTrend(tenantId, startDate, endDate);

    // Calculate expenses (simplified - in production would come from expense tracking)
    const totalExpenses = totalRevenue * 0.7; // Simplified calculation
    const expenseBreakdown = {
      rent: totalExpenses * 0.4,
      utilities: totalExpenses * 0.1,
      staff: totalExpenses * 0.3,
      marketing: totalExpenses * 0.1,
      supplies: totalExpenses * 0.05,
      other: totalExpenses * 0.05,
    };

    const grossProfit = totalRevenue - (totalExpenses * 0.3); // COGS
    const grossMargin = (grossProfit / totalRevenue) * 100;
    const operatingExpenses = totalExpenses * 0.7;
    const operatingProfit = grossProfit - operatingExpenses;
    const operatingMargin = (operatingProfit / totalRevenue) * 100;
    const netProfit = operatingProfit - (totalRevenue * 0.05); // Tax estimation
    const netMargin = (netProfit / totalRevenue) * 100;
    const ebitda = operatingProfit + (totalExpenses * 0.02); // Add back depreciation

    return {
      revenue: {
        total: totalRevenue,
        breakdown: revenueBreakdown,
        monthlyTrend,
      },
      expenses: {
        total: totalExpenses,
        breakdown: expenseBreakdown,
        monthlyTrend: await this.getMonthlyExpenseTrend(tenantId, startDate, endDate),
      },
      grossProfit,
      grossMargin,
      operatingExpenses,
      operatingProfit,
      operatingMargin,
      netProfit,
      netMargin,
      ebitda,
    };
  }

  // ============================================================================
  // BALANCE SHEET GENERATION
  // ============================================================================

  private async generateBalanceSheet(
    tenantId: string,
    asOfDate: Date
  ): Promise<BalanceSheetData> {
    // Get accounts receivable (unpaid invoices)
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['SENT', 'OVERDUE'] },
        createdAt: { lte: asOfDate },
      },
    });

    const accountsReceivable = unpaidInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total),
      0
    );

    // Get cash from payments
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        processedAt: { lte: asOfDate },
      },
    });

    const cash = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    // Simplified balance sheet structure
    const assets = {
      current: {
        cash,
        accountsReceivable,
        prepaidExpenses: cash * 0.05,
        inventory: cash * 0.02,
        total: 0,
      },
      fixed: {
        equipment: cash * 0.8,
        furniture: cash * 0.3,
        leaseholdImprovements: cash * 0.5,
        depreciation: cash * 0.1,
        total: 0,
      },
      total: 0,
    };

    assets.current.total = Object.values(assets.current).reduce((sum, val) => sum + val, 0) - assets.current.total;
    assets.fixed.total = Object.values(assets.fixed).reduce((sum, val) => sum + val, 0) - assets.fixed.total;
    assets.total = assets.current.total + assets.fixed.total;

    const liabilities = {
      current: {
        accountsPayable: assets.total * 0.1,
        accruals: assets.total * 0.05,
        deposits: assets.total * 0.03,
        total: 0,
      },
      longTerm: {
        loans: assets.total * 0.2,
        total: 0,
      },
      total: 0,
    };

    liabilities.current.total = Object.values(liabilities.current).reduce((sum, val) => sum + val, 0) - liabilities.current.total;
    liabilities.longTerm.total = liabilities.longTerm.loans;
    liabilities.total = liabilities.current.total + liabilities.longTerm.total;

    const equity = {
      ownerEquity: assets.total * 0.6,
      retainedEarnings: assets.total - liabilities.total - (assets.total * 0.6),
      total: 0,
    };

    equity.total = equity.ownerEquity + equity.retainedEarnings;

    return {
      assets,
      liabilities,
      equity,
    };
  }

  // ============================================================================
  // CASH FLOW GENERATION
  // ============================================================================

  private async generateCashFlow(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CashFlowData> {
    // Get payments (cash inflows)
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        processedAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
    });

    const totalInflows = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    // Simplified cash flow calculation
    const netIncome = totalInflows * 0.2; // Net profit margin
    const depreciation = totalInflows * 0.02;
    const accountsReceivableChange = totalInflows * -0.05;
    const accountsPayableChange = totalInflows * 0.03;

    const operating = {
      netIncome,
      depreciation,
      accountsReceivableChange,
      accountsPayableChange,
      total: netIncome + depreciation + accountsReceivableChange + accountsPayableChange,
    };

    const investing = {
      equipmentPurchases: totalInflows * -0.1,
      total: totalInflows * -0.1,
    };

    const financing = {
      loanProceeds: 0,
      loanPayments: totalInflows * -0.05,
      ownerContributions: 0,
      ownerDrawings: totalInflows * -0.1,
      total: totalInflows * -0.15,
    };

    const netCashFlow = operating.total + investing.total + financing.total;
    const beginningCash = totalInflows * 0.5; // Simplified
    const endingCash = beginningCash + netCashFlow;

    const monthlyFlow = await this.getMonthlyCashFlow(tenantId, startDate, endDate);

    return {
      operating,
      investing,
      financing,
      netCashFlow,
      beginningCash,
      endingCash,
      monthlyFlow,
    };
  }

  // ============================================================================
  // REVENUE ANALYSIS GENERATION
  // ============================================================================

  private async generateRevenueAnalysis(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RevenueAnalysisData> {
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
        status: 'PAID',
      },
      include: {
        client: true,
        items: true,
      },
    });

    const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);

    // Calculate previous period for growth comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodLength);
    const previousEnd = startDate;

    const previousInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: { gte: previousStart, lte: previousEnd },
        status: 'PAID',
      },
    });

    const previousRevenue = previousInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Get unique clients
    const uniqueClients = new Set(invoices.map(invoice => invoice.clientId));
    const averageRevenuePerClient = totalRevenue / uniqueClients.size;

    // Revenue by source analysis
    const revenueBySource = this.categorizeRevenueBySource(invoices);

    // Revenue by client
    const clientRevenue = new Map<string, { name: string; amount: number }>();
    invoices.forEach(invoice => {
      const existing = clientRevenue.get(invoice.clientId) || {
        name: `${invoice.client.name}`,
        amount: 0,
      };
      existing.amount += Number(invoice.total);
      clientRevenue.set(invoice.clientId, existing);
    });

    const revenueByClient = Array.from(clientRevenue.entries()).map(([clientId, data]) => ({
      clientId,
      clientName: data.name,
      amount: data.amount,
    }));

    // Calculate monthly recurring vs one-time
    const monthlyRecurring = totalRevenue * 0.7; // Simplified
    const oneTimeRevenue = totalRevenue * 0.3;

    // Get seasonal trends
    const seasonalTrends = await this.getSeasonalTrends(tenantId, startDate, endDate);

    return {
      totalRevenue,
      revenueGrowth,
      averageRevenuePerClient,
      clientRetentionRate: 85, // Simplified calculation
      revenueBySource,
      revenueByClient,
      monthlyRecurring,
      oneTimeRevenue,
      seasonalTrends,
      forecastAccuracy: 92, // Simplified
    };
  }

  // ============================================================================
  // EXPENSE BREAKDOWN GENERATION
  // ============================================================================

  private async generateExpenseBreakdown(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ExpenseBreakdownData> {
    // In a real implementation, this would pull from expense tracking
    // For now, we'll estimate based on revenue
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
        status: 'PAID',
      },
    });

    const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    const totalExpenses = totalRevenue * 0.75; // 75% expense ratio

    const expenseByCategory = [
      { category: 'Rent & Utilities', amount: totalExpenses * 0.4, percentage: 40 },
      { category: 'Staff Salaries', amount: totalExpenses * 0.3, percentage: 30 },
      { category: 'Marketing', amount: totalExpenses * 0.1, percentage: 10 },
      { category: 'Supplies', amount: totalExpenses * 0.08, percentage: 8 },
      { category: 'Insurance', amount: totalExpenses * 0.05, percentage: 5 },
      { category: 'Other', amount: totalExpenses * 0.07, percentage: 7 },
    ];

    const fixedExpenses = totalExpenses * 0.6;
    const variableExpenses = totalExpenses * 0.4;
    const expenseRatio = (totalExpenses / totalRevenue) * 100;
    const costPerClient = totalExpenses / new Set(invoices.map(i => i.clientId)).size;

    const monthlyTrend = await this.getMonthlyExpenseTrend(tenantId, startDate, endDate);

    // Budget variance (simplified)
    const budgetVariance = expenseByCategory.map(category => ({
      category: category.category,
      budget: category.amount * 1.1, // Budget was 10% higher
      actual: category.amount,
      variance: category.amount * -0.1,
    }));

    return {
      totalExpenses,
      expenseGrowth: 5.2, // Simplified
      expenseByCategory,
      fixedExpenses,
      variableExpenses,
      expenseRatio,
      costPerClient,
      monthlyTrend,
      budgetVariance,
    };
  }

  // ============================================================================
  // BUDGET VARIANCE GENERATION
  // ============================================================================

  private async generateBudgetVariance(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BudgetVarianceData> {
    // Get budget plan for the period
    const budgetPlan = await prisma.budgetPlan.findFirst({
      where: {
        tenantId,
        budgetYear: startDate.getFullYear(),
        status: 'ACTIVE',
      },
      include: {
        expenses: true,
      },
    });

    // Get actual financial data
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
        status: 'PAID',
      },
    });

    const actualRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    const actualExpenses = actualRevenue * 0.75; // Simplified
    const actualProfit = actualRevenue - actualExpenses;

    let budgetRevenue = Number(budgetPlan?.totalBudget || 0);
    let budgetExpenses = budgetRevenue * 0.7;
    let budgetProfit = budgetRevenue - budgetExpenses;

    // Adjust for period (if not full year)
    const periodMonths = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (periodMonths < 12) {
      const factor = periodMonths / 12;
      budgetRevenue *= factor;
      budgetExpenses *= factor;
      budgetProfit *= factor;
    }

    const variance = {
      revenue: {
        amount: actualRevenue - budgetRevenue,
        percentage: budgetRevenue > 0 ? ((actualRevenue - budgetRevenue) / budgetRevenue) * 100 : 0,
      },
      expenses: {
        amount: actualExpenses - budgetExpenses,
        percentage: budgetExpenses > 0 ? ((actualExpenses - budgetExpenses) / budgetExpenses) * 100 : 0,
      },
      profit: {
        amount: actualProfit - budgetProfit,
        percentage: budgetProfit > 0 ? ((actualProfit - budgetProfit) / budgetProfit) * 100 : 0,
      },
    };

    // Category variances
    const categoryVariances = budgetPlan?.expenses.map(expense => ({
      category: expense.category,
      budget: Number(expense.plannedAmount),
      actual: Number(expense.actualAmount),
      variance: Number(expense.variance),
      variancePercent: Number(expense.variancePercent),
    })) || [];

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      budget: {
        revenue: budgetRevenue,
        expenses: budgetExpenses,
        profit: budgetProfit,
      },
      actual: {
        revenue: actualRevenue,
        expenses: actualExpenses,
        profit: actualProfit,
      },
      variance,
      categoryVariances,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async getMonthlyRevenueTrend(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ month: string; amount: number }>> {
    const result: Array<{ month: string; amount: number }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

      const monthlyInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          createdAt: { gte: monthStart, lte: monthEnd },
          status: 'PAID',
        },
      });

      const amount = monthlyInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
      
      result.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        amount,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return result;
  }

  private async getMonthlyExpenseTrend(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ month: string; amount: number }>> {
    // Simplified - in production would track actual expenses
    const revenueTrend = await this.getMonthlyRevenueTrend(tenantId, startDate, endDate);
    return revenueTrend.map(item => ({
      month: item.month,
      amount: item.amount * 0.75, // 75% expense ratio
    }));
  }

  private async getMonthlyCashFlow(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ month: string; amount: number }>> {
    const revenueTrend = await this.getMonthlyRevenueTrend(tenantId, startDate, endDate);
    return revenueTrend.map(item => ({
      month: item.month,
      amount: item.amount * 0.2, // Net cash flow approximation
    }));
  }

  private categorizeRevenueBySource(invoices: any[]): Array<{ source: string; amount: number; percentage: number }> {
    const sources = new Map<string, number>();
    let totalRevenue = 0;

    invoices.forEach(invoice => {
      const amount = Number(invoice.total);
      totalRevenue += amount;

      // Categorize based on invoice items
      invoice.items.forEach((item: any) => {
        const description = item.description.toLowerCase();
        let source = 'Other';

        if (description.includes('membership') || description.includes('plan')) {
          source = 'Membership Plans';
        } else if (description.includes('day pass') || description.includes('daily')) {
          source = 'Day Passes';
        } else if (description.includes('meeting') || description.includes('room')) {
          source = 'Meeting Rooms';
        } else if (description.includes('service')) {
          source = 'Additional Services';
        }

        const current = sources.get(source) || 0;
        sources.set(source, current + Number(item.total));
      });
    });

    return Array.from(sources.entries()).map(([source, amount]) => ({
      source,
      amount,
      percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
    }));
  }

  private async getSeasonalTrends(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ month: string; amount: number; yoyGrowth: number }>> {
    // Simplified seasonal analysis
    const monthlyTrend = await this.getMonthlyRevenueTrend(tenantId, startDate, endDate);
    
    return monthlyTrend.map(item => ({
      month: item.month,
      amount: item.amount,
      yoyGrowth: Math.random() * 20 - 10, // Simplified random growth
    }));
  }

  private async generateProfitLoss(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProfitLossData> {
    const incomeStatement = await this.generateIncomeStatement(tenantId, startDate, endDate);
    
    return {
      revenue: incomeStatement.revenue.total,
      costOfGoodsSold: incomeStatement.revenue.total * 0.3,
      grossProfit: incomeStatement.grossProfit,
      grossMargin: incomeStatement.grossMargin,
      operatingExpenses: {
        salaries: incomeStatement.expenses.breakdown.staff,
        rent: incomeStatement.expenses.breakdown.rent,
        utilities: incomeStatement.expenses.breakdown.utilities,
        marketing: incomeStatement.expenses.breakdown.marketing,
        insurance: incomeStatement.expenses.breakdown.other * 0.5,
        depreciation: incomeStatement.revenue.total * 0.02,
        other: incomeStatement.expenses.breakdown.supplies + (incomeStatement.expenses.breakdown.other * 0.5),
        total: incomeStatement.operatingExpenses,
      },
      operatingIncome: incomeStatement.operatingProfit,
      operatingMargin: incomeStatement.operatingMargin,
      otherIncome: incomeStatement.revenue.total * 0.01,
      interestExpense: incomeStatement.revenue.total * 0.02,
      taxExpense: incomeStatement.revenue.total * 0.05,
      netIncome: incomeStatement.netProfit,
      netMargin: incomeStatement.netMargin,
    };
  }

  private async generateTaxReport(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const profitLoss = await this.generateProfitLoss(tenantId, startDate, endDate);
    
    return {
      grossIncome: profitLoss.revenue,
      deductions: {
        businessExpenses: profitLoss.operatingExpenses.total,
        depreciation: profitLoss.operatingExpenses.depreciation,
        interestExpense: profitLoss.interestExpense,
        total: profitLoss.operatingExpenses.total + profitLoss.operatingExpenses.depreciation + profitLoss.interestExpense,
      },
      taxableIncome: profitLoss.netIncome,
      estimatedTax: profitLoss.taxExpense,
      quarterlyPayments: profitLoss.taxExpense / 4,
    };
  }

  // ============================================================================
  // REPORT MANAGEMENT
  // ============================================================================

  async getReports(
    tenantId: string,
    filters: ReportFilter = {},
    pagination: { skip?: number; take?: number } = {}
  ): Promise<{
    reports: FinancialReportData[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const whereClause = this.buildReportWhereClause(tenantId, filters);

      const [reports, total] = await Promise.all([
        prisma.financialReport.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: pagination.skip || 0,
          take: pagination.take || 50,
        }),
        prisma.financialReport.count({ where: whereClause }),
      ]);

      const reportData = reports.map(report => this.mapReportToData(report));
      const hasMore = (pagination.skip || 0) + reportData.length < total;

      return {
        reports: reportData,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error('Failed to get financial reports', { tenantId, filters }, error as Error);
      throw error;
    }
  }

  async getReportById(
    tenantId: string,
    reportId: string
  ): Promise<FinancialReportData | null> {
    try {
      const report = await prisma.financialReport.findFirst({
        where: {
          id: reportId,
          tenantId,
        },
      });

      return report ? this.mapReportToData(report) : null;
    } catch (error) {
      logger.error('Failed to get financial report by ID', { tenantId, reportId }, error as Error);
      throw error;
    }
  }

  async deleteReport(
    tenantId: string,
    reportId: string
  ): Promise<void> {
    try {
      await prisma.financialReport.update({
        where: {
          id: reportId,
          tenantId,
        },
        data: {
          status: ReportStatus.ARCHIVED,
        },
      });

      logger.info('Financial report archived successfully', { tenantId, reportId });
    } catch (error) {
      logger.error('Failed to archive financial report', { tenantId, reportId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildReportWhereClause(tenantId: string, filters: ReportFilter): any {
    const whereClause: any = { tenantId };

    if (filters.reportType) {
      whereClause.reportType = filters.reportType;
    }

    if (filters.period) {
      whereClause.period = filters.period;
    }

    if (filters.startDate && filters.endDate) {
      whereClause.startDate = { gte: filters.startDate };
      whereClause.endDate = { lte: filters.endDate };
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.generatedBy) {
      whereClause.generatedBy = filters.generatedBy;
    }

    return whereClause;
  }

  private mapReportToData(report: any): FinancialReportData {
    return {
      id: report.id,
      reportType: report.reportType,
      period: report.period,
      startDate: report.startDate,
      endDate: report.endDate,
      title: report.title,
      description: report.description,
      data: report.data,
      metadata: report.metadata,
      status: report.status,
      generatedBy: report.generatedBy,
      generatedAt: report.generatedAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }
}

export const financialReportService = new FinancialReportService();