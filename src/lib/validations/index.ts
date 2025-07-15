/**
 * Validation schemas for Server Actions
 * Exported for use throughout the frontend application
 */

// Common validations
export * from './common'

// Authentication validations
export * from './auth'

// Tenant and workspace validations
export {
  createTenantSchema,
  updateTenantSchema,
  tenantFiltersSchema,
  createTenantSpaceSchema,
  updateTenantSpaceSchema,
  type CreateTenantRequest,
  type UpdateTenantRequest,
  type TenantFilters,
  type CreateTenantSpaceRequest,
  type UpdateTenantSpaceRequest
} from './tenant'

// Client and company validations
export * from './client'

// Activities validations
export * from './activities'

// Space management validations
export {
  SpaceTypeSchema,
  SpaceStatusSchema,
  PricingModeSchema,
  AmenitySchema,
  LocationSchema,
  PricingTierSchema,
  AvailabilityRuleSchema,
  baseSpaceSchema,
  createSpaceSchema,
  updateSpaceSchema,
  deleteSpaceSchema,
  getSpaceSchema,
  listSpacesSchema,
  checkSpaceAvailabilitySchema
} from './space'

// Service management validations
export * from './service'

// Resource management validations
export * from './resource'

// Booking management validations
export * from './booking'

// Visitor management validations
export * from './visitor'

// Access control validations
export * from './access-control'

// Membership management validations
export * from './membership'

// Contract management validations
export * from './contract'

// Financial management validations
export * from './invoice'
export * from './payment'
export {
  FinancialReportTypeSchema,
  ReportPeriodSchema,
  FinancialReportStatusSchema,
  ForecastTypeSchema,
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
  type TaxReportRequest,
  type FinancialReportType,
  type ReportPeriod,
  type FinancialReportStatus,
  type ForecastType
} from './financial-report'

// Notification management validations
export * from './notification'

// Reporting and analytics validations
export {
  ReportTypeSchema,
  ReportFormatSchema,
  ReportStatusSchema,
  ReportFrequencySchema,
  ChartTypeSchema,
  MetricTypeSchema,
  DateRangeSchema,
  FilterCriteriaSchema,
  SortCriteriaSchema,
  ChartConfigSchema,
  AnalyticsQuerySchema,
  baseReportSchema,
  dashboardWidgetSchema,
  dashboardSchema,
  analyticsPresetSchema,
  createReportSchema,
  createDashboardSchema,
  createAnalyticsPresetSchema,
  updateReportSchema,
  updateDashboardSchema,
  updateAnalyticsPresetSchema,
  deleteReportSchema,
  deleteDashboardSchema,
  deleteAnalyticsPresetSchema,
  getReportSchema,
  getDashboardSchema,
  getAnalyticsPresetSchema,
  listReportsSchema,
  listDashboardsSchema,
  listAnalyticsPresetsSchema,
  executeReportSchema,
  executeAnalyticsQuerySchema,
  generateDashboardDataSchema,
  exportReportSchema,
  exportDashboardSchema,
  shareReportSchema,
  shareDashboardSchema,
  type ReportType,
  type ReportFormat,
  type ReportStatus,
  type ReportFrequency,
  type ChartType,
  type MetricType,
  type DateRange,
  type FilterCriteria,
  type SortCriteria,
  type ChartConfig,
  type AnalyticsQuery,
  type DashboardWidget,
  type CreateReportRequest,
  type CreateDashboardRequest,
  type CreateAnalyticsPresetRequest,
  type UpdateReportRequest,
  type UpdateDashboardRequest,
  type UpdateAnalyticsPresetRequest,
  type DeleteReportRequest,
  type DeleteDashboardRequest,
  type DeleteAnalyticsPresetRequest,
  type GetReportRequest,
  type GetDashboardRequest,
  type GetAnalyticsPresetRequest,
  type ListReportsRequest,
  type ListDashboardsRequest,
  type ListAnalyticsPresetsRequest,
  type ExecuteReportRequest,
  type ExecuteAnalyticsQueryRequest,
  type GenerateDashboardDataRequest,
  type ExportReportRequest,
  type ExportDashboardRequest,
  type ShareReportRequest,
  type ShareDashboardRequest
} from './report'

// Integration and migration validations
export * from './integration'

// Re-export for convenience
export { z } from 'zod'