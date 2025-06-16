import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import * as roomController from '../controllers/roomManagementController';

const router = Router();

// Apply authentication and tenant validation to all routes
router.use(authenticate);
router.use(tenantMiddleware);

// ============================================================================
// ROOM INVENTORY MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/rooms
 * @desc    Create a new room
 * @access  Private (Cowork Admin only)
 */
router.post('/', roomController.createRoom as any);

/**
 * @route   GET /api/rooms
 * @desc    Get all rooms with optional filters
 * @access  Private
 */
router.get('/', roomController.getRooms as any);

/**
 * @route   GET /api/rooms/:roomId
 * @desc    Get room details by ID
 * @access  Private
 */
router.get('/:roomId', roomController.getRoomById as any);

/**
 * @route   PUT /api/rooms/:roomId
 * @desc    Update room details
 * @access  Private (Cowork Admin only)
 */
router.put('/:roomId', roomController.updateRoom as any);

/**
 * @route   DELETE /api/rooms/:roomId
 * @desc    Delete/deactivate a room
 * @access  Private (Cowork Admin only)
 */
router.delete('/:roomId', roomController.deleteRoom as any);

// ============================================================================
// ROOM FEATURES MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/rooms/features
 * @desc    Create a new room feature
 * @access  Private (Cowork Admin only)
 */
router.post('/features', roomController.createRoomFeature as any);

/**
 * @route   GET /api/rooms/features
 * @desc    Get all room features
 * @access  Private
 */
router.get('/features', roomController.getRoomFeatures as any);

// ============================================================================
// AVAILABILITY MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/rooms/availability/check
 * @desc    Check if a room is available for a specific time slot
 * @access  Private
 */
router.post('/availability/check', roomController.checkAvailability as any);

/**
 * @route   GET /api/rooms/:roomId/availability
 * @desc    Get available time slots for a room on a specific date
 * @access  Private
 */
router.get('/:roomId/availability', roomController.getAvailableSlots as any);

// ============================================================================
// DYNAMIC PRICING
// ============================================================================

/**
 * @route   POST /api/rooms/pricing/calculate
 * @desc    Calculate price for a room booking
 * @access  Private
 */
router.post('/pricing/calculate', roomController.calculatePrice as any);

/**
 * @route   POST /api/rooms/pricing/rules
 * @desc    Create a new pricing rule
 * @access  Private (Cowork Admin only)
 */
router.post('/pricing/rules', roomController.createPricingRule as any);

/**
 * @route   GET /api/rooms/pricing/rules
 * @desc    Get all pricing rules
 * @access  Private (Cowork Admin only)
 */
router.get('/pricing/rules', roomController.getPricingRules as any);

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * @route   GET /api/rooms/analytics
 * @desc    Get room usage analytics
 * @access  Private (Cowork Admin only)
 */
router.get('/analytics', roomController.getRoomAnalytics as any);

export default router;