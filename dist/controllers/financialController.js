"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialMetrics = exports.getFinancialOverview = exports.refreshFinancialDashboard = exports.getFinancialDashboard = exports.getFinancialDashboards = exports.createFinancialDashboard = exports.getReconciliationReport = exports.rejectReconciliation = exports.approveReconciliation = exports.addReconciliationAdjustment = exports.unmatchTransaction = exports.manualMatchTransaction = exports.getPaymentReconciliation = exports.getPaymentReconciliations = exports.createPaymentReconciliation = exports.createProfitAnalysis = exports.updateForecastAccuracy = exports.getRevenueForecasts = exports.createRevenueForecast = exports.deleteFinancialReport = exports.getFinancialReport = exports.getFinancialReports = exports.createFinancialReport = void 0;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const financialReportService_1 = require("../services/financialReportService");
const revenueForecastService_1 = require("../services/revenueForecastService");
const profitAnalysisService_1 = require("../services/profitAnalysisService");
const paymentReconciliationService_1 = require("../services/paymentReconciliationService");
const financialDashboardService_1 = require("../services/financialDashboardService");
const client_1 = require("@prisma/client");
const createFinancialReportSchema = zod_1.z.object({
    reportType: zod_1.z.nativeEnum(client_1.FinancialReportType),
    period: zod_1.z.nativeEnum(client_1.ReportPeriod),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    customFilters: zod_1.z.record(zod_1.z.any()).optional(),
});
const createForecastSchema = zod_1.z.object({
    forecastType: zod_1.z.nativeEnum(client_1.ForecastType),
    period: zod_1.z.nativeEnum(client_1.ForecastPeriod),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    methodology: zod_1.z.nativeEnum(client_1.ForecastMethod),
    customParameters: zod_1.z.record(zod_1.z.any()).optional(),
    notes: zod_1.z.string().optional(),
});
const createProfitAnalysisSchema = zod_1.z.object({
    analysisType: zod_1.z.nativeEnum(client_1.AnalysisType),
    period: zod_1.z.nativeEnum(client_1.ReportPeriod),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    compareWith: zod_1.z.object({
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
    }).optional(),
    includeForecasting: zod_1.z.boolean().optional(),
});
const createReconciliationSchema = zod_1.z.object({
    reconciliationType: zod_1.z.nativeEnum(client_1.ReconciliationType),
    period: zod_1.z.nativeEnum(client_1.ReportPeriod),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    bankStatementFile: zod_1.z.string().optional(),
    reconciliationRules: zod_1.z.object({
        amountTolerance: zod_1.z.number().min(0),
        amountTolerancePercent: zod_1.z.number().min(0).max(100),
        dateTolerance: zod_1.z.number().min(0),
        descriptionMatching: zod_1.z.object({
            enabled: zod_1.z.boolean(),
            minimumSimilarity: zod_1.z.number().min(0).max(1),
            keywordMatching: zod_1.z.boolean(),
        }),
        referenceMatching: zod_1.z.object({
            enabled: zod_1.z.boolean(),
            strictMatching: zod_1.z.boolean(),
        }),
        duplicateDetection: zod_1.z.object({
            enabled: zod_1.z.boolean(),
            timeWindow: zod_1.z.number().min(0),
        }),
        autoApproval: zod_1.z.object({
            enabled: zod_1.z.boolean(),
            confidenceThreshold: zod_1.z.number().min(0).max(100),
            amountLimit: zod_1.z.number().min(0),
        }),
    }).optional(),
    autoMatch: zod_1.z.boolean().optional(),
});
const createDashboardSchema = zod_1.z.object({
    dashboardType: zod_1.z.nativeEnum(client_1.DashboardType),
    period: zod_1.z.nativeEnum(client_1.ReportPeriod),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    customizations: zod_1.z.object({
        layout: zod_1.z.enum(['GRID', 'FLEXIBLE', 'CUSTOM']),
        widgets: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            type: zod_1.z.string(),
            position: zod_1.z.object({
                x: zod_1.z.number(),
                y: zod_1.z.number(),
                width: zod_1.z.number(),
                height: zod_1.z.number(),
            }),
            config: zod_1.z.any(),
            visible: zod_1.z.boolean(),
        })),
        filters: zod_1.z.object({
            dateRange: zod_1.z.enum(['CUSTOM', 'LAST_30_DAYS', 'LAST_90_DAYS', 'YEAR_TO_DATE']).optional(),
            clients: zod_1.z.array(zod_1.z.string()).optional(),
            services: zod_1.z.array(zod_1.z.string()).optional(),
            locations: zod_1.z.array(zod_1.z.string()).optional(),
        }),
        theme: zod_1.z.object({
            colorScheme: zod_1.z.enum(['LIGHT', 'DARK', 'AUTO']),
            primaryColor: zod_1.z.string(),
            chartStyle: zod_1.z.enum(['MODERN', 'CLASSIC', 'MINIMAL']),
        }),
    }).optional(),
    autoRefresh: zod_1.z.boolean().optional(),
    refreshInterval: zod_1.z.number().min(300).optional(),
});
const manualMatchSchema = zod_1.z.object({
    paymentId: zod_1.z.string(),
    notes: zod_1.z.string().optional(),
});
const adjustmentSchema = zod_1.z.object({
    type: zod_1.z.enum(['BANK_ERROR', 'RECORDING_ERROR', 'TIMING_DIFFERENCE', 'FEE', 'OTHER']),
    amount: zod_1.z.number(),
    description: zod_1.z.string().min(1),
    reference: zod_1.z.string().optional(),
});
const createFinancialReport = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const validatedData = createFinancialReportSchema.parse(req.body);
        const request = {
            ...validatedData,
            startDate: new Date(validatedData.startDate),
            endDate: new Date(validatedData.endDate),
        };
        const report = await financialReportService_1.financialReportService.generateReport(tenantId, userId, request);
        logger_1.logger.info('Financial report created successfully', { tenantId, reportId: report.id, reportType: request.reportType });
        return response_1.ResponseHelper.success(res, report, 201);
    }
    catch (error) {
        logger_1.logger.error('Failed to create financial report', { tenantId: req.tenantId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid report data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to create financial report');
    }
};
exports.createFinancialReport = createFinancialReport;
const getFinancialReports = async (req, res) => {
    try {
        const { tenantId } = req;
        const { reportType, period, status, startDate, endDate, generatedBy, skip, take } = req.query;
        const filters = {};
        if (reportType)
            filters.reportType = reportType;
        if (period)
            filters.period = period;
        if (status)
            filters.status = status;
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (generatedBy)
            filters.generatedBy = generatedBy;
        const pagination = {
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
        };
        const result = await financialReportService_1.financialReportService.getReports(tenantId, filters, pagination);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to get financial reports', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get financial reports');
    }
};
exports.getFinancialReports = getFinancialReports;
const getFinancialReport = async (req, res) => {
    try {
        const { tenantId } = req;
        const { reportId } = req.params;
        const report = await financialReportService_1.financialReportService.getReportById(tenantId, reportId);
        if (!report) {
            return response_1.ResponseHelper.notFound(res, 'Financial report not found');
        }
        return response_1.ResponseHelper.success(res, report);
    }
    catch (error) {
        logger_1.logger.error('Failed to get financial report', { tenantId: req.tenantId, reportId: req.params.reportId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get financial report');
    }
};
exports.getFinancialReport = getFinancialReport;
const deleteFinancialReport = async (req, res) => {
    try {
        const { tenantId } = req;
        const { reportId } = req.params;
        await financialReportService_1.financialReportService.deleteReport(tenantId, reportId);
        return response_1.ResponseHelper.success(res, { message: 'Financial report archived successfully' });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete financial report', { tenantId: req.tenantId, reportId: req.params.reportId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to delete financial report');
    }
};
exports.deleteFinancialReport = deleteFinancialReport;
const createRevenueForecast = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const validatedData = createForecastSchema.parse(req.body);
        const request = {
            ...validatedData,
            startDate: new Date(validatedData.startDate),
            endDate: new Date(validatedData.endDate),
        };
        const forecast = await revenueForecastService_1.revenueForecastService.generateForecast(tenantId, userId, request);
        logger_1.logger.info('Revenue forecast created successfully', { tenantId, forecastId: forecast.id, methodology: request.methodology });
        return response_1.ResponseHelper.success(res, forecast, 201);
    }
    catch (error) {
        logger_1.logger.error('Failed to create revenue forecast', { tenantId: req.tenantId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid forecast data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to create revenue forecast');
    }
};
exports.createRevenueForecast = createRevenueForecast;
const getRevenueForecasts = async (req, res) => {
    try {
        const { tenantId } = req;
        const { forecastType, period, methodology, status, skip, take } = req.query;
        const filters = {};
        if (forecastType)
            filters.forecastType = forecastType;
        if (period)
            filters.period = period;
        if (methodology)
            filters.methodology = methodology;
        if (status)
            filters.status = status;
        const pagination = {
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
        };
        const result = await revenueForecastService_1.revenueForecastService.getForecasts(tenantId, filters, pagination);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to get revenue forecasts', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get revenue forecasts');
    }
};
exports.getRevenueForecasts = getRevenueForecasts;
const updateForecastAccuracy = async (req, res) => {
    try {
        const { tenantId } = req;
        const { forecastId } = req.params;
        const { actualValue } = req.body;
        if (typeof actualValue !== 'number') {
            return response_1.ResponseHelper.badRequest(res, 'actualValue must be a number');
        }
        await revenueForecastService_1.revenueForecastService.updateForecastAccuracy(tenantId, forecastId, actualValue);
        return response_1.ResponseHelper.success(res, { message: 'Forecast accuracy updated successfully' });
    }
    catch (error) {
        logger_1.logger.error('Failed to update forecast accuracy', { tenantId: req.tenantId, forecastId: req.params.forecastId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to update forecast accuracy');
    }
};
exports.updateForecastAccuracy = updateForecastAccuracy;
const createProfitAnalysis = async (req, res) => {
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
        const analysis = await profitAnalysisService_1.profitAnalysisService.generateProfitAnalysis(tenantId, userId, request);
        logger_1.logger.info('Profit analysis created successfully', { tenantId, analysisId: analysis.id, analysisType: request.analysisType });
        return response_1.ResponseHelper.success(res, analysis, 201);
    }
    catch (error) {
        logger_1.logger.error('Failed to create profit analysis', { tenantId: req.tenantId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid analysis data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to create profit analysis');
    }
};
exports.createProfitAnalysis = createProfitAnalysis;
const createPaymentReconciliation = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const validatedData = createReconciliationSchema.parse(req.body);
        const request = {
            ...validatedData,
            startDate: new Date(validatedData.startDate),
            endDate: new Date(validatedData.endDate),
        };
        const reconciliation = await paymentReconciliationService_1.paymentReconciliationService.createReconciliation(tenantId, userId, request);
        logger_1.logger.info('Payment reconciliation created successfully', { tenantId, reconciliationId: reconciliation.id });
        return response_1.ResponseHelper.success(res, reconciliation, 201);
    }
    catch (error) {
        logger_1.logger.error('Failed to create payment reconciliation', { tenantId: req.tenantId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid reconciliation data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to create payment reconciliation');
    }
};
exports.createPaymentReconciliation = createPaymentReconciliation;
const getPaymentReconciliations = async (req, res) => {
    try {
        const { tenantId } = req;
        const { reconciliationType, status, startDate, endDate, skip, take } = req.query;
        const filters = {};
        if (reconciliationType)
            filters.reconciliationType = reconciliationType;
        if (status)
            filters.status = status;
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        const pagination = {
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
        };
        const result = await paymentReconciliationService_1.paymentReconciliationService.getReconciliations(tenantId, filters, pagination);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to get payment reconciliations', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get payment reconciliations');
    }
};
exports.getPaymentReconciliations = getPaymentReconciliations;
const getPaymentReconciliation = async (req, res) => {
    try {
        const { tenantId } = req;
        const { reconciliationId } = req.params;
        const reconciliation = await paymentReconciliationService_1.paymentReconciliationService.getReconciliationById(tenantId, reconciliationId);
        if (!reconciliation) {
            return response_1.ResponseHelper.notFound(res, 'Payment reconciliation not found');
        }
        return response_1.ResponseHelper.success(res, reconciliation);
    }
    catch (error) {
        logger_1.logger.error('Failed to get payment reconciliation', { tenantId: req.tenantId, reconciliationId: req.params.reconciliationId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get payment reconciliation');
    }
};
exports.getPaymentReconciliation = getPaymentReconciliation;
const manualMatchTransaction = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { reconciliationItemId } = req.params;
        const validatedData = manualMatchSchema.parse(req.body);
        const result = await paymentReconciliationService_1.paymentReconciliationService.manualMatch(tenantId, reconciliationItemId, validatedData.paymentId, userId, validatedData.notes);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to create manual match', { tenantId: req.tenantId, reconciliationItemId: req.params.reconciliationItemId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid match data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to create manual match');
    }
};
exports.manualMatchTransaction = manualMatchTransaction;
const unmatchTransaction = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { reconciliationItemId } = req.params;
        const { reason } = req.body;
        const result = await paymentReconciliationService_1.paymentReconciliationService.unmatchTransaction(tenantId, reconciliationItemId, userId, reason);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to unmatch transaction', { tenantId: req.tenantId, reconciliationItemId: req.params.reconciliationItemId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to unmatch transaction');
    }
};
exports.unmatchTransaction = unmatchTransaction;
const addReconciliationAdjustment = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { reconciliationId } = req.params;
        const validatedData = adjustmentSchema.parse(req.body);
        await paymentReconciliationService_1.paymentReconciliationService.addAdjustment(tenantId, reconciliationId, validatedData, userId);
        return response_1.ResponseHelper.success(res, { message: 'Adjustment added successfully' });
    }
    catch (error) {
        logger_1.logger.error('Failed to add reconciliation adjustment', { tenantId: req.tenantId, reconciliationId: req.params.reconciliationId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid adjustment data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to add reconciliation adjustment');
    }
};
exports.addReconciliationAdjustment = addReconciliationAdjustment;
const approveReconciliation = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { reconciliationId } = req.params;
        const { notes } = req.body;
        const reconciliation = await paymentReconciliationService_1.paymentReconciliationService.approveReconciliation(tenantId, reconciliationId, userId, notes);
        return response_1.ResponseHelper.success(res, reconciliation);
    }
    catch (error) {
        logger_1.logger.error('Failed to approve reconciliation', { tenantId: req.tenantId, reconciliationId: req.params.reconciliationId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to approve reconciliation');
    }
};
exports.approveReconciliation = approveReconciliation;
const rejectReconciliation = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { reconciliationId } = req.params;
        const { reason } = req.body;
        if (!reason || typeof reason !== 'string') {
            return response_1.ResponseHelper.badRequest(res, 'Rejection reason is required');
        }
        const reconciliation = await paymentReconciliationService_1.paymentReconciliationService.rejectReconciliation(tenantId, reconciliationId, userId, reason);
        return response_1.ResponseHelper.success(res, reconciliation);
    }
    catch (error) {
        logger_1.logger.error('Failed to reject reconciliation', { tenantId: req.tenantId, reconciliationId: req.params.reconciliationId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to reject reconciliation');
    }
};
exports.rejectReconciliation = rejectReconciliation;
const getReconciliationReport = async (req, res) => {
    try {
        const { tenantId } = req;
        const { reconciliationId } = req.params;
        const report = await paymentReconciliationService_1.paymentReconciliationService.generateReconciliationReport(tenantId, reconciliationId);
        return response_1.ResponseHelper.success(res, report);
    }
    catch (error) {
        logger_1.logger.error('Failed to generate reconciliation report', { tenantId: req.tenantId, reconciliationId: req.params.reconciliationId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to generate reconciliation report');
    }
};
exports.getReconciliationReport = getReconciliationReport;
const createFinancialDashboard = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const validatedData = createDashboardSchema.parse(req.body);
        const request = {
            ...validatedData,
            startDate: new Date(validatedData.startDate),
            endDate: new Date(validatedData.endDate),
        };
        const dashboard = await financialDashboardService_1.financialDashboardService.createDashboard(tenantId, userId, request);
        logger_1.logger.info('Financial dashboard created successfully', { tenantId, dashboardId: dashboard.id, dashboardType: request.dashboardType });
        return response_1.ResponseHelper.success(res, dashboard, 201);
    }
    catch (error) {
        logger_1.logger.error('Failed to create financial dashboard', { tenantId: req.tenantId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid dashboard data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to create financial dashboard');
    }
};
exports.createFinancialDashboard = createFinancialDashboard;
const getFinancialDashboards = async (req, res) => {
    try {
        const { tenantId } = req;
        const { dashboardType, createdBy, skip, take } = req.query;
        const filters = {};
        if (dashboardType)
            filters.dashboardType = dashboardType;
        if (createdBy)
            filters.createdBy = createdBy;
        const pagination = {
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
        };
        const result = await financialDashboardService_1.financialDashboardService.getDashboards(tenantId, filters, pagination);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to get financial dashboards', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get financial dashboards');
    }
};
exports.getFinancialDashboards = getFinancialDashboards;
const getFinancialDashboard = async (req, res) => {
    try {
        const { tenantId } = req;
        const { dashboardId } = req.params;
        const dashboards = await financialDashboardService_1.financialDashboardService.getDashboards(tenantId, {}, {});
        const dashboard = dashboards.dashboards.find(d => d.id === dashboardId);
        if (!dashboard) {
            return response_1.ResponseHelper.notFound(res, 'Financial dashboard not found');
        }
        return response_1.ResponseHelper.success(res, dashboard);
    }
    catch (error) {
        logger_1.logger.error('Failed to get financial dashboard', { tenantId: req.tenantId, dashboardId: req.params.dashboardId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get financial dashboard');
    }
};
exports.getFinancialDashboard = getFinancialDashboard;
const refreshFinancialDashboard = async (req, res) => {
    try {
        const { tenantId } = req;
        const { dashboardId } = req.params;
        const dashboard = await financialDashboardService_1.financialDashboardService.refreshDashboard(tenantId, dashboardId);
        return response_1.ResponseHelper.success(res, dashboard);
    }
    catch (error) {
        logger_1.logger.error('Failed to refresh financial dashboard', { tenantId: req.tenantId, dashboardId: req.params.dashboardId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to refresh financial dashboard');
    }
};
exports.refreshFinancialDashboard = refreshFinancialDashboard;
const getFinancialOverview = async (req, res) => {
    try {
        const { tenantId } = req;
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return response_1.ResponseHelper.badRequest(res, 'startDate and endDate are required');
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const [revenueForecasts, profitAnalyses, reconciliations, dashboards] = await Promise.all([
            revenueForecastService_1.revenueForecastService.getForecasts(tenantId, {}, { take: 5 }),
            paymentReconciliationService_1.paymentReconciliationService.getReconciliations(tenantId, {}, { take: 5 }),
            financialDashboardService_1.financialDashboardService.getDashboards(tenantId, {}, { take: 3 }),
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
                forecastAccuracy: 85,
                lastRefresh: new Date(),
            },
        };
        return response_1.ResponseHelper.success(res, overview);
    }
    catch (error) {
        logger_1.logger.error('Failed to get financial overview', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get financial overview');
    }
};
exports.getFinancialOverview = getFinancialOverview;
const getFinancialMetrics = async (req, res) => {
    try {
        const { tenantId } = req;
        const { period = 'MONTHLY', startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return response_1.ResponseHelper.badRequest(res, 'startDate and endDate are required');
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
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
        return response_1.ResponseHelper.success(res, metrics);
    }
    catch (error) {
        logger_1.logger.error('Failed to get financial metrics', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get financial metrics');
    }
};
exports.getFinancialMetrics = getFinancialMetrics;
//# sourceMappingURL=financialController.js.map