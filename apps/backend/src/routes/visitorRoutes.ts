import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { tenantMiddleware } from "../middleware/tenant";
import { createCustomRateLimit } from "../middleware/rateLimiting";
import * as visitorController from "../controllers/visitorController";

const router = Router();

// Apply authentication and tenant validation to all routes
router.use(authenticate);
router.use(tenantMiddleware);

// Rate limiting for sensitive operations
const strictRateLimit = createCustomRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

const accessCodeRateLimit = createCustomRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: "Too many access code requests, please try again later.",
});

// ============================================================================
// VISITOR MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/visitors
 * @desc    Create a new visitor
 * @access  Private
 */
router.post("/", strictRateLimit, visitorController.createVisitor as any);

/**
 * @route   PUT /api/visitors/:visitorId
 * @desc    Update visitor details
 * @access  Private
 */
router.put(
  "/:visitorId",
  strictRateLimit,
  visitorController.updateVisitor as any
);

/**
 * @route   DELETE /api/visitors/:visitorId
 * @desc    Cancel/delete a visitor
 * @access  Private
 */
router.delete("/:visitorId", visitorController.deleteVisitor as any);

/**
 * @route   GET /api/visitors/:visitorId
 * @desc    Get visitor details by ID
 * @access  Private
 */
router.get("/:visitorId", visitorController.getVisitor as any);

/**
 * @route   GET /api/visitors
 * @desc    Get visitors with optional filters
 * @access  Private
 * @query   status, hostUserId, purpose, fromDate, toDate, search, includeExpired, skip, take
 */
router.get("/", visitorController.getVisitors as any);

/**
 * @route   GET /api/visitors/today/list
 * @desc    Get today's visitors
 * @access  Private
 */
router.get("/today/list", visitorController.getTodaysVisitors as any);

/**
 * @route   GET /api/visitors/active/list
 * @desc    Get currently checked-in visitors
 * @access  Private
 */
router.get("/active/list", visitorController.getActiveVisitors as any);

/**
 * @route   GET /api/visitors/qr/:qrCode
 * @desc    Get visitor by QR code
 * @access  Private
 */
// router.get('/qr/:qrCode', visitorController.getVisitorByQRCode as any);

/**
 * @route   GET /api/visitors/:visitorId/history
 * @desc    Get visitor activity history
 * @access  Private
 */
// router.get('/:visitorId/history', visitorController.getVisitorHistory as any);

// ============================================================================
// CHECK-IN/CHECK-OUT
// ============================================================================

/**
 * @route   POST /api/visitors/checkin
 * @desc    Check in a visitor
 * @access  Private
 */
router.post("/checkin", visitorController.checkInVisitor as any);

/**
 * @route   POST /api/visitors/checkout
 * @desc    Check out a visitor
 * @access  Private
 */
router.post("/checkout", visitorController.checkOutVisitor as any);

/**
 * @route   PUT /api/visitors/:visitorId/extend
 * @desc    Extend visitor stay
 * @access  Private
 */
router.put("/:visitorId/extend", visitorController.extendVisitorStay as any);

// ============================================================================
// PRE-REGISTRATION
// ============================================================================

/**
 * @route   POST /api/visitors/pre-registrations
 * @desc    Create a new pre-registration
 * @access  Private
 */
router.post(
  "/pre-registrations",
  visitorController.createPreRegistration as any
);

/**
 * @route   GET /api/visitors/pre-registrations
 * @desc    Get pre-registrations with filters
 * @access  Private
 */
// router.get('/pre-registrations', visitorController.getPreRegistrations as any);

/**
 * @route   POST /api/visitors/pre-registrations/:preRegistrationId/approve
 * @desc    Approve or reject a pre-registration
 * @access  Private
 */
// router.post('/pre-registrations/:preRegistrationId/approve', visitorController.processPreRegistrationApproval as any);

/**
 * @route   POST /api/visitors/pre-registrations/:preRegistrationId/invite
 * @desc    Send invitation to pre-registered visitor
 * @access  Private
 */
// router.post('/pre-registrations/:preRegistrationId/invite', visitorController.sendInvitation as any);

/**
 * @route   POST /api/visitors/pre-registrations/:preRegistrationId/convert
 * @desc    Convert pre-registration to visitor
 * @access  Private
 */
router.post(
  "/pre-registrations/:preRegistrationId/convert",
  visitorController.convertPreRegistrationToVisitor as any
);

/**
 * @route   GET /api/visitors/pre-registrations/pending/approvals
 * @desc    Get pending pre-registration approvals
 * @access  Private
 */
// router.get('/pre-registrations/pending/approvals', visitorController.getPendingApprovals as any);

/**
 * @route   GET /api/visitors/pre-registrations/upcoming/visits
 * @desc    Get upcoming approved visits
 * @access  Private
 */
// router.get('/pre-registrations/upcoming/visits', visitorController.getUpcomingVisits as any);

// ============================================================================
// ANALYTICS AND REPORTING
// ============================================================================

/**
 * @route   GET /api/visitors/analytics/statistics
 * @desc    Get visitor statistics
 * @access  Private
 */
router.get(
  "/analytics/statistics",
  visitorController.getVisitorStatistics as any
);

/**
 * @route   GET /api/visitors/analytics/pre-registrations
 * @desc    Get pre-registration statistics
 * @access  Private
 */
// router.get('/analytics/pre-registrations', visitorController.getPreRegistrationStatistics as any);

// ============================================================================
// ACCESS CODE MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/visitors/access-codes
 * @desc    Generate a new access code
 * @access  Private
 */
router.post(
  "/access-codes",
  accessCodeRateLimit,
  visitorController.generateAccessCode as any
);

/**
 * @route   GET /api/visitors/access-codes/:code/validate
 * @desc    Validate an access code
 * @access  Private
 * @query   location, ipAddress
 */
router.get(
  "/access-codes/:code/validate",
  visitorController.validateAccessCode as any
);

/**
 * @route   POST /api/visitors/access-codes/:code/use
 * @desc    Use an access code
 * @access  Private
 */
router.post(
  "/access-codes/:code/use",
  accessCodeRateLimit,
  visitorController.useAccessCode as any
);

// ============================================================================
// ACCESS CONTROL INTEGRATION
// ============================================================================

/**
 * @route   POST /api/visitors/access/verify
 * @desc    Verify access attempt (QR code, badge, etc.)
 * @access  Private
 */
router.post("/access/verify", visitorController.verifyAccess as any);

/**
 * @route   POST /api/visitors/access/check-in
 * @desc    Process access control check-in
 * @access  Private
 */
router.post("/access/check-in", visitorController.processAccessCheckIn as any);

/**
 * @route   POST /api/visitors/access/check-out
 * @desc    Process access control check-out
 * @access  Private
 */
router.post(
  "/access/check-out",
  visitorController.processAccessCheckOut as any
);

// ============================================================================
// ENHANCED ANALYTICS
// ============================================================================

/**
 * @route   GET /api/visitors/analytics/enhanced
 * @desc    Get enhanced visitor analytics with filtering
 * @access  Private
 * @query   startDate, endDate, period, skip, take
 */
router.get("/analytics/enhanced", visitorController.getVisitorAnalytics as any);

/**
 * @route   GET /api/visitors/analytics/trends
 * @desc    Get visitor trends over time
 * @access  Private
 * @query   startDate, endDate, period
 */
router.get("/analytics/trends", visitorController.getVisitorTrends as any);

/**
 * @route   GET /api/visitors/analytics/peak-analysis
 * @desc    Get peak visitor analysis (hours, days, seasons)
 * @access  Private
 * @query   startDate, endDate
 */
router.get(
  "/analytics/peak-analysis",
  visitorController.getPeakAnalysis as any
);

/**
 * @route   GET /api/visitors/analytics/host-performance
 * @desc    Get host performance metrics
 * @access  Private
 * @query   startDate, endDate, hostUserId
 */
router.get(
  "/analytics/host-performance",
  visitorController.getHostPerformance as any
);

/**
 * @route   GET /api/visitors/analytics/conversion-funnel
 * @desc    Get visitor conversion funnel analysis
 * @access  Private
 * @query   startDate, endDate
 */
router.get(
  "/analytics/conversion-funnel",
  visitorController.getConversionFunnel as any
);

/**
 * @route   GET /api/visitors/analytics/access-control
 * @desc    Get access control metrics
 * @access  Private
 * @query   startDate, endDate
 */
router.get(
  "/analytics/access-control",
  visitorController.getAccessControlMetrics as any
);

// ============================================================================
// NOTIFICATION MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/visitors/notifications
 * @desc    Get visitor-related notifications
 * @access  Private
 * @query   type, status, urgency, unreadOnly, skip, take
 */
router.get("/notifications", visitorController.getNotifications as any);

/**
 * @route   POST /api/visitors/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.post(
  "/notifications/:notificationId/read",
  visitorController.markNotificationAsRead as any
);

/**
 * @route   POST /api/visitors/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post(
  "/notifications/read-all",
  visitorController.markAllNotificationsAsRead as any
);

/**
 * @route   POST /api/visitors/notifications/:notificationId/acknowledge
 * @desc    Acknowledge notification (for urgent notifications)
 * @access  Private
 */
router.post(
  "/notifications/:notificationId/acknowledge",
  visitorController.acknowledgeNotification as any
);

/**
 * @route   GET /api/visitors/notifications/stats
 * @desc    Get notification statistics
 * @access  Private
 * @query   startDate, endDate
 */
router.get(
  "/notifications/stats",
  visitorController.getNotificationStats as any
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Handle 404 for visitor routes
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Visitor API endpoint not found",
    path: req.originalUrl,
  });
});

export default router;
