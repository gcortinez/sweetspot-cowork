import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import * as serviceCatalogController from '../controllers/serviceCatalogController';

const router = Router();

// Apply authentication and tenant validation to all routes
router.use(authenticate);
router.use(tenantMiddleware);

// ============================================================================
// SERVICE REQUEST MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/service-requests
 * @desc    Create a new service request
 * @access  Private
 */
router.post('/', serviceCatalogController.createServiceRequest as any);

/**
 * @route   PUT /api/service-requests/:requestId
 * @desc    Update a service request
 * @access  Private (Owner only)
 */
router.put('/:requestId', serviceCatalogController.updateServiceRequest as any);

/**
 * @route   POST /api/service-requests/:requestId/cancel
 * @desc    Cancel a service request
 * @access  Private (Owner only)
 */
router.post('/:requestId/cancel', serviceCatalogController.cancelServiceRequest as any);

/**
 * @route   GET /api/service-requests/:requestId
 * @desc    Get service request details by ID
 * @access  Private
 */
router.get('/:requestId', serviceCatalogController.getServiceRequest as any);

/**
 * @route   GET /api/service-requests
 * @desc    Get service requests with optional filters
 * @access  Private
 * @query   status, priority, serviceId, userId, assignedTo, search, skip, take
 */
router.get('/', serviceCatalogController.getServiceRequests as any);

/**
 * @route   GET /api/service-requests/my/requests
 * @desc    Get current user's service requests
 * @access  Private
 */
router.get('/my/requests', serviceCatalogController.getMyServiceRequests as any);

/**
 * @route   GET /api/service-requests/my/assigned
 * @desc    Get service requests assigned to current user
 * @access  Private
 */
router.get('/my/assigned', serviceCatalogController.getAssignedRequests as any);

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

/**
 * @route   GET /api/service-requests/approvals/pending
 * @desc    Get pending service request approvals
 * @access  Private (Cowork Admin, Client Admin)
 */
router.get('/approvals/pending', serviceCatalogController.getPendingApprovals as any);

/**
 * @route   POST /api/service-requests/:requestId/approve
 * @desc    Approve or reject a service request
 * @access  Private (Cowork Admin, Client Admin)
 */
router.post('/:requestId/approve', serviceCatalogController.processApproval as any);

// ============================================================================
// ASSIGNMENT AND PROGRESS TRACKING
// ============================================================================

/**
 * @route   POST /api/service-requests/:requestId/assign
 * @desc    Assign a service request to a provider/staff member
 * @access  Private (Cowork Admin, Service Manager)
 */
router.post('/:requestId/assign', serviceCatalogController.assignServiceRequest as any);

/**
 * @route   PUT /api/service-requests/:requestId/progress
 * @desc    Update progress on a service request
 * @access  Private (Assigned user only)
 */
router.put('/:requestId/progress', serviceCatalogController.updateProgress as any);

/**
 * @route   POST /api/service-requests/:requestId/complete
 * @desc    Mark a service request as completed
 * @access  Private (Assigned user only)
 */
router.post('/:requestId/complete', serviceCatalogController.completeServiceRequest as any);

export default router;