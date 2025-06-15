import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import * as visitorController from '../controllers/visitorController';

const router = Router();

// Apply authentication and tenant validation to all routes
router.use(requireAuth);
router.use(validateTenantAccess);

// ============================================================================
// VISITOR MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/visitors
 * @desc    Create a new visitor
 * @access  Private
 */
router.post('/', visitorController.createVisitor);

/**
 * @route   PUT /api/visitors/:visitorId
 * @desc    Update visitor details
 * @access  Private
 */
router.put('/:visitorId', visitorController.updateVisitor);

/**
 * @route   DELETE /api/visitors/:visitorId
 * @desc    Cancel/delete a visitor
 * @access  Private
 */
router.delete('/:visitorId', visitorController.deleteVisitor);

/**
 * @route   GET /api/visitors/:visitorId
 * @desc    Get visitor details by ID
 * @access  Private
 */
router.get('/:visitorId', visitorController.getVisitor);

/**
 * @route   GET /api/visitors
 * @desc    Get visitors with optional filters
 * @access  Private
 * @query   status, hostUserId, purpose, fromDate, toDate, search, includeExpired, skip, take
 */
router.get('/', visitorController.getVisitors);

/**
 * @route   GET /api/visitors/today/list
 * @desc    Get today's visitors
 * @access  Private
 */
router.get('/today/list', visitorController.getTodaysVisitors);

/**
 * @route   GET /api/visitors/active/list
 * @desc    Get currently checked-in visitors
 * @access  Private
 */
router.get('/active/list', visitorController.getActiveVisitors);

/**
 * @route   GET /api/visitors/qr/:qrCode
 * @desc    Get visitor by QR code
 * @access  Private
 */
router.get('/qr/:qrCode', visitorController.getVisitorByQRCode);

/**
 * @route   GET /api/visitors/:visitorId/history
 * @desc    Get visitor activity history
 * @access  Private
 */
router.get('/:visitorId/history', visitorController.getVisitorHistory);

// ============================================================================
// CHECK-IN/CHECK-OUT
// ============================================================================

/**
 * @route   POST /api/visitors/checkin
 * @desc    Check in a visitor
 * @access  Private
 */
router.post('/checkin', visitorController.checkInVisitor);

/**
 * @route   POST /api/visitors/checkout
 * @desc    Check out a visitor
 * @access  Private
 */
router.post('/checkout', visitorController.checkOutVisitor);

/**
 * @route   PUT /api/visitors/:visitorId/extend
 * @desc    Extend visitor stay
 * @access  Private
 */
router.put('/:visitorId/extend', visitorController.extendVisitorStay);

// ============================================================================
// PRE-REGISTRATION
// ============================================================================

/**
 * @route   POST /api/visitors/pre-registrations
 * @desc    Create a new pre-registration
 * @access  Private
 */
router.post('/pre-registrations', visitorController.createPreRegistration);

/**
 * @route   GET /api/visitors/pre-registrations
 * @desc    Get pre-registrations with filters
 * @access  Private
 */
router.get('/pre-registrations', visitorController.getPreRegistrations);

/**
 * @route   POST /api/visitors/pre-registrations/:preRegistrationId/approve
 * @desc    Approve or reject a pre-registration
 * @access  Private
 */
router.post('/pre-registrations/:preRegistrationId/approve', visitorController.processPreRegistrationApproval);

/**
 * @route   POST /api/visitors/pre-registrations/:preRegistrationId/invite
 * @desc    Send invitation to pre-registered visitor
 * @access  Private
 */
router.post('/pre-registrations/:preRegistrationId/invite', visitorController.sendInvitation);

/**
 * @route   POST /api/visitors/pre-registrations/:preRegistrationId/convert
 * @desc    Convert pre-registration to visitor
 * @access  Private
 */
router.post('/pre-registrations/:preRegistrationId/convert', visitorController.convertPreRegistrationToVisitor);

/**
 * @route   GET /api/visitors/pre-registrations/pending/approvals
 * @desc    Get pending pre-registration approvals
 * @access  Private
 */
router.get('/pre-registrations/pending/approvals', visitorController.getPendingApprovals);

/**
 * @route   GET /api/visitors/pre-registrations/upcoming/visits
 * @desc    Get upcoming approved visits
 * @access  Private
 */
router.get('/pre-registrations/upcoming/visits', visitorController.getUpcomingVisits);

// ============================================================================
// ANALYTICS AND REPORTING
// ============================================================================

/**
 * @route   GET /api/visitors/analytics/statistics
 * @desc    Get visitor statistics
 * @access  Private
 */
router.get('/analytics/statistics', visitorController.getVisitorStatistics);

/**
 * @route   GET /api/visitors/analytics/pre-registrations
 * @desc    Get pre-registration statistics
 * @access  Private
 */
router.get('/analytics/pre-registrations', visitorController.getPreRegistrationStatistics);

export default router;