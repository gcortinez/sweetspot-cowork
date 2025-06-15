import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import * as bookingController from '../controllers/bookingManagementController';

const router = Router();

// Apply authentication and tenant validation to all routes
router.use(requireAuth);
router.use(validateTenantAccess);

// ============================================================================
// BOOKING CRUD OPERATIONS
// ============================================================================

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private
 */
router.post('/', bookingController.createBooking);

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with optional filters
 * @access  Private
 */
router.get('/', bookingController.getBookings);

/**
 * @route   GET /api/bookings/my
 * @desc    Get current user's bookings
 * @access  Private
 */
router.get('/my', bookingController.getMyBookings);

/**
 * @route   GET /api/bookings/upcoming
 * @desc    Get upcoming bookings for today
 * @access  Private
 */
router.get('/upcoming', bookingController.getUpcomingBookings);

/**
 * @route   GET /api/bookings/today
 * @desc    Get today's bookings
 * @access  Private
 */
router.get('/today', bookingController.getTodaysBookings);

/**
 * @route   GET /api/bookings/statistics
 * @desc    Get booking statistics
 * @access  Private (Cowork Admin only)
 */
router.get('/statistics', bookingController.getBookingStatistics);

/**
 * @route   GET /api/bookings/:bookingId
 * @desc    Get booking details by ID
 * @access  Private
 */
router.get('/:bookingId', bookingController.getBookingById);

/**
 * @route   PUT /api/bookings/:bookingId
 * @desc    Update booking details
 * @access  Private (Owner only)
 */
router.put('/:bookingId', bookingController.updateBooking);

/**
 * @route   DELETE /api/bookings/:bookingId
 * @desc    Cancel a booking
 * @access  Private (Owner only)
 */
router.delete('/:bookingId', bookingController.cancelBooking);

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

/**
 * @route   GET /api/bookings/approvals/pending
 * @desc    Get pending booking approvals
 * @access  Private (Cowork Admin, Client Admin)
 */
router.get('/approvals/pending', bookingController.getPendingApprovals);

/**
 * @route   POST /api/bookings/:bookingId/approve
 * @desc    Approve or reject a booking
 * @access  Private (Cowork Admin, Client Admin)
 */
router.post('/:bookingId/approve', bookingController.processBookingApproval);

// ============================================================================
// CHECK-IN/CHECK-OUT
// ============================================================================

/**
 * @route   POST /api/bookings/:bookingId/checkin
 * @desc    Check in to a room booking
 * @access  Private
 */
router.post('/:bookingId/checkin', bookingController.checkInToRoom);

/**
 * @route   POST /api/bookings/:bookingId/quick-checkin
 * @desc    Quick check-in using booking ID
 * @access  Private
 */
router.post('/:bookingId/quick-checkin', bookingController.quickCheckIn);

/**
 * @route   POST /api/bookings/checkin/qr/:qrCode
 * @desc    Check in using QR code
 * @access  Private
 */
router.post('/checkin/qr/:qrCode', bookingController.qrCheckIn);

/**
 * @route   POST /api/bookings/checkins/:checkInId/checkout
 * @desc    Check out from a room
 * @access  Private
 */
router.post('/checkins/:checkInId/checkout', bookingController.checkOutFromRoom);

export default router;