import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { tenantMiddleware } from "../middleware/tenant";
import * as complianceController from "../controllers/complianceController";

const router = Router();

// Apply authentication and tenant validation to all routes
router.use(authenticate);
router.use(tenantMiddleware);

// ============================================================================
// COMPLIANCE DASHBOARD
// ============================================================================

/**
 * @route   GET /api/compliance/dashboard
 * @desc    Get compliance dashboard overview
 * @access  Private (Cowork Admin only)
 */
router.get("/dashboard", complianceController.getComplianceDashboard);

/**
 * @route   GET /api/compliance/alerts
 * @desc    Get compliance alerts
 * @access  Private (Cowork Admin only)
 */
router.get("/alerts", complianceController.getComplianceAlertsEndpoint);

// ============================================================================
// SOX COMPLIANCE REPORTING
// ============================================================================

/**
 * @route   POST /api/compliance/sox/report
 * @desc    Generate SOX compliance report
 * @access  Private (Admin)
 */
router.post("/sox/report", complianceController.generateSOXReport);

/**
 * @route   POST /api/compliance/sox/download
 * @desc    Download SOX compliance report as file
 * @access  Private (Cowork Admin only)
 */
router.post("/sox/download", complianceController.downloadSOXReport);

// ============================================================================
// HIPAA COMPLIANCE REPORTING
// ============================================================================

/**
 * @route   POST /api/compliance/hipaa/report
 * @desc    Generate HIPAA compliance report
 * @access  Private (Cowork Admin only)
 */
router.post("/hipaa/report", complianceController.generateHIPAAReport);

/**
 * @route   POST /api/compliance/hipaa/download
 * @desc    Download HIPAA compliance report as file
 * @access  Private (Cowork Admin only)
 */
router.post("/hipaa/download", complianceController.downloadHIPAAReport);

/**
 * @route   POST /api/compliance/hipaa/patient/:patientId
 * @desc    Generate HIPAA access log for specific patient
 * @access  Private (Cowork Admin only)
 */
router.post(
  "/hipaa/patient/:patientId",
  complianceController.generatePatientAccessLog
);

// ============================================================================
// PCI DSS COMPLIANCE REPORTING
// ============================================================================

/**
 * @route   POST /api/compliance/pci-dss/report
 * @desc    Generate PCI DSS compliance report
 * @access  Private (Cowork Admin only)
 */
router.post("/pci-dss/report", complianceController.generatePCIDSSReport);

/**
 * @route   POST /api/compliance/pci-dss/download
 * @desc    Download PCI DSS compliance report as file
 * @access  Private (Cowork Admin only)
 */
router.post("/pci-dss/download", complianceController.downloadPCIDSSReport);

export default router;
