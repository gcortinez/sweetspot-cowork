import { z } from 'zod'

// Enums for reporting-related fields
export const ReportTypeSchema = z.enum([
  'FINANCIAL',
  'OCCUPANCY',
  'MEMBERSHIP',
  'BOOKING',
  'CLIENT',
  'SPACE_USAGE',
  'REVENUE',
  'VISITOR',
  'ACCESS_CONTROL',
  'MAINTENANCE',
  'CUSTOM'
])

export const ReportFormatSchema = z.enum([
  'PDF',
  'EXCEL',
  'CSV',
  'JSON',
  'HTML'
])

export const ReportStatusSchema = z.enum([
  'PENDING',
  'GENERATING',
  'COMPLETED',
  'FAILED',
  'EXPIRED'
])

export const ReportFrequencySchema = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'ON_DEMAND'
])

export const ChartTypeSchema = z.enum([
  'LINE',
  'BAR',
  'PIE',
  'DONUT',
  'AREA',
  'SCATTER',
  'HEATMAP',
  'TABLE'
])

export const MetricTypeSchema = z.enum([
  'COUNT',
  'SUM',
  'AVERAGE',
  'PERCENTAGE',
  'RATIO',
  'GROWTH',
  'TREND'
])

export const DateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  timezone: z.string().max(50).default('UTC'),
}).refine(
  (data) => data.startDate <= data.endDate,
  {
    message: 'Start date must be before or equal to end date',
    path: ['endDate'],
  }
)

export const FilterCriteriaSchema = z.object({
  field: z.string().max(100),
  operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'contains', 'starts_with', 'ends_with', 'in', 'not_in', 'between', 'is_null', 'is_not_null']),
  value: z.any(),
  values: z.array(z.any()).optional(), // For 'in', 'not_in', 'between' operators
})

export const SortCriteriaSchema = z.object({
  field: z.string().max(100),
  direction: z.enum(['asc', 'desc']).default('asc'),
})

export const ChartConfigSchema = z.object({
  type: ChartTypeSchema,
  title: z.string().max(200).optional(),
  xAxis: z.object({
    field: z.string().max(100),
    label: z.string().max(100).optional(),
    format: z.enum(['string', 'number', 'date', 'currency', 'percentage']).default('string'),
  }),
  yAxis: z.object({
    field: z.string().max(100),
    label: z.string().max(100).optional(),
    format: z.enum(['string', 'number', 'date', 'currency', 'percentage']).default('number'),
    aggregation: MetricTypeSchema.default('SUM'),
  }),
  groupBy: z.string().max(100).optional(),
  colors: z.array(z.string().max(20)).default([]),
  options: z.record(z.any()).default({}),
})

export const AnalyticsQuerySchema = z.object({
  dataSource: z.string().max(100), // Table or view name
  metrics: z.array(z.object({
    field: z.string().max(100),
    aggregation: MetricTypeSchema,
    alias: z.string().max(100).optional(),
  })).min(1, 'At least one metric is required'),
  dimensions: z.array(z.string().max(100)).default([]),
  filters: z.array(FilterCriteriaSchema).default([]),
  dateRange: DateRangeSchema.optional(),
  groupBy: z.array(z.string().max(100)).default([]),
  orderBy: z.array(SortCriteriaSchema).default([]),
  limit: z.number().int().min(1).max(10000).default(1000),
})

// Base report schema
export const baseReportSchema = z.object({
  name: z.string().min(1, 'Report name is required').max(200),
  description: z.string().max(1000).optional(),
  type: ReportTypeSchema,
  format: ReportFormatSchema.default('PDF'),
  
  // Report configuration
  config: z.object({
    dateRange: DateRangeSchema.optional(),
    filters: z.array(FilterCriteriaSchema).default([]),
    groupBy: z.array(z.string().max(100)).default([]),
    orderBy: z.array(SortCriteriaSchema).default([]),
    includeCharts: z.boolean().default(true),
    includeTables: z.boolean().default(true),
    includeSummary: z.boolean().default(true),
    pageSize: z.enum(['A4', 'LETTER', 'LEGAL']).default('A4'),
    orientation: z.enum(['PORTRAIT', 'LANDSCAPE']).default('PORTRAIT'),
  }).default({}),
  
  // Data sources and queries
  dataSources: z.array(z.object({
    name: z.string().max(100),
    query: AnalyticsQuerySchema,
    charts: z.array(ChartConfigSchema).default([]),
  })).min(1, 'At least one data source is required'),
  
  // Scheduling
  frequency: ReportFrequencySchema.default('ON_DEMAND'),
  schedule: z.object({
    dayOfWeek: z.number().int().min(0).max(6).optional(), // 0 = Sunday
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    hour: z.number().int().min(0).max(23).default(9),
    minute: z.number().int().min(0).max(59).default(0),
    timezone: z.string().max(50).default('UTC'),
  }).optional(),
  
  // Distribution
  recipients: z.array(z.object({
    type: z.enum(['USER', 'EMAIL', 'WEBHOOK']),
    identifier: z.string().max(200), // userId, email, or webhook URL
    name: z.string().max(100).optional(),
  })).default([]),
  
  // Template and styling
  template: z.object({
    header: z.string().max(1000).optional(),
    footer: z.string().max(1000).optional(),
    logo: z.string().url().optional(),
    primaryColor: z.string().max(20).default('#007bff'),
    secondaryColor: z.string().max(20).default('#6c757d'),
    fontFamily: z.string().max(50).default('Arial'),
    fontSize: z.number().int().min(8).max(20).default(12),
  }).default({}),
  
  // Access control
  isPublic: z.boolean().default(false),
  allowedRoles: z.array(z.string().max(50)).default([]),
  
  // Advanced options
  parameters: z.array(z.object({
    name: z.string().max(100),
    type: z.enum(['STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT']),
    label: z.string().max(200),
    description: z.string().max(500).optional(),
    defaultValue: z.any().optional(),
    required: z.boolean().default(false),
    options: z.array(z.object({
      label: z.string().max(100),
      value: z.any(),
    })).optional(), // For SELECT type
  })).default([]),
  
  // Caching and performance
  cacheEnabled: z.boolean().default(true),
  cacheDuration: z.number().int().min(0).default(3600), // seconds
  
  metadata: z.record(z.any()).optional(),
})

// Dashboard widget schema
export const dashboardWidgetSchema = z.object({
  title: z.string().min(1, 'Widget title is required').max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['CHART', 'TABLE', 'METRIC', 'TEXT', 'IMAGE']),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'FULL_WIDTH']).default('MEDIUM'),
  position: z.object({
    row: z.number().int().min(0),
    column: z.number().int().min(0),
    width: z.number().int().min(1).max(12).default(4),
    height: z.number().int().min(1).default(4),
  }),
  
  // Widget configuration
  config: z.object({
    dataSource: z.string().max(100).optional(),
    query: AnalyticsQuerySchema.optional(),
    chart: ChartConfigSchema.optional(),
    refreshInterval: z.number().int().min(0).default(300), // seconds
    showTitle: z.boolean().default(true),
    showBorder: z.boolean().default(true),
    backgroundColor: z.string().max(20).optional(),
    textColor: z.string().max(20).optional(),
  }).default({}),
  
  // Access control
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'ROLE_BASED']).default('PUBLIC'),
  allowedRoles: z.array(z.string().max(50)).default([]),
  
  metadata: z.record(z.any()).optional(),
})

// Dashboard schema
export const dashboardSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required').max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  
  // Layout configuration
  layout: z.object({
    columns: z.number().int().min(1).max(12).default(12),
    spacing: z.number().int().min(0).max(50).default(16),
    backgroundColor: z.string().max(20).default('#ffffff'),
    theme: z.enum(['LIGHT', 'DARK', 'AUTO']).default('LIGHT'),
  }).default({}),
  
  // Widgets
  widgets: z.array(dashboardWidgetSchema).default([]),
  
  // Filters
  globalFilters: z.array(z.object({
    name: z.string().max(100),
    type: z.enum(['DATE_RANGE', 'SELECT', 'MULTI_SELECT', 'TEXT']),
    label: z.string().max(200),
    defaultValue: z.any().optional(),
    options: z.array(z.object({
      label: z.string().max(100),
      value: z.any(),
    })).optional(),
  })).default([]),
  
  // Sharing and access
  isPublic: z.boolean().default(false),
  shareToken: z.string().max(100).optional(),
  allowedRoles: z.array(z.string().max(50)).default([]),
  
  // Auto-refresh
  autoRefresh: z.boolean().default(false),
  refreshInterval: z.number().int().min(30).default(300), // seconds
  
  metadata: z.record(z.any()).optional(),
})

// Analytics preset schema
export const analyticsPresetSchema = z.object({
  name: z.string().min(1, 'Preset name is required').max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  type: ReportTypeSchema,
  
  // Preset configuration
  config: z.object({
    queries: z.array(AnalyticsQuerySchema),
    charts: z.array(ChartConfigSchema),
    defaultDateRange: z.enum(['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_MONTH', 'LAST_MONTH', 'THIS_QUARTER', 'LAST_QUARTER', 'THIS_YEAR', 'LAST_YEAR', 'CUSTOM']).default('LAST_30_DAYS'),
    defaultFilters: z.array(FilterCriteriaSchema).default([]),
  }),
  
  // Template information
  isSystem: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string().max(50)).default([]),
  
  metadata: z.record(z.any()).optional(),
})

// Create schemas
export const createReportSchema = baseReportSchema

export const createDashboardSchema = dashboardSchema

export const createAnalyticsPresetSchema = analyticsPresetSchema

// Update schemas
export const updateReportSchema = z.object({
  id: z.string().uuid('Invalid report ID'),
}).merge(baseReportSchema.partial())

export const updateDashboardSchema = z.object({
  id: z.string().uuid('Invalid dashboard ID'),
}).merge(dashboardSchema.partial())

export const updateAnalyticsPresetSchema = z.object({
  id: z.string().uuid('Invalid preset ID'),
}).merge(analyticsPresetSchema.partial())

// Delete schemas
export const deleteReportSchema = z.object({
  id: z.string().uuid('Invalid report ID'),
})

export const deleteDashboardSchema = z.object({
  id: z.string().uuid('Invalid dashboard ID'),
})

export const deleteAnalyticsPresetSchema = z.object({
  id: z.string().uuid('Invalid preset ID'),
})

// Get schemas
export const getReportSchema = z.object({
  id: z.string().uuid('Invalid report ID'),
  includeData: z.boolean().default(false),
})

export const getDashboardSchema = z.object({
  id: z.string().uuid('Invalid dashboard ID'),
  includeData: z.boolean().default(true),
})

export const getAnalyticsPresetSchema = z.object({
  id: z.string().uuid('Invalid preset ID'),
})

// List schemas
export const listReportsSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  type: ReportTypeSchema.optional(),
  format: ReportFormatSchema.optional(),
  frequency: ReportFrequencySchema.optional(),
  isPublic: z.boolean().optional(),
  createdBy: z.string().uuid().optional(),
  sortBy: z.enum(['name', 'type', 'frequency', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const listDashboardsSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  category: z.string().max(100).optional(),
  isPublic: z.boolean().optional(),
  createdBy: z.string().uuid().optional(),
  sortBy: z.enum(['name', 'category', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const listAnalyticsPresetsSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  type: ReportTypeSchema.optional(),
  category: z.string().max(100).optional(),
  isSystem: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().max(50)).optional(),
  sortBy: z.enum(['name', 'type', 'category', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Execute schemas
export const executeReportSchema = z.object({
  id: z.string().uuid('Invalid report ID'),
  parameters: z.record(z.any()).default({}),
  format: ReportFormatSchema.optional(),
  emailTo: z.array(z.string().email()).optional(),
  saveResults: z.boolean().default(true),
})

export const executeAnalyticsQuerySchema = z.object({
  query: AnalyticsQuerySchema,
  format: z.enum(['JSON', 'CSV']).default('JSON'),
  includeMetadata: z.boolean().default(false),
})

export const generateDashboardDataSchema = z.object({
  id: z.string().uuid('Invalid dashboard ID'),
  widgetIds: z.array(z.string().uuid()).optional(), // If not provided, generate data for all widgets
  parameters: z.record(z.any()).default({}),
})

// Export schemas
export const exportReportSchema = z.object({
  id: z.string().uuid('Invalid report ID'),
  format: ReportFormatSchema,
  includeData: z.boolean().default(true),
  includeMetadata: z.boolean().default(false),
})

export const exportDashboardSchema = z.object({
  id: z.string().uuid('Invalid dashboard ID'),
  format: z.enum(['JSON', 'PDF']).default('JSON'),
  includeData: z.boolean().default(false),
})

// Share schemas
export const shareReportSchema = z.object({
  id: z.string().uuid('Invalid report ID'),
  shareWith: z.array(z.object({
    type: z.enum(['USER', 'ROLE', 'EMAIL']),
    identifier: z.string().max(200),
    permissions: z.array(z.enum(['VIEW', 'EDIT', 'DELETE'])).default(['VIEW']),
  })),
  expiresAt: z.date().optional(),
  message: z.string().max(1000).optional(),
})

export const shareDashboardSchema = z.object({
  id: z.string().uuid('Invalid dashboard ID'),
  shareWith: z.array(z.object({
    type: z.enum(['USER', 'ROLE', 'EMAIL']),
    identifier: z.string().max(200),
    permissions: z.array(z.enum(['VIEW', 'EDIT', 'DELETE'])).default(['VIEW']),
  })),
  expiresAt: z.date().optional(),
  message: z.string().max(1000).optional(),
})

// Type exports
export type ReportType = z.infer<typeof ReportTypeSchema>
export type ReportFormat = z.infer<typeof ReportFormatSchema>
export type ReportStatus = z.infer<typeof ReportStatusSchema>
export type ReportFrequency = z.infer<typeof ReportFrequencySchema>
export type ChartType = z.infer<typeof ChartTypeSchema>
export type MetricType = z.infer<typeof MetricTypeSchema>
export type DateRange = z.infer<typeof DateRangeSchema>
export type FilterCriteria = z.infer<typeof FilterCriteriaSchema>
export type SortCriteria = z.infer<typeof SortCriteriaSchema>
export type ChartConfig = z.infer<typeof ChartConfigSchema>
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>
export type DashboardWidget = z.infer<typeof dashboardWidgetSchema>

export type CreateReportRequest = z.infer<typeof createReportSchema>
export type CreateDashboardRequest = z.infer<typeof createDashboardSchema>
export type CreateAnalyticsPresetRequest = z.infer<typeof createAnalyticsPresetSchema>
export type UpdateReportRequest = z.infer<typeof updateReportSchema>
export type UpdateDashboardRequest = z.infer<typeof updateDashboardSchema>
export type UpdateAnalyticsPresetRequest = z.infer<typeof updateAnalyticsPresetSchema>
export type DeleteReportRequest = z.infer<typeof deleteReportSchema>
export type DeleteDashboardRequest = z.infer<typeof deleteDashboardSchema>
export type DeleteAnalyticsPresetRequest = z.infer<typeof deleteAnalyticsPresetSchema>
export type GetReportRequest = z.infer<typeof getReportSchema>
export type GetDashboardRequest = z.infer<typeof getDashboardSchema>
export type GetAnalyticsPresetRequest = z.infer<typeof getAnalyticsPresetSchema>
export type ListReportsRequest = z.infer<typeof listReportsSchema>
export type ListDashboardsRequest = z.infer<typeof listDashboardsSchema>
export type ListAnalyticsPresetsRequest = z.infer<typeof listAnalyticsPresetsSchema>
export type ExecuteReportRequest = z.infer<typeof executeReportSchema>
export type ExecuteAnalyticsQueryRequest = z.infer<typeof executeAnalyticsQuerySchema>
export type GenerateDashboardDataRequest = z.infer<typeof generateDashboardDataSchema>
export type ExportReportRequest = z.infer<typeof exportReportSchema>
export type ExportDashboardRequest = z.infer<typeof exportDashboardSchema>
export type ShareReportRequest = z.infer<typeof shareReportSchema>
export type ShareDashboardRequest = z.infer<typeof shareDashboardSchema>