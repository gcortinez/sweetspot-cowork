import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Main analytics endpoints
router.get('/overview', analyticsController.getCrmOverview);
router.get('/leads', analyticsController.getLeadAnalytics);
router.get('/sales', analyticsController.getSalesAnalytics);
router.get('/activities', analyticsController.getActivityAnalytics);
router.get('/performance', analyticsController.getUserPerformance);
router.get('/performance/:userId', analyticsController.getUserPerformanceById);

// Dashboard and summary endpoints
router.get('/dashboard', analyticsController.getAnalyticsDashboard);
router.get('/trends', analyticsController.getTrends);
router.get('/funnel', analyticsController.getConversionFunnel);

// Report generation
router.post('/reports', analyticsController.generateCustomReport);

// Export functionality
router.get('/export', analyticsController.exportAnalytics);

export { router as analyticsRoutes };