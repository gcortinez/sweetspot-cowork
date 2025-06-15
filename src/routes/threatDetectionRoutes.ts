import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import * as threatDetectionController from '../controllers/threatDetectionController';

const router = Router();

// Apply authentication and tenant validation to all routes
router.use(requireAuth);
router.use(validateTenantAccess);

// ============================================================================
// BEHAVIORAL ANALYSIS
// ============================================================================

/**
 * @route   POST /api/threat-detection/analyze-behavior
 * @desc    Analyze user behavior for anomalies and threats
 * @access  Private (Cowork Admin only)
 */
router.post('/analyze-behavior', threatDetectionController.analyzeBehavior);

/**
 * @route   GET /api/threat-detection/behavior-profile/:userId
 * @desc    Get user behavior profile
 * @access  Private (Cowork Admin only)
 */
router.get('/behavior-profile/:userId', threatDetectionController.getUserBehaviorProfile);

// ============================================================================
// PATTERN DETECTION
// ============================================================================

/**
 * @route   GET /api/threat-detection/patterns
 * @desc    Detect security patterns in recent events
 * @access  Private (Cowork Admin only)
 */
router.get('/patterns', threatDetectionController.detectSecurityPatterns);

// ============================================================================
// THREAT PREDICTION
// ============================================================================

/**
 * @route   GET /api/threat-detection/predictions
 * @desc    Get AI-powered threat predictions
 * @access  Private (Cowork Admin only)
 */
router.get('/predictions', threatDetectionController.predictThreats);

// ============================================================================
// COMPREHENSIVE ANALYSIS
// ============================================================================

/**
 * @route   GET /api/threat-detection/analyze
 * @desc    Run comprehensive security analysis (patterns + predictions + scoring)
 * @access  Private (Cowork Admin only)
 */
router.get('/analyze', threatDetectionController.analyzeSecurityEvents);

// ============================================================================
// ALERT MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/threat-detection/alerts
 * @desc    Get security alerts with filtering
 * @access  Private (Cowork Admin only)
 */
router.get('/alerts', threatDetectionController.getSecurityAlerts);

/**
 * @route   PATCH /api/threat-detection/alerts/:alertId/resolve
 * @desc    Mark security alert as resolved
 * @access  Private (Cowork Admin only)
 */
router.patch('/alerts/:alertId/resolve', threatDetectionController.resolveSecurityAlert);

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

/**
 * @route   GET /api/threat-detection/config
 * @desc    Get threat detection configuration
 * @access  Private (Cowork Admin only)
 */
router.get('/config', threatDetectionController.getThreatDetectionConfig);

/**
 * @route   PUT /api/threat-detection/config
 * @desc    Update threat detection configuration
 * @access  Private (Cowork Admin only)
 */
router.put('/config', threatDetectionController.updateThreatDetectionConfig);

// ============================================================================
// STATISTICS AND REPORTING
// ============================================================================

/**
 * @route   GET /api/threat-detection/statistics
 * @desc    Get threat detection statistics and metrics
 * @access  Private (Cowork Admin only)
 */
router.get('/statistics', threatDetectionController.getThreatStatistics);

export default router;