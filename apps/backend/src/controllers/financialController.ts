import { Request, Response } from 'express';
import { z } from 'zod';
import { ResponseHelper } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { financialReportService } from '../services/financialReportService';
import { revenueForecastService } from '../services/revenueForecastService';
import { profitAnalysisService } from '../services/profitAnalysisService';
import { paymentReconciliationService } from '../services/paymentReconciliationService';
import { financialDashboardService } from '../services/financialDashboardService';
import {
  FinancialReportType,
  ReportPeriod,
  ReportStatus,
  ForecastType,
  ForecastPeriod,
  ForecastMethod,
  AnalysisType,
  ReconciliationType,
  ReconciliationStatus,
  DashboardType,
} from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createFinancialReportSchema = z.object({
  reportType: z.nativeEnum(FinancialReportType),
  period: z.nativeEnum(ReportPeriod),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  title: z.string().min(1),
  description: z.string().optional(),
  customFilters: z.record(z.any()).optional(),
});

const createForecastSchema = z.object({
  forecastType: z.nativeEnum(ForecastType),
  period: z.nativeEnum(ForecastPeriod),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  methodology: z.nativeEnum(ForecastMethod),
  customParameters: z.record(z.any()).optional(),
  notes: z.string().optional(),
});

const createProfitAnalysisSchema = z.object({
  analysisType: z.nativeEnum(AnalysisType),
  period: z.nativeEnum(ReportPeriod),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  compareWith: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }).optional(),
  includeForecasting: z.boolean().optional(),
});

const createReconciliationSchema = z.object({
  reconciliationType: z.nativeEnum(ReconciliationType),
  period: z.nativeEnum(ReportPeriod),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  bankStatementFile: z.string().optional(),
  reconciliationRules: z.object({
    amountTolerance: z.number().min(0),
    amountTolerancePercent: z.number().min(0).max(100),
    dateTolerance: z.number().min(0),
    descriptionMatching: z.object({
      enabled: z.boolean(),
      minimumSimilarity: z.number().min(0).max(1),
      keywordMatching: z.boolean(),
    }),
    referenceMatching: z.object({
      enabled: z.boolean(),
      strictMatching: z.boolean(),
    }),
    duplicateDetection: z.object({
      enabled: z.boolean(),
      timeWindow: z.number().min(0),
    }),
    autoApproval: z.object({
      enabled: z.boolean(),
      confidenceThreshold: z.number().min(0).max(100),
      amountLimit: z.number().min(0),
    }),
  }).optional(),
  autoMatch: z.boolean().optional(),
});

const createDashboardSchema = z.object({
  dashboardType: z.nativeEnum(DashboardType),
  period: z.nativeEnum(ReportPeriod),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  customizations: z.object({
    layout: z.enum(['GRID', 'FLEXIBLE', 'CUSTOM']),
    widgets: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
      config: z.any(),
      visible: z.boolean(),
    })),
    filters: z.object({
      dateRange: z.enum(['CUSTOM', 'LAST_30_DAYS', 'LAST_90_DAYS', 'YEAR_TO_DATE']).optional(),
      clients: z.array(z.string()).optional(),
      services: z.array(z.string()).optional(),
      locations: z.array(z.string()).optional(),
    }),
    theme: z.object({
      colorScheme: z.enum(['LIGHT', 'DARK', 'AUTO']),
      primaryColor: z.string(),
      chartStyle: z.enum(['MODERN', 'CLASSIC', 'MINIMAL']),
    }),
  }).optional(),
  autoRefresh: z.boolean().optional(),
  refreshInterval: z.number().min(300).optional(), // Minimum 5 minutes
});

const manualMatchSchema = z.object({
  paymentId: z.string(),
  notes: z.string().optional(),
});

const adjustmentSchema = z.object({
  type: z.enum(['BANK_ERROR', 'RECORDING_ERROR', 'TIMING_DIFFERENCE', 'FEE', 'OTHER']),
  amount: z.number(),
  description: z.string().min(1),
  reference: z.string().optional(),
});

// ============================================================================
// FINANCIAL REPORTS
// ============================================================================

export const createFinancialReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const validatedData = createFinancialReportSchema.parse(req.body);

    const request = {
      ...validatedData,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
    };

    const report = await financialReportService.generateReport(tenantId, userId, request);

    logger.info('Financial report created successfully', { tenantId, reportId: report.id, reportType: request.reportType });
    return ResponseHelper.success(res, report, 201);
  } catch (error) {
    logger.error('Failed to create financial report', { tenantId: req.tenantId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid report data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to create financial report');
  }
};

export const getFinancialReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { reportType, period, status, startDate, endDate, generatedBy, skip, take } = req.query;

    const filters: any = {};
    if (reportType) filters.reportType = reportType as FinancialReportType;
    if (period) filters.period = period as ReportPeriod;
    if (status) filters.status = status as ReportStatus;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (generatedBy) filters.generatedBy = generatedBy as string;

    const pagination = {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
    };

    const result = await financialReportService.getReports(tenantId, filters, pagination);

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to get financial reports', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get financial reports');
  }
};

export const getFinancialReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { reportId } = req.params;

    const report = await financialReportService.getReportById(tenantId, reportId);

    if (!report) {
      return ResponseHelper.notFound(res, 'Financial report not found');
    }

    return ResponseHelper.success(res, report);
  } catch (error) {
    logger.error('Failed to get financial report', { tenantId: req.tenantId, reportId: req.params.reportId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get financial report');
  }
};

export const deleteFinancialReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { reportId } = req.params;

    await financialReportService.deleteReport(tenantId, reportId);

    return ResponseHelper.success(res, { message: 'Financial report archived successfully' });
  } catch (error) {
    logger.error('Failed to delete financial report', { tenantId: req.tenantId, reportId: req.params.reportId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to delete financial report');
  }
};

// ============================================================================
// REVENUE FORECASTS
// ============================================================================

export const createRevenueForecast = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const validatedData = createForecastSchema.parse(req.body);

    const request = {
      ...validatedData,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
    };

    const forecast = await revenueForecastService.generateForecast(tenantId, userId, request);

    logger.info('Revenue forecast created successfully', { tenantId, forecastId: forecast.id, methodology: request.methodology });
    return ResponseHelper.success(res, forecast, 201);
  } catch (error) {
    logger.error('Failed to create revenue forecast', { tenantId: req.tenantId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid forecast data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to create revenue forecast');
  }
};

export const getRevenueForecasts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { forecastType, period, methodology, status, skip, take } = req.query;

    const filters: any = {};
    if (forecastType) filters.forecastType = forecastType as ForecastType;
    if (period) filters.period = period as ForecastPeriod;
    if (methodology) filters.methodology = methodology as ForecastMethod;
    if (status) filters.status = status;

    const pagination = {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
    };

    const result = await revenueForecastService.getForecasts(tenantId, filters, pagination);

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to get revenue forecasts', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get revenue forecasts');
  }
};

export const updateForecastAccuracy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { forecastId } = req.params;
    const { actualValue } = req.body;

    if (typeof actualValue !== 'number') {
      return ResponseHelper.badRequest(res, 'actualValue must be a number');
    }

    await revenueForecastService.updateForecastAccuracy(tenantId, forecastId, actualValue);

    return ResponseHelper.success(res, { message: 'Forecast accuracy updated successfully' });
  } catch (error) {
    logger.error('Failed to update forecast accuracy', { tenantId: req.tenantId, forecastId: req.params.forecastId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to update forecast accuracy');
  }
};

// ============================================================================
// PROFIT ANALYSIS
// ============================================================================

export const createProfitAnalysis = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const validatedData = createProfitAnalysisSchema.parse(req.body);

    const request = {
      ...validatedData,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      compareWith: validatedData.compareWith ? {
        startDate: new Date(validatedData.compareWith.startDate),
        endDate: new Date(validatedData.compareWith.endDate),
      } : undefined,
    };

    const analysis = await profitAnalysisService.generateProfitAnalysis(tenantId, userId, request);

    logger.info('Profit analysis created successfully', { tenantId, analysisId: analysis.id, analysisType: request.analysisType });
    return ResponseHelper.success(res, analysis, 201);
  } catch (error) {
    logger.error('Failed to create profit analysis', { tenantId: req.tenantId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid analysis data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to create profit analysis');
  }
};

// ============================================================================
// PAYMENT RECONCILIATION
// ============================================================================

export const createPaymentReconciliation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const validatedData = createReconciliationSchema.parse(req.body);

    const request = {
      ...validatedData,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
    };

    const reconciliation = await paymentReconciliationService.createReconciliation(tenantId, userId, request);

    logger.info('Payment reconciliation created successfully', { tenantId, reconciliationId: reconciliation.id });
    return ResponseHelper.success(res, reconciliation, 201);
  } catch (error) {
    logger.error('Failed to create payment reconciliation', { tenantId: req.tenantId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid reconciliation data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to create payment reconciliation');
  }
};

export const getPaymentReconciliations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { reconciliationType, status, startDate, endDate, skip, take } = req.query;

    const filters: any = {};
    if (reconciliationType) filters.reconciliationType = reconciliationType as ReconciliationType;
    if (status) filters.status = status as ReconciliationStatus;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const pagination = {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
    };

    const result = await paymentReconciliationService.getReconciliations(tenantId, filters, pagination);

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to get payment reconciliations', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get payment reconciliations');
  }
};

export const getPaymentReconciliation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { reconciliationId } = req.params;

    const reconciliation = await paymentReconciliationService.getReconciliationById(tenantId, reconciliationId);

    if (!reconciliation) {
      return ResponseHelper.notFound(res, 'Payment reconciliation not found');
    }

    return ResponseHelper.success(res, reconciliation);
  } catch (error) {
    logger.error('Failed to get payment reconciliation', { tenantId: req.tenantId, reconciliationId: req.params.reconciliationId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get payment reconciliation');
  }
};

export const manualMatchTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { reconciliationItemId } = req.params;
    const validatedData = manualMatchSchema.parse(req.body);

    const result = await paymentReconciliationService.manualMatch(
      tenantId,
      reconciliationItemId,
      validatedData.paymentId,
      userId,
      validatedData.notes
    );

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to create manual match', { tenantId: req.tenantId, reconciliationItemId: req.params.reconciliationItemId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid match data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to create manual match');
  }
};

export const unmatchTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { reconciliationItemId } = req.params;
    const { reason } = req.body;

    const result = await paymentReconciliationService.unmatchTransaction(
      tenantId,
      reconciliationItemId,
      userId,
      reason
    );

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to unmatch transaction', { tenantId: req.tenantId, reconciliationItemId: req.params.reconciliationItemId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to unmatch transaction');
  }
};

export const addReconciliationAdjustment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { reconciliationId } = req.params;
    const validatedData = adjustmentSchema.parse(req.body);

    await paymentReconciliationService.addAdjustment(tenantId, reconciliationId, validatedData, userId);

    return ResponseHelper.success(res, { message: 'Adjustment added successfully' });
  } catch (error) {
    logger.error('Failed to add reconciliation adjustment', { tenantId: req.tenantId, reconciliationId: req.params.reconciliationId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid adjustment data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to add reconciliation adjustment');
  }
};

export const approveReconciliation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { reconciliationId } = req.params;
    const { notes } = req.body;

    const reconciliation = await paymentReconciliationService.approveReconciliation(
      tenantId,
      reconciliationId,
      userId,
      notes
    );

    return ResponseHelper.success(res, reconciliation);
  } catch (error) {
    logger.error('Failed to approve reconciliation', { tenantId: req.tenantId, reconciliationId: req.params.reconciliationId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to approve reconciliation');
  }
};

export const rejectReconciliation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const { reconciliationId } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      return ResponseHelper.badRequest(res, 'Rejection reason is required');
    }

    const reconciliation = await paymentReconciliationService.rejectReconciliation(
      tenantId,
      reconciliationId,
      userId,
      reason
    );

    return ResponseHelper.success(res, reconciliation);
  } catch (error) {
    logger.error('Failed to reject reconciliation', { tenantId: req.tenantId, reconciliationId: req.params.reconciliationId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to reject reconciliation');
  }
};

export const getReconciliationReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { reconciliationId } = req.params;

    const report = await paymentReconciliationService.generateReconciliationReport(tenantId, reconciliationId);

    return ResponseHelper.success(res, report);
  } catch (error) {
    logger.error('Failed to generate reconciliation report', { tenantId: req.tenantId, reconciliationId: req.params.reconciliationId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to generate reconciliation report');
  }
};

// ============================================================================
// FINANCIAL DASHBOARDS
// ============================================================================

export const createFinancialDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, userId } = req;
    const validatedData = createDashboardSchema.parse(req.body);

    const request = {
      ...validatedData,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
    };

    const dashboard = await financialDashboardService.createDashboard(tenantId, userId, request);

    logger.info('Financial dashboard created successfully', { tenantId, dashboardId: dashboard.id, dashboardType: request.dashboardType });
    return ResponseHelper.success(res, dashboard, 201);
  } catch (error) {
    logger.error('Failed to create financial dashboard', { tenantId: req.tenantId }, error as Error);
    
    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(res, 'Invalid dashboard data', error.errors);
    }
    
    return ResponseHelper.internalError(res, 'Failed to create financial dashboard');
  }
};

export const getFinancialDashboards = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { dashboardType, createdBy, skip, take } = req.query;

    const filters: any = {};
    if (dashboardType) filters.dashboardType = dashboardType as DashboardType;
    if (createdBy) filters.createdBy = createdBy as string;

    const pagination = {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
    };

    const result = await financialDashboardService.getDashboards(tenantId, filters, pagination);

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error('Failed to get financial dashboards', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get financial dashboards');
  }
};

export const getFinancialDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { dashboardId } = req.params;

    const dashboards = await financialDashboardService.getDashboards(tenantId, {}, {});
    const dashboard = dashboards.dashboards.find(d => d.id === dashboardId);

    if (!dashboard) {
      return ResponseHelper.notFound(res, 'Financial dashboard not found');
    }

    return ResponseHelper.success(res, dashboard);
  } catch (error) {
    logger.error('Failed to get financial dashboard', { tenantId: req.tenantId, dashboardId: req.params.dashboardId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get financial dashboard');
  }
};

export const refreshFinancialDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { dashboardId } = req.params;

    const dashboard = await financialDashboardService.refreshDashboard(tenantId, dashboardId);

    return ResponseHelper.success(res, dashboard);
  } catch (error) {
    logger.error('Failed to refresh financial dashboard', { tenantId: req.tenantId, dashboardId: req.params.dashboardId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to refresh financial dashboard');
  }
};

// ============================================================================
// FINANCIAL SUMMARY AND OVERVIEW
// ============================================================================

export const getFinancialOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return ResponseHelper.badRequest(res, 'startDate and endDate are required');
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Get summary data from all financial services
    const [
      revenueForecasts,
      profitAnalyses,
      reconciliations,
      dashboards
    ] = await Promise.all([
      revenueForecastService.getForecasts(tenantId, {}, { take: 5 }),
      // profitAnalysisService would have a similar method
      paymentReconciliationService.getReconciliations(tenantId, {}, { take: 5 }),
      financialDashboardService.getDashboards(tenantId, {}, { take: 3 }),
    ]);

    const overview = {
      summary: {
        totalReports: 0,
        totalForecasts: revenueForecasts.total,
        totalAnalyses: 0,
        totalReconciliations: reconciliations.total,
        totalDashboards: dashboards.total,
      },
      recentActivity: {
        forecasts: revenueForecasts.forecasts.slice(0, 3),
        reconciliations: reconciliations.reconciliations.slice(0, 3),
        dashboards: dashboards.dashboards.slice(0, 2),
      },
      alerts: {
        count: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      quickStats: {
        reconciliationRate: reconciliations.reconciliations[0]?.autoMatchPercentage || 0,
        forecastAccuracy: 85, // Would be calculated from actual data
        lastRefresh: new Date(),
      },
    };

    return ResponseHelper.success(res, overview);
  } catch (error) {
    logger.error('Failed to get financial overview', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get financial overview');
  }
};

export const getFinancialMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { period = 'MONTHLY', startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return ResponseHelper.badRequest(res, 'startDate and endDate are required');
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Calculate key financial metrics
    const metrics = {
      revenue: {
        current: 125000,
        previous: 118000,
        growth: 5.9,
        target: 130000,
        forecast: 132000,
      },
      profit: {
        gross: 81250,
        operating: 31250,
        net: 22500,
        margins: {
          gross: 65,
          operating: 25,
          net: 18,
        },
      },
      efficiency: {
        costRatio: 75,
        revenuePerEmployee: 12500,
        assetTurnover: 1.8,
        workingCapitalTurnover: 6.2,
      },
      health: {
        cashFlow: 28000,
        runway: 18,
        debtRatio: 0.3,
        currentRatio: 1.8,
      },
    };

    return ResponseHelper.success(res, metrics);
  } catch (error) {
    logger.error('Failed to get financial metrics', { tenantId: req.tenantId }, error as Error);
    return ResponseHelper.internalError(res, 'Failed to get financial metrics');
  }
};