import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getTenantContext } from '@/lib/auth'
import type { ActionResult } from '@/types/database'
import {
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
  type ShareDashboardRequest,
} from '@/lib/validations/report'

/**
 * Create a new report
 */
export async function createReportAction(data: CreateReportRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createReportSchema.parse(data)

    // Create report
    const report = await prisma.report.create({
      data: {
        ...validatedData,
        tenantId,
        status: 'PENDING',
        config: JSON.stringify(validatedData.config),
        dataSources: JSON.stringify(validatedData.dataSources),
        schedule: validatedData.schedule ? JSON.stringify(validatedData.schedule) : null,
        recipients: JSON.stringify(validatedData.recipients),
        template: JSON.stringify(validatedData.template),
        allowedRoles: JSON.stringify(validatedData.allowedRoles),
        parameters: JSON.stringify(validatedData.parameters),
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        createdBy: user.id,
      },
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath('/reports')
    
    return { 
      success: true, 
      data: {
        ...report,
        config: JSON.parse(report.config),
        dataSources: JSON.parse(report.dataSources),
        schedule: report.schedule ? JSON.parse(report.schedule) : null,
        recipients: JSON.parse(report.recipients),
        template: JSON.parse(report.template),
        allowedRoles: JSON.parse(report.allowedRoles),
        parameters: JSON.parse(report.parameters),
        metadata: report.metadata ? JSON.parse(report.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create report error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to create report' }
  }
}

/**
 * Create a new dashboard
 */
export async function createDashboardAction(data: CreateDashboardRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createDashboardSchema.parse(data)

    // Create dashboard
    const dashboard = await prisma.dashboard.create({
      data: {
        ...validatedData,
        tenantId,
        layout: JSON.stringify(validatedData.layout),
        widgets: JSON.stringify(validatedData.widgets),
        globalFilters: JSON.stringify(validatedData.globalFilters),
        allowedRoles: JSON.stringify(validatedData.allowedRoles),
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        createdBy: user.id,
      },
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath('/dashboards')
    
    return { 
      success: true, 
      data: {
        ...dashboard,
        layout: JSON.parse(dashboard.layout),
        widgets: JSON.parse(dashboard.widgets),
        globalFilters: JSON.parse(dashboard.globalFilters),
        allowedRoles: JSON.parse(dashboard.allowedRoles),
        metadata: dashboard.metadata ? JSON.parse(dashboard.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create dashboard error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to create dashboard' }
  }
}

/**
 * Create an analytics preset
 */
export async function createAnalyticsPresetAction(data: CreateAnalyticsPresetRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createAnalyticsPresetSchema.parse(data)

    // Create analytics preset
    const preset = await prisma.analyticsPreset.create({
      data: {
        ...validatedData,
        tenantId,
        config: JSON.stringify(validatedData.config),
        tags: JSON.stringify(validatedData.tags),
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        createdBy: user.id,
      },
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath('/analytics/presets')
    
    return { 
      success: true, 
      data: {
        ...preset,
        config: JSON.parse(preset.config),
        tags: JSON.parse(preset.tags),
        metadata: preset.metadata ? JSON.parse(preset.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create analytics preset error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to create analytics preset' }
  }
}

/**
 * List reports with filtering and pagination
 */
export async function listReportsAction(data: ListReportsRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = listReportsSchema.parse(data)

    // Build where clause
    const where: any = {
      tenantId,
    }

    if (validatedData.search) {
      where.OR = [
        { name: { contains: validatedData.search, mode: 'insensitive' } },
        { description: { contains: validatedData.search, mode: 'insensitive' } },
      ]
    }

    if (validatedData.type) {
      where.type = validatedData.type
    }

    if (validatedData.format) {
      where.format = validatedData.format
    }

    if (validatedData.frequency) {
      where.frequency = validatedData.frequency
    }

    if (validatedData.isPublic !== undefined) {
      where.isPublic = validatedData.isPublic
    }

    if (validatedData.createdBy) {
      where.createdBy = validatedData.createdBy
    }

    // Build order by
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Get total count
    const total = await prisma.report.count({ where })

    // Get reports
    const reports = await prisma.report.findMany({
      where,
      orderBy,
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
    })

    // Process JSON fields
    const processedReports = reports.map(report => ({
      ...report,
      config: JSON.parse(report.config),
      dataSources: JSON.parse(report.dataSources),
      schedule: report.schedule ? JSON.parse(report.schedule) : null,
      recipients: JSON.parse(report.recipients),
      template: JSON.parse(report.template),
      allowedRoles: JSON.parse(report.allowedRoles),
      parameters: JSON.parse(report.parameters),
      metadata: report.metadata ? JSON.parse(report.metadata) : null,
      executionCount: report._count.executions,
    }))
    
    return { 
      success: true, 
      data: {
        reports: processedReports,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total,
          pages: Math.ceil(total / validatedData.limit),
        },
      }
    }
  } catch (error: any) {
    console.error('List reports error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to list reports' }
  }
}

/**
 * List dashboards with filtering and pagination
 */
export async function listDashboardsAction(data: ListDashboardsRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = listDashboardsSchema.parse(data)

    // Build where clause
    const where: any = {
      tenantId,
    }

    if (validatedData.search) {
      where.OR = [
        { name: { contains: validatedData.search, mode: 'insensitive' } },
        { description: { contains: validatedData.search, mode: 'insensitive' } },
      ]
    }

    if (validatedData.category) {
      where.category = validatedData.category
    }

    if (validatedData.isPublic !== undefined) {
      where.isPublic = validatedData.isPublic
    }

    if (validatedData.createdBy) {
      where.createdBy = validatedData.createdBy
    }

    // Build order by
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Get total count
    const total = await prisma.dashboard.count({ where })

    // Get dashboards
    const dashboards = await prisma.dashboard.findMany({
      where,
      orderBy,
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Process JSON fields
    const processedDashboards = dashboards.map(dashboard => ({
      ...dashboard,
      layout: JSON.parse(dashboard.layout),
      widgets: JSON.parse(dashboard.widgets),
      globalFilters: JSON.parse(dashboard.globalFilters),
      allowedRoles: JSON.parse(dashboard.allowedRoles),
      metadata: dashboard.metadata ? JSON.parse(dashboard.metadata) : null,
      widgetCount: JSON.parse(dashboard.widgets).length,
    }))
    
    return { 
      success: true, 
      data: {
        dashboards: processedDashboards,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total,
          pages: Math.ceil(total / validatedData.limit),
        },
      }
    }
  } catch (error: any) {
    console.error('List dashboards error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to list dashboards' }
  }
}

/**
 * Execute a report
 */
export async function executeReportAction(data: ExecuteReportRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = executeReportSchema.parse(data)

    // Get report
    const report = await prisma.report.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!report) {
      return { success: false, error: 'Report not found' }
    }

    // Parse report configuration
    const config = JSON.parse(report.config)
    const dataSources = JSON.parse(report.dataSources)
    const parameters = JSON.parse(report.parameters)

    // Validate required parameters
    const missingParams = parameters
      .filter((param: any) => param.required && !(param.name in validatedData.parameters))
      .map((param: any) => param.name)

    if (missingParams.length > 0) {
      return {
        success: false,
        error: 'Missing required parameters',
        fieldErrors: missingParams.reduce((acc: any, param: string) => {
          acc[param] = 'This parameter is required'
          return acc
        }, {}),
      }
    }

    // Create report execution record
    const execution = await prisma.reportExecution.create({
      data: {
        reportId: validatedData.id,
        tenantId,
        status: 'GENERATING',
        format: validatedData.format || report.format,
        parameters: JSON.stringify(validatedData.parameters),
        executedBy: user.id,
      },
    })

    // Execute report asynchronously
    executeReportAsync(execution.id, report, validatedData)

    revalidatePath('/reports')
    revalidatePath(`/reports/${validatedData.id}`)
    
    return { 
      success: true, 
      data: {
        executionId: execution.id,
        status: execution.status,
        message: 'Report execution started',
      }
    }
  } catch (error: any) {
    console.error('Execute report error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to execute report' }
  }
}

/**
 * Execute an analytics query
 */
export async function executeAnalyticsQueryAction(data: ExecuteAnalyticsQueryRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = executeAnalyticsQuerySchema.parse(data)

    // Execute query
    const result = await executeAnalyticsQuery(validatedData.query, tenantId)

    // Format result based on requested format
    let formattedResult = result
    if (validatedData.format === 'CSV') {
      formattedResult = convertToCSV(result.data)
    }

    return { 
      success: true, 
      data: {
        result: formattedResult,
        metadata: validatedData.includeMetadata ? {
          executedAt: new Date(),
          rowCount: result.data?.length || 0,
          query: validatedData.query,
        } : undefined,
      }
    }
  } catch (error: any) {
    console.error('Execute analytics query error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to execute analytics query' }
  }
}

/**
 * Generate dashboard data
 */
export async function generateDashboardDataAction(data: GenerateDashboardDataRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = generateDashboardDataSchema.parse(data)

    // Get dashboard
    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!dashboard) {
      return { success: false, error: 'Dashboard not found' }
    }

    // Parse dashboard widgets
    const widgets = JSON.parse(dashboard.widgets)

    // Filter widgets if specific widget IDs provided
    const targetWidgets = validatedData.widgetIds 
      ? widgets.filter((widget: any) => validatedData.widgetIds!.includes(widget.id))
      : widgets

    // Generate data for each widget
    const widgetData: any = {}
    for (const widget of targetWidgets) {
      if (widget.config?.query) {
        try {
          const result = await executeAnalyticsQuery(widget.config.query, tenantId)
          widgetData[widget.id] = {
            data: result.data,
            metadata: {
              lastUpdated: new Date(),
              rowCount: result.data?.length || 0,
            },
          }
        } catch (error) {
          console.error(`Error generating data for widget ${widget.id}:`, error)
          widgetData[widget.id] = {
            error: 'Failed to generate widget data',
            metadata: {
              lastUpdated: new Date(),
              rowCount: 0,
            },
          }
        }
      }
    }

    return { 
      success: true, 
      data: {
        dashboardId: validatedData.id,
        widgets: widgetData,
        generatedAt: new Date(),
      }
    }
  } catch (error: any) {
    console.error('Generate dashboard data error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to generate dashboard data' }
  }
}

/**
 * Helper functions
 */
async function executeReportAsync(executionId: string, report: any, request: ExecuteReportRequest) {
  try {
    // Update status to generating
    await prisma.reportExecution.update({
      where: { id: executionId },
      data: { status: 'GENERATING' },
    })

    // Parse report configuration
    const dataSources = JSON.parse(report.dataSources)
    const config = JSON.parse(report.config)

    // Execute queries for each data source
    const results: any = {}
    for (const dataSource of dataSources) {
      const queryResult = await executeAnalyticsQuery(dataSource.query, report.tenantId)
      results[dataSource.name] = queryResult
    }

    // Generate report based on format
    let output: string | Buffer
    switch (request.format || report.format) {
      case 'PDF':
        output = await generatePDFReport(report, results, request.parameters)
        break
      case 'EXCEL':
        output = await generateExcelReport(report, results, request.parameters)
        break
      case 'CSV':
        output = await generateCSVReport(report, results, request.parameters)
        break
      case 'JSON':
        output = JSON.stringify(results, null, 2)
        break
      case 'HTML':
        output = await generateHTMLReport(report, results, request.parameters)
        break
      default:
        throw new Error(`Unsupported format: ${request.format || report.format}`)
    }

    // Save results if requested
    let filePath = null
    if (request.saveResults) {
      filePath = await saveReportOutput(executionId, output, request.format || report.format)
    }

    // Update execution with completed status
    await prisma.reportExecution.update({
      where: { id: executionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        output: typeof output === 'string' ? output : null,
        filePath,
      },
    })

    // Send email if requested
    if (request.emailTo && request.emailTo.length > 0) {
      await sendReportByEmail(report, output, request.emailTo, request.format || report.format)
    }

  } catch (error) {
    console.error('Report execution error:', error)
    
    // Update execution with failed status
    await prisma.reportExecution.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })
  }
}

async function executeAnalyticsQuery(query: any, tenantId: string): Promise<any> {
  // This is a simplified implementation
  // In a real system, you would build and execute dynamic SQL queries
  // based on the query configuration and apply proper security measures
  
  // For now, return mock data based on the data source
  const mockData = await generateMockAnalyticsData(query, tenantId)
  
  return {
    data: mockData,
    metadata: {
      rowCount: mockData.length,
      executedAt: new Date(),
      query,
    },
  }
}

async function generateMockAnalyticsData(query: any, tenantId: string): Promise<any[]> {
  // Generate mock data based on the query configuration
  // This would be replaced with actual database queries in production
  
  const mockData: any[] = []
  const recordCount = Math.min(query.limit || 100, 1000)
  
  for (let i = 0; i < recordCount; i++) {
    const record: any = {}
    
    // Generate data for each metric
    query.metrics.forEach((metric: any) => {
      const alias = metric.alias || metric.field
      switch (metric.aggregation) {
        case 'COUNT':
          record[alias] = Math.floor(Math.random() * 1000)
          break
        case 'SUM':
          record[alias] = Math.floor(Math.random() * 10000)
          break
        case 'AVERAGE':
          record[alias] = Math.floor(Math.random() * 100)
          break
        case 'PERCENTAGE':
          record[alias] = Math.floor(Math.random() * 100)
          break
        default:
          record[alias] = Math.floor(Math.random() * 100)
      }
    })
    
    // Generate data for dimensions
    query.dimensions.forEach((dimension: string, index: number) => {
      record[dimension] = `Category ${String.fromCharCode(65 + (i % 26))}`
    })
    
    mockData.push(record)
  }
  
  return mockData
}

async function generatePDFReport(report: any, results: any, parameters: any): Promise<Buffer> {
  // TODO: Implement PDF generation using a library like Puppeteer or PDFKit
  console.log('Generating PDF report:', report.name)
  return Buffer.from('PDF content placeholder')
}

async function generateExcelReport(report: any, results: any, parameters: any): Promise<Buffer> {
  // TODO: Implement Excel generation using a library like ExcelJS
  console.log('Generating Excel report:', report.name)
  return Buffer.from('Excel content placeholder')
}

async function generateCSVReport(report: any, results: any, parameters: any): Promise<string> {
  // Simple CSV generation
  const firstDataSource = Object.values(results)[0] as any
  if (!firstDataSource?.data || firstDataSource.data.length === 0) {
    return 'No data available'
  }
  
  return convertToCSV(firstDataSource.data)
}

async function generateHTMLReport(report: any, results: any, parameters: any): Promise<string> {
  // TODO: Implement HTML report generation with charts and tables
  console.log('Generating HTML report:', report.name)
  return '<html><body><h1>Report Placeholder</h1></body></html>'
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return 'No data available'
  }
  
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header]
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}

async function saveReportOutput(executionId: string, output: string | Buffer, format: string): Promise<string> {
  // TODO: Implement file storage (local filesystem, S3, etc.)
  const fileName = `report_${executionId}.${format.toLowerCase()}`
  console.log('Saving report output:', fileName)
  return `/reports/output/${fileName}`
}

async function sendReportByEmail(report: any, output: string | Buffer, recipients: string[], format: string) {
  // TODO: Implement email sending with report attachment
  console.log('Sending report by email:', {
    reportName: report.name,
    recipients,
    format,
  })
}

/**
 * Get a report by ID
 */
export async function getReportAction(data: GetReportRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getReportSchema.parse(data)

    // Get report
    const report = await prisma.report.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        executions: validatedData.includeData ? {
          orderBy: { createdAt: 'desc' },
          take: 5,
        } : false,
      },
    })

    if (!report) {
      return { success: false, error: 'Report not found' }
    }

    return { 
      success: true, 
      data: {
        ...report,
        config: JSON.parse(report.config),
        dataSources: JSON.parse(report.dataSources),
        schedule: report.schedule ? JSON.parse(report.schedule) : null,
        recipients: JSON.parse(report.recipients),
        template: JSON.parse(report.template),
        allowedRoles: JSON.parse(report.allowedRoles),
        parameters: JSON.parse(report.parameters),
        metadata: report.metadata ? JSON.parse(report.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Get report error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to get report' }
  }
}

/**
 * Get a dashboard by ID
 */
export async function getDashboardAction(data: GetDashboardRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getDashboardSchema.parse(data)

    // Get dashboard
    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!dashboard) {
      return { success: false, error: 'Dashboard not found' }
    }

    let dashboardData = {
      ...dashboard,
      layout: JSON.parse(dashboard.layout),
      widgets: JSON.parse(dashboard.widgets),
      globalFilters: JSON.parse(dashboard.globalFilters),
      allowedRoles: JSON.parse(dashboard.allowedRoles),
      metadata: dashboard.metadata ? JSON.parse(dashboard.metadata) : null,
    }

    // Generate widget data if requested
    if (validatedData.includeData) {
      const widgetDataResult = await generateDashboardDataAction({ id: validatedData.id })
      if (widgetDataResult.success) {
        dashboardData = {
          ...dashboardData,
          widgetData: widgetDataResult.data.widgets,
        }
      }
    }

    return { success: true, data: dashboardData }
  } catch (error: any) {
    console.error('Get dashboard error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to get dashboard' }
  }
}

/**
 * Get an analytics preset by ID
 */
export async function getAnalyticsPresetAction(data: GetAnalyticsPresetRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getAnalyticsPresetSchema.parse(data)

    // Get preset
    const preset = await prisma.analyticsPreset.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!preset) {
      return { success: false, error: 'Analytics preset not found' }
    }

    return { 
      success: true, 
      data: {
        ...preset,
        config: JSON.parse(preset.config),
        tags: JSON.parse(preset.tags),
        metadata: preset.metadata ? JSON.parse(preset.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Get analytics preset error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to get analytics preset' }
  }
}

/**
 * Update a report
 */
export async function updateReportAction(data: UpdateReportRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = updateReportSchema.parse(data)

    // Check if report exists
    const existingReport = await prisma.report.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!existingReport) {
      return { success: false, error: 'Report not found' }
    }

    // Update report
    const report = await prisma.report.update({
      where: { id: validatedData.id },
      data: {
        ...validatedData,
        config: validatedData.config ? JSON.stringify(validatedData.config) : undefined,
        dataSources: validatedData.dataSources ? JSON.stringify(validatedData.dataSources) : undefined,
        schedule: validatedData.schedule ? JSON.stringify(validatedData.schedule) : undefined,
        recipients: validatedData.recipients ? JSON.stringify(validatedData.recipients) : undefined,
        template: validatedData.template ? JSON.stringify(validatedData.template) : undefined,
        allowedRoles: validatedData.allowedRoles ? JSON.stringify(validatedData.allowedRoles) : undefined,
        parameters: validatedData.parameters ? JSON.stringify(validatedData.parameters) : undefined,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : undefined,
      },
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath('/reports')
    revalidatePath(`/reports/${validatedData.id}`)
    
    return { 
      success: true, 
      data: {
        ...report,
        config: JSON.parse(report.config),
        dataSources: JSON.parse(report.dataSources),
        schedule: report.schedule ? JSON.parse(report.schedule) : null,
        recipients: JSON.parse(report.recipients),
        template: JSON.parse(report.template),
        allowedRoles: JSON.parse(report.allowedRoles),
        parameters: JSON.parse(report.parameters),
        metadata: report.metadata ? JSON.parse(report.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Update report error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to update report' }
  }
}

/**
 * Delete a report
 */
export async function deleteReportAction(data: DeleteReportRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = deleteReportSchema.parse(data)

    // Check if report exists
    const report = await prisma.report.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!report) {
      return { success: false, error: 'Report not found' }
    }

    // Soft delete report
    await prisma.report.update({
      where: { id: validatedData.id },
      data: {
        deletedAt: new Date(),
      },
    })

    revalidatePath('/reports')
    
    return { success: true, data: { message: 'Report deleted successfully' } }
  } catch (error: any) {
    console.error('Delete report error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to delete report' }
  }
}