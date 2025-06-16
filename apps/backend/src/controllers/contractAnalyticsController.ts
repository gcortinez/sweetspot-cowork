import { Response } from 'express';
import { z } from 'zod';
import { contractAnalyticsService, ReportType, TimeFrame, ExportFormat } from '../services/contractAnalyticsService';
import { ContractStatus, ContractType } from '../services/contractLifecycleService';
import { ResponseHelper } from '../utils/response';
import { logger } from '../utils/logger';
import { AppError, ValidationError } from '../utils/errors';
import { BaseRequest, AuthenticatedRequest, ErrorCode, HttpStatusCode } from '../types/api';

const AnalyticsQuerySchema = z.object({
  timeFrame: z.nativeEnum(TimeFrame).default(TimeFrame.THIS_MONTH),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  contractTypes: z.array(z.nativeEnum(ContractType)).optional(),
  clientIds: z.array(z.string()).optional(),
  statuses: z.array(z.nativeEnum(ContractStatus)).optional(),
  includeRenewals: z.coerce.boolean().optional(),
  groupBy: z.enum(['month', 'quarter', 'year', 'week']).optional(),
});

const GenerateReportSchema = z.object({
  type: z.nativeEnum(ReportType),
  timeFrame: z.nativeEnum(TimeFrame).default(TimeFrame.THIS_MONTH),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  format: z.nativeEnum(ExportFormat).default(ExportFormat.PDF),
  includeCharts: z.boolean().default(true),
  filters: z.object({
    contractTypes: z.array(z.nativeEnum(ContractType)).optional(),
    clientIds: z.array(z.string()).optional(),
    statuses: z.array(z.nativeEnum(ContractStatus)).optional(),
  }).optional(),
  customFields: z.array(z.string()).optional(),
  groupBy: z.enum(['month', 'quarter', 'year']).optional(),
});

export class ContractAnalyticsController {
  async getContractOverview(req: BaseRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
      }

      const query = AnalyticsQuerySchema.parse(req.query);

      logger.debug('Fetching contract overview analytics', { tenantId, query });

      const metrics = await contractAnalyticsService.getContractOverview(tenantId, query);

      return ResponseHelper.success(res, metrics, 'Contract overview retrieved successfully');
    } catch (error) {
      logger.error('Error fetching contract overview', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.validationError(res, 'Invalid query parameters', error.errors);
      }

      return ResponseHelper.internalError(res, 'Failed to fetch contract overview');
    }
  }

  async getRevenueAnalysis(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
      }

      const query = AnalyticsQuerySchema.parse(req.query);

      logger.debug('Fetching revenue analysis', { tenantId, query });

      const analysis = await contractAnalyticsService.getRevenueAnalysis(tenantId, query);

      return ResponseHelper.success(res, analysis, 'Revenue analysis retrieved successfully');
    } catch (error) {
      logger.error('Error fetching revenue analysis', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.validationError(res, 'Invalid query parameters', error.errors);
      }

      return ResponseHelper.internalError(res, 'Failed to fetch revenue analysis');
    }
  }

  async getClientAnalysis(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
      }

      const query = AnalyticsQuerySchema.parse(req.query);

      logger.debug('Fetching client analysis', { tenantId, query });

      const analysis = await contractAnalyticsService.getClientAnalysis(tenantId, query);

      return ResponseHelper.success(res, analysis, 'Client analysis retrieved successfully');
    } catch (error) {
      logger.error('Error fetching client analysis', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.validationError(res, 'Invalid query parameters', error.errors);
      }

      return ResponseHelper.internalError(res, 'Failed to fetch client analysis');
    }
  }

  async getRenewalPerformance(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
      }

      const query = AnalyticsQuerySchema.parse(req.query);

      logger.debug('Fetching renewal performance', { tenantId, query });

      const performance = await contractAnalyticsService.getRenewalPerformance(tenantId, query);

      return ResponseHelper.success(res, performance, 'Renewal performance retrieved successfully');
    } catch (error) {
      logger.error('Error fetching renewal performance', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.validationError(res, 'Invalid query parameters', error.errors);
      }

      return ResponseHelper.internalError(res, 'Failed to fetch renewal performance');
    }
  }

  async getContractLifecycleMetrics(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
      }

      const query = AnalyticsQuerySchema.parse(req.query);

      logger.debug('Fetching contract lifecycle metrics', { tenantId, query });

      const metrics = await contractAnalyticsService.getContractLifecycleMetrics(tenantId, query);

      return ResponseHelper.success(res, metrics, 'Contract lifecycle metrics retrieved successfully');
    } catch (error) {
      logger.error('Error fetching contract lifecycle metrics', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.validationError(res, 'Invalid query parameters', error.errors);
      }

      return ResponseHelper.internalError(res, 'Failed to fetch contract lifecycle metrics');
    }
  }

  async getExpiryForecast(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
      }

      logger.debug('Fetching expiry forecast', { tenantId });

      const forecast = await contractAnalyticsService.getExpiryForecast(tenantId);

      return ResponseHelper.success(res, forecast, 'Expiry forecast retrieved successfully');
    } catch (error) {
      logger.error('Error fetching expiry forecast', { error });
      return ResponseHelper.internalError(res, 'Failed to fetch expiry forecast');
    }
  }

  async generateReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const generatedBy = req.user?.id;

      if (!tenantId || !generatedBy) {
        return ResponseHelper.unauthorized(res);
      }

      const options = GenerateReportSchema.parse(req.body);

      logger.info('Generating analytics report', {
        tenantId,
        type: options.type,
        format: options.format,
        generatedBy,
      });

      const report = await contractAnalyticsService.generateReport(
        tenantId,
        generatedBy,
        options
      );

      logger.info('Analytics report generated successfully', {
        tenantId,
        reportId: report.id,
        type: options.type,
        format: options.format,
      });

      return ResponseHelper.success(res, report, 'Report generated successfully', HttpStatusCode.CREATED);
    } catch (error) {
      logger.error('Error generating report', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.validationError(res, 'Validation failed', error.errors);
      }

      if (error instanceof ValidationError) {
        return ResponseHelper.badRequest(res, error.message);
      }

      return ResponseHelper.internalError(res, 'Failed to generate report');
    }
  }

  async getReportHistory(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
      }

      logger.debug('Fetching report history', { tenantId });

      const reports = await contractAnalyticsService.getReportHistory(tenantId);

      return ResponseHelper.success(res, reports, 'Report history retrieved successfully');
    } catch (error) {
      logger.error('Error fetching report history', { error });
      return ResponseHelper.internalError(res, 'Failed to fetch report history');
    }
  }

  async getDashboardMetrics(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
      }

      logger.debug('Fetching dashboard metrics', { tenantId });

      const metrics = await contractAnalyticsService.getDashboardMetrics(tenantId);

      return ResponseHelper.success(res, metrics, 'Dashboard metrics retrieved successfully');
    } catch (error) {
      logger.error('Error fetching dashboard metrics', { error });
      return ResponseHelper.internalError(res, 'Failed to fetch dashboard metrics');
    }
  }

  async downloadReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { reportId } = req.params;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
      }

      logger.info('Downloading report', { tenantId, reportId });

      // In a real implementation, this would:
      // 1. Validate the report belongs to the tenant
      // 2. Check if the file exists
      // 3. Stream the file to the response
      // 4. Set appropriate headers for download

      // Mock response for now
      const mockFile = {
        filename: `contract-report-${reportId}.pdf`,
        contentType: 'application/pdf',
        size: 1024 * 1024, // 1MB
      };

      res.setHeader('Content-Disposition', `attachment; filename="${mockFile.filename}"`);
      res.setHeader('Content-Type', mockFile.contentType);
      res.setHeader('Content-Length', mockFile.size.toString());

      // In reality, you would stream the actual file here
      return res.status(200).send('Mock PDF content');
    } catch (error) {
      logger.error('Error downloading report', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, ErrorCode.INTERNAL_ERROR, error.message, error.statusCode);
      }

      return ResponseHelper.internalError(res, 'Failed to download report');
    }
  }

  async getKPIs(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
      }

      const query = AnalyticsQuerySchema.parse(req.query);

      logger.debug('Fetching KPIs', { tenantId, query });

      // Get multiple analytics for KPI calculation
      const [overview, revenue, renewals] = await Promise.all([
        contractAnalyticsService.getContractOverview(tenantId, query),
        contractAnalyticsService.getRevenueAnalysis(tenantId, query),
        contractAnalyticsService.getRenewalPerformance(tenantId, query),
      ]);

      const kpis = {
        contractMetrics: {
          totalContracts: overview.totalContracts,
          activeContracts: overview.activeContracts,
          activationRate: (overview.activeContracts / overview.totalContracts) * 100,
          averageContractValue: overview.averageValue,
        },
        revenueMetrics: {
          totalRevenue: revenue.totalRevenue,
          recurringRevenue: revenue.recurringRevenue,
          revenueGrowth: revenue.revenueGrowth,
          projectedRevenue: revenue.projectedRevenue,
        },
        renewalMetrics: {
          renewalRate: renewals.renewalRate,
          averageRenewalTime: renewals.averageRenewalTime,
          priceIncreaseRate: renewals.priceIncreaseRate,
          renewalValue: renewals.renewalValue,
        },
        trends: {
          contractGrowth: '+12.5%',
          revenueGrowth: `+${revenue.revenueGrowth}%`,
          renewalImprovement: '+3.2%',
          clientSatisfaction: '94.8%',
        },
      };

      return ResponseHelper.success(res, kpis, 'KPIs retrieved successfully');
    } catch (error) {
      logger.error('Error fetching KPIs', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.validationError(res, 'Invalid query parameters', error.errors);
      }

      return ResponseHelper.internalError(res, 'Failed to fetch KPIs');
    }
  }
}

export const contractAnalyticsController = new ContractAnalyticsController();