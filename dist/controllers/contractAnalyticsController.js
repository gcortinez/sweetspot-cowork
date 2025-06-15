"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractAnalyticsController = exports.ContractAnalyticsController = void 0;
const zod_1 = require("zod");
const contractAnalyticsService_1 = require("../services/contractAnalyticsService");
const contractLifecycleService_1 = require("../services/contractLifecycleService");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const AnalyticsQuerySchema = zod_1.z.object({
    timeFrame: zod_1.z.nativeEnum(contractAnalyticsService_1.TimeFrame).default(contractAnalyticsService_1.TimeFrame.THIS_MONTH),
    dateFrom: zod_1.z.coerce.date().optional(),
    dateTo: zod_1.z.coerce.date().optional(),
    contractTypes: zod_1.z.array(zod_1.z.nativeEnum(contractLifecycleService_1.ContractType)).optional(),
    clientIds: zod_1.z.array(zod_1.z.string()).optional(),
    statuses: zod_1.z.array(zod_1.z.nativeEnum(contractLifecycleService_1.ContractStatus)).optional(),
    includeRenewals: zod_1.z.coerce.boolean().optional(),
    groupBy: zod_1.z.enum(['month', 'quarter', 'year', 'week']).optional(),
});
const GenerateReportSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(contractAnalyticsService_1.ReportType),
    timeFrame: zod_1.z.nativeEnum(contractAnalyticsService_1.TimeFrame).default(contractAnalyticsService_1.TimeFrame.THIS_MONTH),
    dateFrom: zod_1.z.coerce.date().optional(),
    dateTo: zod_1.z.coerce.date().optional(),
    format: zod_1.z.nativeEnum(contractAnalyticsService_1.ExportFormat).default(contractAnalyticsService_1.ExportFormat.PDF),
    includeCharts: zod_1.z.boolean().default(true),
    filters: zod_1.z.object({
        contractTypes: zod_1.z.array(zod_1.z.nativeEnum(contractLifecycleService_1.ContractType)).optional(),
        clientIds: zod_1.z.array(zod_1.z.string()).optional(),
        statuses: zod_1.z.array(zod_1.z.nativeEnum(contractLifecycleService_1.ContractStatus)).optional(),
    }).optional(),
    customFields: zod_1.z.array(zod_1.z.string()).optional(),
    groupBy: zod_1.z.enum(['month', 'quarter', 'year']).optional(),
});
class ContractAnalyticsController {
    async getContractOverview(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const query = AnalyticsQuerySchema.parse(req.query);
            logger_1.logger.debug('Fetching contract overview analytics', { tenantId, query });
            const metrics = await contractAnalyticsService_1.contractAnalyticsService.getContractOverview(tenantId, query);
            return response_1.ResponseHelper.success(res, metrics, 'Contract overview retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching contract overview', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Invalid query parameters', 400, error.errors);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch contract overview', 500);
        }
    }
    async getRevenueAnalysis(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const query = AnalyticsQuerySchema.parse(req.query);
            logger_1.logger.debug('Fetching revenue analysis', { tenantId, query });
            const analysis = await contractAnalyticsService_1.contractAnalyticsService.getRevenueAnalysis(tenantId, query);
            return response_1.ResponseHelper.success(res, analysis, 'Revenue analysis retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching revenue analysis', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Invalid query parameters', 400, error.errors);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch revenue analysis', 500);
        }
    }
    async getClientAnalysis(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const query = AnalyticsQuerySchema.parse(req.query);
            logger_1.logger.debug('Fetching client analysis', { tenantId, query });
            const analysis = await contractAnalyticsService_1.contractAnalyticsService.getClientAnalysis(tenantId, query);
            return response_1.ResponseHelper.success(res, analysis, 'Client analysis retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching client analysis', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Invalid query parameters', 400, error.errors);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch client analysis', 500);
        }
    }
    async getRenewalPerformance(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const query = AnalyticsQuerySchema.parse(req.query);
            logger_1.logger.debug('Fetching renewal performance', { tenantId, query });
            const performance = await contractAnalyticsService_1.contractAnalyticsService.getRenewalPerformance(tenantId, query);
            return response_1.ResponseHelper.success(res, performance, 'Renewal performance retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching renewal performance', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Invalid query parameters', 400, error.errors);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch renewal performance', 500);
        }
    }
    async getContractLifecycleMetrics(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const query = AnalyticsQuerySchema.parse(req.query);
            logger_1.logger.debug('Fetching contract lifecycle metrics', { tenantId, query });
            const metrics = await contractAnalyticsService_1.contractAnalyticsService.getContractLifecycleMetrics(tenantId, query);
            return response_1.ResponseHelper.success(res, metrics, 'Contract lifecycle metrics retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching contract lifecycle metrics', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Invalid query parameters', 400, error.errors);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch contract lifecycle metrics', 500);
        }
    }
    async getExpiryForecast(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Fetching expiry forecast', { tenantId });
            const forecast = await contractAnalyticsService_1.contractAnalyticsService.getExpiryForecast(tenantId);
            return response_1.ResponseHelper.success(res, forecast, 'Expiry forecast retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching expiry forecast', { error });
            return response_1.ResponseHelper.error(res, 'Failed to fetch expiry forecast', 500);
        }
    }
    async generateReport(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const generatedBy = req.user?.id;
            if (!tenantId || !generatedBy) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const options = GenerateReportSchema.parse(req.body);
            logger_1.logger.info('Generating analytics report', {
                tenantId,
                type: options.type,
                format: options.format,
                generatedBy,
            });
            const report = await contractAnalyticsService_1.contractAnalyticsService.generateReport(tenantId, generatedBy, options);
            logger_1.logger.info('Analytics report generated successfully', {
                tenantId,
                reportId: report.id,
                type: options.type,
                format: options.format,
            });
            return response_1.ResponseHelper.success(res, report, 'Report generated successfully', 201);
        }
        catch (error) {
            logger_1.logger.error('Error generating report', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.ValidationError) {
                return response_1.ResponseHelper.error(res, error.message, 400);
            }
            return response_1.ResponseHelper.error(res, 'Failed to generate report', 500);
        }
    }
    async getReportHistory(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Fetching report history', { tenantId });
            const reports = await contractAnalyticsService_1.contractAnalyticsService.getReportHistory(tenantId);
            return response_1.ResponseHelper.success(res, reports, 'Report history retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching report history', { error });
            return response_1.ResponseHelper.error(res, 'Failed to fetch report history', 500);
        }
    }
    async getDashboardMetrics(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Fetching dashboard metrics', { tenantId });
            const metrics = await contractAnalyticsService_1.contractAnalyticsService.getDashboardMetrics(tenantId);
            return response_1.ResponseHelper.success(res, metrics, 'Dashboard metrics retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching dashboard metrics', { error });
            return response_1.ResponseHelper.error(res, 'Failed to fetch dashboard metrics', 500);
        }
    }
    async downloadReport(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { reportId } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.info('Downloading report', { tenantId, reportId });
            const mockFile = {
                filename: `contract-report-${reportId}.pdf`,
                contentType: 'application/pdf',
                size: 1024 * 1024,
            };
            res.setHeader('Content-Disposition', `attachment; filename="${mockFile.filename}"`);
            res.setHeader('Content-Type', mockFile.contentType);
            res.setHeader('Content-Length', mockFile.size.toString());
            return res.status(200).send('Mock PDF content');
        }
        catch (error) {
            logger_1.logger.error('Error downloading report', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to download report', 500);
        }
    }
    async getKPIs(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const query = AnalyticsQuerySchema.parse(req.query);
            logger_1.logger.debug('Fetching KPIs', { tenantId, query });
            const [overview, revenue, renewals] = await Promise.all([
                contractAnalyticsService_1.contractAnalyticsService.getContractOverview(tenantId, query),
                contractAnalyticsService_1.contractAnalyticsService.getRevenueAnalysis(tenantId, query),
                contractAnalyticsService_1.contractAnalyticsService.getRenewalPerformance(tenantId, query),
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
            return response_1.ResponseHelper.success(res, kpis, 'KPIs retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching KPIs', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Invalid query parameters', 400, error.errors);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch KPIs', 500);
        }
    }
}
exports.ContractAnalyticsController = ContractAnalyticsController;
exports.contractAnalyticsController = new ContractAnalyticsController();
//# sourceMappingURL=contractAnalyticsController.js.map