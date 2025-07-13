import { z } from 'zod'

/**
 * Validation schemas for Financial Reports
 */

// Enums
export const FinancialReportTypeSchema = z.enum([
  'INCOME_STATEMENT',
  'BALANCE_SHEET',
  'CASH_FLOW',
  'REVENUE_ANALYSIS',
  'EXPENSE_BREAKDOWN',
  'PROFIT_LOSS',
  'BUDGET_VARIANCE',
  'TAX_REPORT',
  'CUSTOM'
])

export const ReportPeriodSchema = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'CUSTOM'
])

export const FinancialReportStatusSchema = z.enum([
  'GENERATING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
])

export const ForecastTypeSchema = z.enum([
  'REVENUE',
  'EXPENSE',
  'CASH_FLOW',
  'PROFIT',
  'BUDGET'
])

// Financial report schemas
export const createFinancialReportSchema = z.object({
  reportType: FinancialReportTypeSchema,
  period: ReportPeriodSchema,
  startDate: z.date({
    required_error: 'Start date is required',
    invalid_type_error: 'Start date must be a valid date',
  }),
  endDate: z.date({
    required_error: 'End date is required',
    invalid_type_error: 'End date must be a valid date',
  }),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  includeComparisons: z.boolean().default(false),
  compareWithPreviousPeriod: z.boolean().default(false),
  includeCharts: z.boolean().default(true),
  includeDetails: z.boolean().default(true),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  filters: z.object({
    clientIds: z.array(z.string().uuid()).optional(),
    spaceIds: z.array(z.string().uuid()).optional(),
    categories: z.array(z.string()).optional(),
    minAmount: z.number().optional(),
    maxAmount: z.number().optional(),
  }).optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)

export const financialReportFiltersSchema = z.object({
  reportType: FinancialReportTypeSchema.optional(),
  period: ReportPeriodSchema.optional(),
  status: FinancialReportStatusSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  generatedBy: z.string().uuid().optional(),
  search: z.string().optional(), // Search in title, description
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['title', 'reportType', 'generatedAt', 'startDate', 'endDate']).default('generatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Revenue analysis schemas
export const revenueAnalysisSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  includeBreakdown: z.boolean().default(true),
  breakdownBy: z.enum(['client', 'space', 'service', 'booking_type']).optional(),
  includeProjections: z.boolean().default(false),
  projectionMonths: z.number().int().min(1).max(24).default(6),
  currency: z.string().length(3).default('USD'),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)

// Expense analysis schemas
export const expenseAnalysisSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  categories: z.array(z.string()).optional(),
  includeRecurring: z.boolean().default(true),
  includeOneTime: z.boolean().default(true),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)

// Cash flow analysis schemas
export const cashFlowAnalysisSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  includeProjections: z.boolean().default(false),
  projectionDays: z.number().int().min(7).max(365).default(30),
  includeOperatingActivities: z.boolean().default(true),
  includeInvestingActivities: z.boolean().default(true),
  includeFinancingActivities: z.boolean().default(true),
  currency: z.string().length(3).default('USD'),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)

// Profit & Loss analysis schemas
export const profitLossAnalysisSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  compareWithPrevious: z.boolean().default(false),
  includeMarginAnalysis: z.boolean().default(true),
  includeTrends: z.boolean().default(true),
  includeBreakdown: z.boolean().default(true),
  breakdownBy: z.enum(['client', 'space', 'service', 'month']).default('month'),
  currency: z.string().length(3).default('USD'),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)

// Budget variance schemas
export const budgetVarianceAnalysisSchema = z.object({
  budgetPeriod: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z.date(),
  endDate: z.date(),
  includeForecasts: z.boolean().default(true),
  varianceThreshold: z.number().min(0).max(100).default(10), // Percentage
  includeDetails: z.boolean().default(true),
  currency: z.string().length(3).default('USD'),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)

// Forecast schemas
export const createForecastSchema = z.object({
  forecastType: ForecastTypeSchema,
  method: z.enum(['LINEAR', 'EXPONENTIAL', 'SEASONAL', 'MANUAL']).default('LINEAR'),
  basePeriodStart: z.date(),
  basePeriodEnd: z.date(),
  forecastPeriodStart: z.date(),
  forecastPeriodEnd: z.date(),
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  assumptions: z.array(z.string()).optional(),
  seasonalityFactor: z.number().min(0).max(5).default(1),
  growthRate: z.number().min(-100).max(1000).optional(), // Percentage
  confidenceLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  currency: z.string().length(3).default('USD'),
}).refine(
  (data) => data.basePeriodEnd > data.basePeriodStart,
  {
    message: 'Base period end must be after start',
    path: ['basePeriodEnd'],
  }
).refine(
  (data) => data.forecastPeriodEnd > data.forecastPeriodStart,
  {
    message: 'Forecast period end must be after start',
    path: ['forecastPeriodEnd'],
  }
).refine(
  (data) => data.forecastPeriodStart >= data.basePeriodEnd,
  {
    message: 'Forecast period must start after base period',
    path: ['forecastPeriodStart'],
  }
)

// Financial metrics schemas
export const financialMetricsSchema = z.object({
  period: ReportPeriodSchema,
  startDate: z.date(),
  endDate: z.date(),
  includeKPIs: z.boolean().default(true),
  includeRatios: z.boolean().default(true),
  includeTrends: z.boolean().default(true),
  compareWithPrevious: z.boolean().default(false),
  currency: z.string().length(3).default('USD'),
  metrics: z.array(z.enum([
    'REVENUE_GROWTH',
    'PROFIT_MARGIN',
    'CASH_FLOW_RATIO',
    'DEBT_TO_EQUITY',
    'RETURN_ON_INVESTMENT',
    'OCCUPANCY_RATE',
    'AVERAGE_REVENUE_PER_USER',
    'CUSTOMER_LIFETIME_VALUE',
    'CHURN_RATE',
    'MONTHLY_RECURRING_REVENUE'
  ])).optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)

// Tax report schemas
export const taxReportSchema = z.object({
  taxYear: z.number().int().min(2020).max(2030),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']).optional(),
  reportType: z.enum(['INCOME_TAX', 'SALES_TAX', 'VAT', 'QUARTERLY', 'ANNUAL']),
  jurisdiction: z.string().min(1, 'Jurisdiction is required').max(100),
  includeDeductions: z.boolean().default(true),
  includeCredits: z.boolean().default(true),
  includeSupporting: z.boolean().default(true),
  currency: z.string().length(3).default('USD'),
})

// Types derived from schemas
export type CreateFinancialReportRequest = z.infer<typeof createFinancialReportSchema>
export type FinancialReportFilters = z.infer<typeof financialReportFiltersSchema>
export type RevenueAnalysisRequest = z.infer<typeof revenueAnalysisSchema>
export type ExpenseAnalysisRequest = z.infer<typeof expenseAnalysisSchema>
export type CashFlowAnalysisRequest = z.infer<typeof cashFlowAnalysisSchema>
export type ProfitLossAnalysisRequest = z.infer<typeof profitLossAnalysisSchema>
export type BudgetVarianceAnalysisRequest = z.infer<typeof budgetVarianceAnalysisSchema>
export type CreateForecastRequest = z.infer<typeof createForecastSchema>
export type FinancialMetricsRequest = z.infer<typeof financialMetricsSchema>
export type TaxReportRequest = z.infer<typeof taxReportSchema>
export type FinancialReportType = z.infer<typeof FinancialReportTypeSchema>
export type ReportPeriod = z.infer<typeof ReportPeriodSchema>
export type FinancialReportStatus = z.infer<typeof FinancialReportStatusSchema>
export type ForecastType = z.infer<typeof ForecastTypeSchema>