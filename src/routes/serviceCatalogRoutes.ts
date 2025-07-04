import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import * as serviceCatalogController from '../controllers/serviceCatalogController';

const router = Router();

// Apply authentication and tenant validation to all routes
router.use(requireAuth);
router.use(validateTenantAccess);

// ============================================================================
// SERVICE CATALOG MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/services
 * @desc    Create a new service in the catalog
 * @access  Private (Cowork Admin only)
 */
router.post('/', serviceCatalogController.createService);

/**
 * @route   PUT /api/services/:serviceId
 * @desc    Update a service in the catalog
 * @access  Private (Cowork Admin only)
 */
router.put('/:serviceId', serviceCatalogController.updateService);

/**
 * @route   DELETE /api/services/:serviceId
 * @desc    Delete a service from the catalog
 * @access  Private (Cowork Admin only)
 */
router.delete('/:serviceId', serviceCatalogController.deleteService);

/**
 * @route   GET /api/services/:serviceId
 * @desc    Get service details by ID
 * @access  Private
 */
router.get('/:serviceId', serviceCatalogController.getService);

/**
 * @route   GET /api/services
 * @desc    Get service catalog with optional filters
 * @access  Private
 * @query   category, serviceType, availability, minPrice, maxPrice, isActive, requiresApproval, tags, search, skip, take
 */
router.get('/', serviceCatalogController.getServiceCatalog);

/**
 * @route   GET /api/services/category/:category
 * @desc    Get services by category
 * @access  Private
 */
router.get('/category/:category', serviceCatalogController.getServicesByCategory);

/**
 * @route   GET /api/services/featured
 * @desc    Get featured services
 * @access  Private
 */
router.get('/featured', serviceCatalogController.getFeaturedServices);

/**
 * @route   GET /api/services/search
 * @desc    Search services
 * @access  Private
 * @query   q (search term), category, serviceType, minPrice, maxPrice
 */
router.get('/search', serviceCatalogController.searchServices);

// ============================================================================
// PRICING
// ============================================================================

/**
 * @route   POST /api/services/calculate-price
 * @desc    Calculate dynamic price for a service request
 * @access  Private
 */
router.post('/calculate-price', serviceCatalogController.calculatePrice);

// ============================================================================
// ANALYTICS AND REPORTING
// ============================================================================

/**
 * @route   GET /api/services/analytics/overview
 * @desc    Get service analytics overview
 * @access  Private (Cowork Admin only)
 */
router.get('/analytics/overview', serviceCatalogController.getServiceAnalytics);

/**
 * @route   GET /api/services/analytics/dashboard
 * @desc    Get dashboard data for services
 * @access  Private (Cowork Admin only)
 */
router.get('/analytics/dashboard', serviceCatalogController.getDashboardData);

/**
 * @route   GET /api/services/analytics/recommendations
 * @desc    Get service optimization recommendations
 * @access  Private (Cowork Admin only)
 */
router.get('/analytics/recommendations', serviceCatalogController.getRecommendations);

export default router;