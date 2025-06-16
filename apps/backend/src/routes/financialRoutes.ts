import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import * as financialController from '../controllers/financialController';

const router = Router();

// Apply authentication and tenant validation to all routes
router.use(authenticate);
router.use(tenantMiddleware);

// ============================================================================
// FINANCIAL OVERVIEW AND SUMMARY
// ============================================================================

/**
 * @route   GET /api/financial/overview
 * @desc    Get comprehensive financial overview
 * @access  Private
 * @query   startDate, endDate
 */
router.get('/overview', financialController.getFinancialOverview as any);

/**
 * @route   GET /api/financial/metrics
 * @desc    Get key financial metrics and KPIs
 * @access  Private
 * @query   period, startDate, endDate
 */
router.get('/metrics', financialController.getFinancialMetrics as any);

// ============================================================================
// FINANCIAL REPORTS
// ============================================================================

/**
 * @route   POST /api/financial/reports
 * @desc    Generate a new financial report
 * @access  Private
 * @body    reportType, period, startDate, endDate, title, description?, customFilters?
 */
router.post('/reports', financialController.createFinancialReport as any);

/**
 * @route   GET /api/financial/reports
 * @desc    Get financial reports with optional filters
 * @access  Private
 * @query   reportType?, period?, status?, startDate?, endDate?, generatedBy?, skip?, take?
 */
router.get('/reports', financialController.getFinancialReports as any);

/**
 * @route   GET /api/financial/reports/:reportId
 * @desc    Get specific financial report by ID
 * @access  Private
 */
router.get('/reports/:reportId', financialController.getFinancialReport as any);

/**
 * @route   DELETE /api/financial/reports/:reportId
 * @desc    Archive/delete a financial report
 * @access  Private
 */
router.delete('/reports/:reportId', financialController.deleteFinancialReport as any);

// ============================================================================
// REVENUE FORECASTING
// ============================================================================

/**
 * @route   POST /api/financial/forecasts
 * @desc    Create a new revenue forecast
 * @access  Private
 * @body    forecastType, period, startDate, endDate, methodology, customParameters?, notes?
 */
router.post('/forecasts', financialController.createRevenueForecast as any);

/**
 * @route   GET /api/financial/forecasts
 * @desc    Get revenue forecasts with optional filters
 * @access  Private
 * @query   forecastType?, period?, methodology?, status?, skip?, take?
 */
router.get('/forecasts', financialController.getRevenueForecasts as any);

/**
 * @route   PUT /api/financial/forecasts/:forecastId/accuracy
 * @desc    Update forecast accuracy with actual results
 * @access  Private
 * @body    actualValue
 */
router.put('/forecasts/:forecastId/accuracy', financialController.updateForecastAccuracy as any);

// ============================================================================
// PROFIT ANALYSIS
// ============================================================================

/**
 * @route   POST /api/financial/analysis/profit
 * @desc    Generate comprehensive profit analysis
 * @access  Private
 * @body    analysisType, period, startDate, endDate, compareWith?, includeForecasting?
 */
router.post('/analysis/profit', financialController.createProfitAnalysis as any);

// Note: Additional profit analysis endpoints would be added here
// GET /api/financial/analysis/profit - Get profit analyses
// GET /api/financial/analysis/profit/:analysisId - Get specific analysis
// PUT /api/financial/analysis/profit/:analysisId - Update analysis
// DELETE /api/financial/analysis/profit/:analysisId - Delete analysis

// ============================================================================
// PAYMENT RECONCILIATION
// ============================================================================

/**
 * @route   POST /api/financial/reconciliation
 * @desc    Create a new payment reconciliation
 * @access  Private
 * @body    reconciliationType, period, startDate, endDate, bankStatementFile?, reconciliationRules?, autoMatch?
 */
router.post('/reconciliation', financialController.createPaymentReconciliation as any);

/**
 * @route   GET /api/financial/reconciliation
 * @desc    Get payment reconciliations with optional filters
 * @access  Private
 * @query   reconciliationType?, status?, startDate?, endDate?, skip?, take?
 */
router.get('/reconciliation', financialController.getPaymentReconciliations as any);

/**
 * @route   GET /api/financial/reconciliation/:reconciliationId
 * @desc    Get specific payment reconciliation by ID
 * @access  Private
 */
router.get('/reconciliation/:reconciliationId', financialController.getPaymentReconciliation as any);

/**
 * @route   POST /api/financial/reconciliation/items/:reconciliationItemId/match
 * @desc    Manually match a reconciliation item to a payment
 * @access  Private
 * @body    paymentId, notes?
 */
router.post('/reconciliation/items/:reconciliationItemId/match', financialController.manualMatchTransaction as any);

/**
 * @route   DELETE /api/financial/reconciliation/items/:reconciliationItemId/match
 * @desc    Unmatch a previously matched transaction
 * @access  Private
 * @body    reason?
 */
router.delete('/reconciliation/items/:reconciliationItemId/match', financialController.unmatchTransaction as any);

/**
 * @route   POST /api/financial/reconciliation/:reconciliationId/adjustments
 * @desc    Add an adjustment to a reconciliation
 * @access  Private
 * @body    type, amount, description, reference?
 */
router.post('/reconciliation/:reconciliationId/adjustments', financialController.addReconciliationAdjustment as any);

/**
 * @route   POST /api/financial/reconciliation/:reconciliationId/approve
 * @desc    Approve a completed reconciliation
 * @access  Private
 * @body    notes?
 */
router.post('/reconciliation/:reconciliationId/approve', financialController.approveReconciliation as any);

/**
 * @route   POST /api/financial/reconciliation/:reconciliationId/reject
 * @desc    Reject a reconciliation
 * @access  Private
 * @body    reason
 */
router.post('/reconciliation/:reconciliationId/reject', financialController.rejectReconciliation as any);

/**
 * @route   GET /api/financial/reconciliation/:reconciliationId/report
 * @desc    Generate detailed reconciliation report
 * @access  Private
 */
router.get('/reconciliation/:reconciliationId/report', financialController.getReconciliationReport as any);

// ============================================================================
// FINANCIAL DASHBOARDS
// ============================================================================

/**
 * @route   POST /api/financial/dashboards
 * @desc    Create a new financial dashboard
 * @access  Private
 * @body    dashboardType, period, startDate, endDate, customizations?, autoRefresh?, refreshInterval?
 */
router.post('/dashboards', financialController.createFinancialDashboard as any);

/**
 * @route   GET /api/financial/dashboards
 * @desc    Get financial dashboards with optional filters
 * @access  Private
 * @query   dashboardType?, createdBy?, skip?, take?
 */
router.get('/dashboards', financialController.getFinancialDashboards as any);

/**
 * @route   GET /api/financial/dashboards/:dashboardId
 * @desc    Get specific financial dashboard by ID
 * @access  Private
 */
router.get('/dashboards/:dashboardId', financialController.getFinancialDashboard as any);

/**
 * @route   POST /api/financial/dashboards/:dashboardId/refresh
 * @desc    Refresh dashboard data
 * @access  Private
 */
router.post('/dashboards/:dashboardId/refresh', financialController.refreshFinancialDashboard as any);

// Note: Additional dashboard endpoints would be added here
// PUT /api/financial/dashboards/:dashboardId - Update dashboard
// DELETE /api/financial/dashboards/:dashboardId - Delete dashboard
// POST /api/financial/dashboards/:dashboardId/share - Share dashboard
// PUT /api/financial/dashboards/:dashboardId/customize - Update customizations

export default router;