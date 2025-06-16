import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import * as complianceController from '../controllers/complianceController';

const router = Router();

// Apply authentication and tenant validation to all routes
router.use(authenticate);
router.use(tenantMiddleware);

// ============================================================================
// COMPLIANCE DASHBOARD
// ============================================================================

/**
 * @route   GET /api/compliance/dashboard
 * @desc    Get comprehensive compliance dashboard
 * @access  Private (Cowork Admin only)
 */
router.get('/dashboard', complianceController.getComplianceDashboard as any);

/**
 * @route   GET /api/compliance/alerts
 * @desc    Get compliance alerts and warnings
 * @access  Private (Cowork Admin only)
 */
router.get('/alerts', complianceController.getComplianceAlerts as any);

// ============================================================================
// SOX COMPLIANCE REPORTING
// ============================================================================

/**
 * @route   POST /api/compliance/sox/report
 * @desc    Generate SOX compliance report
 * @access  Private (Cowork Admin only)
 */
router.post('/sox/report', complianceController.generateSOXReport as any);

/**
 * @route   POST /api/compliance/sox/download
 * @desc    Download SOX compliance report as file
 * @access  Private (Cowork Admin only)
 */
router.post('/sox/download', complianceController.downloadSOXReport as any);

// ============================================================================
// HIPAA COMPLIANCE REPORTING
// ============================================================================

/**
 * @route   POST /api/compliance/hipaa/report
 * @desc    Generate HIPAA compliance report
 * @access  Private (Cowork Admin only)
 */
router.post('/hipaa/report', complianceController.generateHIPAAReport as any);

/**
 * @route   POST /api/compliance/hipaa/download
 * @desc    Download HIPAA compliance report as file
 * @access  Private (Cowork Admin only)
 */
router.post('/hipaa/download', complianceController.downloadHIPAAReport as any);

/**
 * @route   POST /api/compliance/hipaa/patient/:patientId
 * @desc    Generate HIPAA access log for specific patient
 * @access  Private (Cowork Admin only)
 */
router.post('/hipaa/patient/:patientId', complianceController.generatePatientAccessLog as any);

// ============================================================================
// PCI DSS COMPLIANCE REPORTING
// ============================================================================

/**
 * @route   POST /api/compliance/pci-dss/report
 * @desc    Generate PCI DSS compliance report
 * @access  Private (Cowork Admin only)
 */
router.post('/pci-dss/report', complianceController.generatePCIDSSReport as any);

/**
 * @route   POST /api/compliance/pci-dss/download
 * @desc    Download PCI DSS compliance report as file
 * @access  Private (Cowork Admin only)
 */
router.post('/pci-dss/download', complianceController.downloadPCIDSSReport as any);

// ============================================================================
// DATA EXPORT ENDPOINTS
// ============================================================================

/**
 * @route   POST /api/compliance/export/request
 * @desc    Create data export request
 * @access  Private (Authenticated users)
 */
router.post('/export/request', complianceController.createDataExportRequest as any);

/**
 * @route   GET /api/compliance/export/:exportId/status
 * @desc    Get export status
 * @access  Private (Authenticated users)
 */
router.get('/export/:exportId/status', complianceController.getExportStatus as any);

/**
 * @route   GET /api/compliance/export/:exportId/download
 * @desc    Download exported data
 * @access  Private (Authenticated users)
 */
router.get('/export/:exportId/download', complianceController.downloadExport as any);

export default router;