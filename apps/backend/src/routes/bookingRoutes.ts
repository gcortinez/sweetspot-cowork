import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  getMyBookings,
  getMyUpcomingBookings,
  getBookingStatistics,
  getTodaysBookings,
  getBookingCalendar
} from '../controllers/bookingController';
import { generalRateLimit, adminRateLimit } from '../middleware/rateLimiting';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// ============================================================================
// BOOKING MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private (all authenticated users)
 */
router.post('/', generalRateLimit, createBooking);

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with filtering (admin only)
 * @access  Admin (COWORK_ADMIN or SUPER_ADMIN)
 * @query   userId?, spaceId?, status?, startDate?, endDate?, upcoming?, page?, limit?
 */
router.get('/', requireRole('COWORK_ADMIN'), getBookings);

/**
 * @route   GET /api/bookings/:bookingId
 * @desc    Get booking details by ID
 * @access  Private (own bookings) or Admin
 */
router.get('/:bookingId', generalRateLimit, getBookingById);

/**
 * @route   PUT /api/bookings/:bookingId
 * @desc    Update booking information
 * @access  Private (own bookings) or Admin
 */
router.put('/:bookingId', generalRateLimit, updateBooking);

/**
 * @route   DELETE /api/bookings/:bookingId/cancel
 * @desc    Cancel a booking
 * @access  Private (own bookings) or Admin
 */
router.delete('/:bookingId/cancel', generalRateLimit, cancelBooking);

// ============================================================================
// USER-SPECIFIC BOOKING ROUTES
// ============================================================================

/**
 * @route   GET /api/bookings/my/all
 * @desc    Get current user's bookings
 * @access  Private (all authenticated users)
 * @query   spaceId?, status?, startDate?, endDate?, upcoming?, page?, limit?
 */
router.get('/my/all', generalRateLimit, getMyBookings);

/**
 * @route   GET /api/bookings/my/upcoming
 * @desc    Get current user's upcoming bookings
 * @access  Private (all authenticated users)
 * @query   limit?
 */
router.get('/my/upcoming', generalRateLimit, getMyUpcomingBookings);

// ============================================================================
// BOOKING ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/bookings/analytics/statistics
 * @desc    Get booking statistics
 * @access  Admin (COWORK_ADMIN or SUPER_ADMIN)
 * @query   startDate?, endDate?
 */
router.get('/analytics/statistics', requireRole('COWORK_ADMIN'), getBookingStatistics);

/**
 * @route   GET /api/bookings/analytics/today
 * @desc    Get today's bookings overview
 * @access  Admin (COWORK_ADMIN or SUPER_ADMIN)
 */
router.get('/analytics/today', requireRole('COWORK_ADMIN'), getTodaysBookings);

/**
 * @route   GET /api/bookings/calendar
 * @desc    Get booking calendar data
 * @access  Private (all authenticated users)
 * @query   month?, year?, spaceId?
 */
router.get('/calendar', generalRateLimit, getBookingCalendar);

export default router;