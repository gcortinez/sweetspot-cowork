import express from 'express';
import { contractAnalyticsController } from '../controllers/contractAnalyticsController';
import { authenticate, authorize } from '../middleware/auth';

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
  authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  contractAnalyticsController.getContractOverview.bind(contractAnalyticsController)
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
  authorize(['ADMIN', 'MANAGER']),
  contractAnalyticsController.getRevenueAnalysis.bind(contractAnalyticsController)
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
  authorize(['ADMIN', 'MANAGER']),
  contractAnalyticsController.getClientAnalysis.bind(contractAnalyticsController)
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
  authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  contractAnalyticsController.getRenewalPerformance.bind(contractAnalyticsController)
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
  authorize(['ADMIN', 'MANAGER']),
  contractAnalyticsController.getContractLifecycleMetrics.bind(contractAnalyticsController)
);

/**
 * @route GET /api/analytics/contracts/expiry-forecast
 * @desc Get contract expiry forecast
 * @access Private (Admin, Manager, Employee)
 */
router.get('/expiry-forecast',
  authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  contractAnalyticsController.getExpiryForecast.bind(contractAnalyticsController)
);

/**
 * @route GET /api/analytics/contracts/dashboard
 * @desc Get dashboard metrics summary
 * @access Private (Admin, Manager, Employee)
 */
router.get('/dashboard',
  authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  contractAnalyticsController.getDashboardMetrics.bind(contractAnalyticsController)
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
  authorize(['ADMIN', 'MANAGER']),
  contractAnalyticsController.getKPIs.bind(contractAnalyticsController)
);

/**
 * @route POST /api/analytics/contracts/reports
 * @desc Generate analytics report
 * @access Private (Admin, Manager)
 * @body {GenerateReportOptions} Report generation options
 */
router.post('/reports',
  authorize(['ADMIN', 'MANAGER']),
  contractAnalyticsController.generateReport.bind(contractAnalyticsController)
);

/**
 * @route GET /api/analytics/contracts/reports
 * @desc Get report history
 * @access Private (Admin, Manager, Employee)
 */
router.get('/reports',
  authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  contractAnalyticsController.getReportHistory.bind(contractAnalyticsController)
);

/**
 * @route GET /api/analytics/contracts/reports/:reportId/download
 * @desc Download generated report
 * @access Private (Admin, Manager, Employee)
 * @param {string} reportId - Report ID
 */
router.get('/reports/:reportId/download',
  authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  contractAnalyticsController.downloadReport.bind(contractAnalyticsController)
);

export { router as contractAnalyticsRoutes };