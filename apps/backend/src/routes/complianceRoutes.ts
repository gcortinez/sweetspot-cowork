import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import * as complianceController from '../controllers/complianceController';

const router = Router();

// Apply authentication and tenant validation to all routes
router.use(requireAuth);
router.use(validateTenantAccess);

// ============================================================================
// COMPLIANCE DASHBOARD
// ============================================================================

/**
 * @route   GET /api/compliance/dashboard
 * @desc    Get comprehensive compliance dashboard
 * @access  Private (Cowork Admin only)
 */
router.get('/dashboard', complianceController.getComplianceDashboard);

/**
 * @route   GET /api/compliance/alerts
 * @desc    Get compliance alerts and warnings
 * @access  Private (Cowork Admin only)
 */
router.get('/alerts', complianceController.getComplianceAlerts);

// ============================================================================
// SOX COMPLIANCE REPORTING
// ============================================================================

/**
 * @route   POST /api/compliance/sox/report
 * @desc    Generate SOX compliance report
 * @access  Private (Cowork Admin only)
 */
router.post('/sox/report', complianceController.generateSOXReport);

/**
 * @route   POST /api/compliance/sox/download
 * @desc    Download SOX compliance report as file
 * @access  Private (Cowork Admin only)
 */
router.post('/sox/download', complianceController.downloadSOXReport);

// ============================================================================
// GDPR COMPLIANCE REPORTING
// ============================================================================

/**
 * @route   POST /api/compliance/gdpr/report
 * @desc    Generate GDPR compliance report
 * @access  Private (Cowork Admin only)
 */
router.post('/gdpr/report', complianceController.generateGDPRReport);

/**
 * @route   POST /api/compliance/gdpr/download
 * @desc    Download GDPR compliance report as file
 * @access  Private (Cowork Admin only)
 */
router.post('/gdpr/download', complianceController.downloadGDPRReport);

/**
 * @route   POST /api/compliance/gdpr/data-subject/:dataSubjectId
 * @desc    Generate GDPR report for specific data subject
 * @access  Private (Cowork Admin only)
 */
router.post('/gdpr/data-subject/:dataSubjectId', complianceController.generateDataSubjectReport);

// ============================================================================
// HIPAA COMPLIANCE REPORTING
// ============================================================================

/**
 * @route   POST /api/compliance/hipaa/report
 * @desc    Generate HIPAA compliance report
 * @access  Private (Cowork Admin only)
 */
router.post('/hipaa/report', complianceController.generateHIPAAReport);

/**
 * @route   POST /api/compliance/hipaa/download
 * @desc    Download HIPAA compliance report as file
 * @access  Private (Cowork Admin only)
 */
router.post('/hipaa/download', complianceController.downloadHIPAAReport);

/**
 * @route   POST /api/compliance/hipaa/patient/:patientId
 * @desc    Generate HIPAA access log for specific patient
 * @access  Private (Cowork Admin only)
 */
router.post('/hipaa/patient/:patientId', complianceController.generatePatientAccessLog);

// ============================================================================
// PCI DSS COMPLIANCE REPORTING
// ============================================================================

/**
 * @route   POST /api/compliance/pci-dss/report
 * @desc    Generate PCI DSS compliance report
 * @access  Private (Cowork Admin only)
 */
router.post('/pci-dss/report', complianceController.generatePCIDSSReport);

/**
 * @route   POST /api/compliance/pci-dss/download
 * @desc    Download PCI DSS compliance report as file
 * @access  Private (Cowork Admin only)
 */
router.post('/pci-dss/download', complianceController.downloadPCIDSSReport);

export default router;