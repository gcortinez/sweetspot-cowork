import express from 'express';
import { contractAnalyticsController } from '../controllers/contractAnalyticsController';
import { authenticate, requireRole } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/analytics/contracts/overview
 * @desc Get contract overview analytics
 * @access Private (Admin, Manager, Employee)
 * @query {string} timeFrame - Time frame for analysis
 * @query {string} dateFrom - Start date for custom range
 * @query {string} dateTo - End date for custom range
 * @query {string[]} contractTypes - Filter by contract types
 * @query {string[]} clientIds - Filter by client IDs
 * @query {string[]} statuses - Filter by contract statuses
 * @query {boolean} includeRenewals - Include renewal data
 * @query {string} groupBy - Group results by period
 */
router.get('/overview', 
  requireRole('CLIENT_ADMIN'),
  contractAnalyticsController.getContractOverview.bind(contractAnalyticsController) as any
);

/**
 * @route GET /api/analytics/contracts/revenue
 * @desc Get revenue analysis
 * @access Private (Admin, Manager)
 * @query {string} timeFrame - Time frame for analysis
 * @query {string} dateFrom - Start date for custom range
 * @query {string} dateTo - End date for custom range
 * @query {string[]} contractTypes - Filter by contract types
 * @query {string} groupBy - Group results by period
 */
router.get('/revenue',
  requireRole('COWORK_ADMIN'),
  contractAnalyticsController.getRevenueAnalysis.bind(contractAnalyticsController) as any
);

/**
 * @route GET /api/analytics/contracts/clients
 * @desc Get client analysis
 * @access Private (Admin, Manager)
 * @query {string} timeFrame - Time frame for analysis
 * @query {string} dateFrom - Start date for custom range
 * @query {string} dateTo - End date for custom range
 * @query {string[]} clientIds - Filter by client IDs
 */
router.get('/clients',
  requireRole('COWORK_ADMIN'),
  contractAnalyticsController.getClientAnalysis.bind(contractAnalyticsController) as any
);

/**
 * @route GET /api/analytics/contracts/renewals
 * @desc Get renewal performance analytics
 * @access Private (Admin, Manager, Employee)
 * @query {string} timeFrame - Time frame for analysis
 * @query {string} dateFrom - Start date for custom range
 * @query {string} dateTo - End date for custom range
 * @query {string[]} contractTypes - Filter by contract types
 */
router.get('/renewals',
  requireRole('CLIENT_ADMIN'),
  contractAnalyticsController.getRenewalPerformance.bind(contractAnalyticsController) as any
);

/**
 * @route GET /api/analytics/contracts/lifecycle
 * @desc Get contract lifecycle metrics
 * @access Private (Admin, Manager)
 * @query {string} timeFrame - Time frame for analysis
 * @query {string} dateFrom - Start date for custom range
 * @query {string} dateTo - End date for custom range
 * @query {string[]} contractTypes - Filter by contract types
 */
router.get('/lifecycle',
  requireRole('COWORK_ADMIN'),
  contractAnalyticsController.getContractLifecycleMetrics.bind(contractAnalyticsController) as any
);

/**
 * @route GET /api/analytics/contracts/expiry-forecast
 * @desc Get contract expiry forecast
 * @access Private (Admin, Manager, Employee)
 */
router.get('/expiry-forecast',
  requireRole('CLIENT_ADMIN'),
  contractAnalyticsController.getExpiryForecast.bind(contractAnalyticsController) as any
);

/**
 * @route GET /api/analytics/contracts/dashboard
 * @desc Get dashboard metrics summary
 * @access Private (Admin, Manager, Employee)
 */
router.get('/dashboard',
  requireRole('CLIENT_ADMIN'),
  contractAnalyticsController.getDashboardMetrics.bind(contractAnalyticsController) as any
);

/**
 * @route GET /api/analytics/contracts/kpis
 * @desc Get key performance indicators
 * @access Private (Admin, Manager)
 * @query {string} timeFrame - Time frame for analysis
 * @query {string} dateFrom - Start date for custom range
 * @query {string} dateTo - End date for custom range
 */
router.get('/kpis',
  requireRole('COWORK_ADMIN'),
  contractAnalyticsController.getKPIs.bind(contractAnalyticsController) as any
);

/**
 * @route POST /api/analytics/contracts/reports
 * @desc Generate analytics report
 * @access Private (Admin, Manager)
 * @body {GenerateReportOptions} Report generation options
 */
router.post('/reports',
  requireRole('COWORK_ADMIN'),
  contractAnalyticsController.generateReport.bind(contractAnalyticsController) as any
);

/**
 * @route GET /api/analytics/contracts/reports
 * @desc Get report history
 * @access Private (Admin, Manager, Employee)
 */
router.get('/reports',
  requireRole('CLIENT_ADMIN'),
  contractAnalyticsController.getReportHistory.bind(contractAnalyticsController) as any
);

/**
 * @route GET /api/analytics/contracts/reports/:reportId/download
 * @desc Download generated report
 * @access Private (Admin, Manager, Employee)
 * @param {string} reportId - Report ID
 */
router.get('/reports/:reportId/download',
  requireRole('CLIENT_ADMIN'),
  contractAnalyticsController.downloadReport.bind(contractAnalyticsController) as any
);

export { router as contractAnalyticsRoutes };