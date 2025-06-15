import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  createSpace,
  getSpaces,
  getSpaceById,
  updateSpace,
  deleteSpace,
  checkSpaceAvailability,
  findAvailableSpaces,
  calculateSpacePricing,
  getPricingEstimates,
  getSpaceUtilization,
  getSpaceTypeSummary
} from '../controllers/spaceController';
import { generalRateLimit, adminRateLimit } from '../middleware/rateLimiting';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// ============================================================================
// SPACE MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   POST /api/spaces
 * @desc    Create a new space/meeting room
 * @access  Admin (COWORK_ADMIN or SUPER_ADMIN)
 */
router.post('/', requireRole('COWORK_ADMIN'), adminRateLimit, createSpace);

/**
 * @route   GET /api/spaces
 * @desc    Get all spaces with filtering options
 * @access  Private (all authenticated users)
 */
router.get('/', generalRateLimit, getSpaces);

/**
 * @route   GET /api/spaces/summary
 * @desc    Get space type summary and statistics
 * @access  Private (all authenticated users)
 */
router.get('/summary', generalRateLimit, getSpaceTypeSummary);

/**
 * @route   GET /api/spaces/:spaceId
 * @desc    Get space details by ID
 * @access  Private (all authenticated users)
 */
router.get('/:spaceId', generalRateLimit, getSpaceById);

/**
 * @route   PUT /api/spaces/:spaceId
 * @desc    Update space information
 * @access  Admin (COWORK_ADMIN or SUPER_ADMIN)
 */
router.put('/:spaceId', requireRole('COWORK_ADMIN'), adminRateLimit, updateSpace);

/**
 * @route   DELETE /api/spaces/:spaceId
 * @desc    Delete/deactivate a space
 * @access  Admin (COWORK_ADMIN or SUPER_ADMIN)
 */
router.delete('/:spaceId', requireRole('COWORK_ADMIN'), adminRateLimit, deleteSpace);

// ============================================================================
// SPACE AVAILABILITY ROUTES
// ============================================================================

/**
 * @route   GET /api/spaces/available/search
 * @desc    Find available spaces for a time period
 * @access  Private (all authenticated users)
 * @query   startTime, endTime, capacity?, type?, amenities?
 */
router.get('/available/search', generalRateLimit, findAvailableSpaces);

/**
 * @route   GET /api/spaces/:spaceId/availability
 * @desc    Check availability for a specific space
 * @access  Private (all authenticated users)
 * @query   startTime, endTime
 */
router.get('/:spaceId/availability', generalRateLimit, checkSpaceAvailability);

// ============================================================================
// SPACE PRICING ROUTES
// ============================================================================

/**
 * @route   POST /api/spaces/:spaceId/pricing/calculate
 * @desc    Calculate pricing for a booking
 * @access  Private (all authenticated users)
 * @body    startTime, endTime, attendeeCount?, requiredAmenities?
 */
router.post('/:spaceId/pricing/calculate', generalRateLimit, calculateSpacePricing);

/**
 * @route   GET /api/spaces/:spaceId/pricing/estimates
 * @desc    Get pricing estimates for different time slots
 * @access  Private (all authenticated users)
 * @query   date, duration?
 */
router.get('/:spaceId/pricing/estimates', generalRateLimit, getPricingEstimates);

// ============================================================================
// SPACE ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/spaces/:spaceId/utilization
 * @desc    Get space utilization statistics
 * @access  Admin (COWORK_ADMIN or SUPER_ADMIN)
 * @query   startDate?, endDate?
 */
router.get('/:spaceId/utilization', requireRole('COWORK_ADMIN'), getSpaceUtilization);

export default router;