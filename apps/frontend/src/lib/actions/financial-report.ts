'use server'

import { requireAuth, requireAdmin, withTenantContext, getTenantPrisma } from '../server/tenant-context'
import { validateData } from '../validations'
import { 
  createFinancialReportSchema, 
  financialReportFiltersSchema,
  revenueAnalysisSchema,
  expenseAnalysisSchema,
  cashFlowAnalysisSchema,
  profitLossAnalysisSchema,
  budgetVarianceAnalysisSchema,
  createForecastSchema,
  financialMetricsSchema,
  taxReportSchema,
  type CreateFinancialReportRequest,
  type FinancialReportFilters,
  type RevenueAnalysisRequest,
  type ExpenseAnalysisRequest,
  type CashFlowAnalysisRequest,
  type ProfitLossAnalysisRequest,
  type BudgetVarianceAnalysisRequest,
  type CreateForecastRequest,
  type FinancialMetricsRequest,
  type TaxReportRequest
} from '../validations/financial-report'
import { ActionResult } from '@sweetspot/shared'
import { QueryBuilder } from '../utils/search'

/**
 * Financial Report Generation
 */

export async function createFinancialReportAction(data: CreateFinancialReportRequest): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(createFinancialReportSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Check authentication and permissions
    await requireAuth()
    await requireAdmin()
    
    const validatedData = validation.data
    const prisma = await getTenantPrisma()

    // Generate report data based on type
    let reportData: any = {}
    
    switch (validatedData.reportType) {
      case 'INCOME_STATEMENT':
        reportData = await generateIncomeStatement(validatedData, prisma)
        break
      case 'REVENUE_ANALYSIS':
        reportData = await generateRevenueAnalysis(validatedData, prisma)
        break
      case 'CASH_FLOW':
        reportData = await generateCashFlowReport(validatedData, prisma)
        break
      case 'PROFIT_LOSS':
        reportData = await generateProfitLossReport(validatedData, prisma)
        break
      default:
        return {
          success: false,
          error: `Report type ${validatedData.reportType} not yet implemented`,
        }
    }

    // Create report record
    const report = await prisma.financialReport.create({
      data: {
        reportType: validatedData.reportType,
        period: validatedData.period,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        title: validatedData.title,
        description: validatedData.description,
        data: reportData,
        status: 'COMPLETED',
        generatedBy: (await requireAuth()).id,
      },
      include: {
        generator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return {
      success: true,
      data: report,
    }

  } catch (error: any) {
    console.error('Financial report creation error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to create financial report',
    }
  }
}

export async function getFinancialReportAction(id: string): Promise<ActionResult<any>> {
  try {
    // Check authentication
    await requireAuth()
    
    const prisma = await getTenantPrisma()

    const report = await prisma.financialReport.findUnique({
      where: { id },
      include: {
        generator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!report) {
      return {
        success: false,
        error: 'Financial report not found',
      }
    }

    return {
      success: true,
      data: report,
    }

  } catch (error: any) {
    console.error('Financial report retrieval error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to retrieve financial report',
    }
  }
}

export async function listFinancialReportsAction(filters: FinancialReportFilters): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(financialReportFiltersSchema, filters)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Check authentication
    await requireAuth()
    
    const validatedFilters = validation.data
    const { page, limit, sortBy, sortOrder, ...searchFilters } = validatedFilters

    const prisma = await getTenantPrisma()

    // Build query
    const queryBuilder = new QueryBuilder()

    // Add search filters
    if (searchFilters.search) {
      queryBuilder.addSearch(searchFilters.search, {
        fields: ['title', 'description'],
      })
    }

    if (searchFilters.reportType) {
      queryBuilder.addFilter('reportType', searchFilters.reportType)
    }

    if (searchFilters.period) {
      queryBuilder.addFilter('period', searchFilters.period)
    }

    if (searchFilters.status) {
      queryBuilder.addFilter('status', searchFilters.status)
    }

    if (searchFilters.generatedBy) {
      queryBuilder.addFilter('generatedBy', searchFilters.generatedBy)
    }

    if (searchFilters.startDate) {
      queryBuilder.addFilter('generatedAt', { gte: searchFilters.startDate })
    }

    if (searchFilters.endDate) {
      queryBuilder.addFilter('generatedAt', { lte: searchFilters.endDate })
    }

    const { where, orderBy } = queryBuilder
      .addSort(sortBy, sortOrder)
      .build()

    // Get total count
    const totalCount = await prisma.financialReport.count({ where })

    // Get reports
    const reports = await prisma.financialReport.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        generator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return {
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
        },
      },
    }

  } catch (error: any) {
    console.error('Financial report listing error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to retrieve financial reports',
    }
  }
}

/**
 * Specific Analysis Functions
 */

export async function generateRevenueAnalysisAction(data: RevenueAnalysisRequest): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(revenueAnalysisSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Check authentication
    await requireAuth()
    
    const validatedData = validation.data
    const prisma = await getTenantPrisma()

    const analysis = await generateRevenueAnalysis(validatedData, prisma)

    return {
      success: true,
      data: analysis,
    }

  } catch (error: any) {
    console.error('Revenue analysis error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to generate revenue analysis',
    }
  }
}

export async function generateCashFlowAnalysisAction(data: CashFlowAnalysisRequest): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(cashFlowAnalysisSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Check authentication
    await requireAuth()
    
    const validatedData = validation.data
    const prisma = await getTenantPrisma()

    const analysis = await generateCashFlowAnalysis(validatedData, prisma)

    return {
      success: true,
      data: analysis,
    }

  } catch (error: any) {
    console.error('Cash flow analysis error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to generate cash flow analysis',
    }
  }
}

export async function generateFinancialMetricsAction(data: FinancialMetricsRequest): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(financialMetricsSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Check authentication
    await requireAuth()
    
    const validatedData = validation.data
    const prisma = await getTenantPrisma()

    const metrics = await generateFinancialMetrics(validatedData, prisma)

    return {
      success: true,
      data: metrics,
    }

  } catch (error: any) {
    console.error('Financial metrics error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to generate financial metrics',
    }
  }
}

/**
 * Helper Functions for Report Generation
 */

async function generateIncomeStatement(data: any, prisma: any): Promise<any> {
  const { startDate, endDate } = data

  // Get revenue from completed payments
  const revenue = await prisma.payment.aggregate({
    where: {
      status: 'COMPLETED',
      amount: { gt: 0 },
      createdAt: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  })

  // For expenses, we would need an expense model - for now, use negative amounts as expenses
  const expenses = await prisma.payment.aggregate({
    where: {
      status: 'COMPLETED',
      amount: { lt: 0 },
      createdAt: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  })

  const totalRevenue = Number(revenue._sum.amount || 0)
  const totalExpenses = Math.abs(Number(expenses._sum.amount || 0))
  const netIncome = totalRevenue - totalExpenses

  return {
    period: { startDate, endDate },
    revenue: {
      total: totalRevenue,
      breakdown: {
        // Could add breakdown by service type, space type, etc.
      },
    },
    expenses: {
      total: totalExpenses,
      breakdown: {
        // Could add breakdown by category
      },
    },
    netIncome,
    grossMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
  }
}

async function generateRevenueAnalysis(data: any, prisma: any): Promise<any> {
  const { startDate, endDate, groupBy, includeBreakdown, breakdownBy } = data

  // Base revenue query
  const revenueData = await prisma.payment.findMany({
    where: {
      status: 'COMPLETED',
      amount: { gt: 0 },
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      client: { select: { id: true, name: true } },
      invoice: {
        include: {
          items: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Group data by time period
  const groupedData = groupRevenueByPeriod(revenueData, groupBy)

  // Calculate totals
  const totalRevenue = revenueData.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const averageTransaction = revenueData.length > 0 ? totalRevenue / revenueData.length : 0

  // Breakdown analysis
  let breakdown = {}
  if (includeBreakdown && breakdownBy) {
    breakdown = generateRevenueBreakdown(revenueData, breakdownBy)
  }

  return {
    period: { startDate, endDate },
    totalRevenue,
    averageTransaction,
    transactionCount: revenueData.length,
    groupedData,
    breakdown,
    trends: calculateRevenueTrends(groupedData),
  }
}

async function generateCashFlowAnalysis(data: any, prisma: any): Promise<any> {
  const { startDate, endDate, includeProjections, projectionDays } = data

  // Get all payments (inflows and outflows)
  const payments = await prisma.payment.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: startDate, lte: endDate },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Separate inflows and outflows
  const inflows = payments.filter(p => Number(p.amount) > 0)
  const outflows = payments.filter(p => Number(p.amount) < 0)

  const totalInflows = inflows.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalOutflows = Math.abs(outflows.reduce((sum, p) => sum + Number(p.amount), 0))
  const netCashFlow = totalInflows - totalOutflows

  // Generate daily cash flow
  const dailyCashFlow = generateDailyCashFlow(payments, startDate, endDate)

  let projections = {}
  if (includeProjections) {
    projections = generateCashFlowProjections(dailyCashFlow, projectionDays)
  }

  return {
    period: { startDate, endDate },
    summary: {
      totalInflows,
      totalOutflows,
      netCashFlow,
      inflowCount: inflows.length,
      outflowCount: outflows.length,
    },
    dailyCashFlow,
    projections,
  }
}

async function generateFinancialMetrics(data: any, prisma: any): Promise<any> {
  const { startDate, endDate, includeKPIs, includeRatios, includeTrends } = data

  const metrics: any = {}

  if (includeKPIs) {
    // Revenue Growth
    const currentRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        amount: { gt: 0 },
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    })

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime()
    const previousStartDate = new Date(startDate.getTime() - periodLength)
    const previousEndDate = new Date(startDate.getTime())

    const previousRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        amount: { gt: 0 },
        createdAt: { gte: previousStartDate, lte: previousEndDate },
      },
      _sum: { amount: true },
    })

    const currentRev = Number(currentRevenue._sum.amount || 0)
    const previousRev = Number(previousRevenue._sum.amount || 0)
    const revenueGrowth = previousRev > 0 ? ((currentRev - previousRev) / previousRev) * 100 : 0

    metrics.kpis = {
      revenueGrowth,
      totalRevenue: currentRev,
      previousRevenue: previousRev,
    }
  }

  if (includeRatios) {
    // Calculate key financial ratios
    metrics.ratios = {
      // Add ratio calculations based on available data
    }
  }

  if (includeTrends) {
    // Generate trend analysis
    metrics.trends = {
      // Add trend calculations
    }
  }

  return metrics
}

// Helper functions for data processing
function groupRevenueByPeriod(data: any[], groupBy: string): any[] {
  // Implementation for grouping revenue data by time period
  return []
}

function generateRevenueBreakdown(data: any[], breakdownBy: string): any {
  // Implementation for breaking down revenue by specified dimension
  return {}
}

function calculateRevenueTrends(groupedData: any[]): any {
  // Implementation for calculating revenue trends
  return {}
}

function generateDailyCashFlow(payments: any[], startDate: Date, endDate: Date): any[] {
  // Implementation for generating daily cash flow data
  return []
}

function generateCashFlowProjections(dailyCashFlow: any[], projectionDays: number): any {
  // Implementation for cash flow projections
  return {}
}