import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Main analytics endpoints
router.get('/overview', analyticsController.getCrmOverview as any);
router.get('/leads', analyticsController.getLeadAnalytics as any);
router.get('/sales', analyticsController.getSalesAnalytics as any);
router.get('/activities', analyticsController.getActivityAnalytics as any);
router.get('/performance', analyticsController.getUserPerformance as any);
router.get('/performance/:userId', analyticsController.getUserPerformanceById as any);

// Dashboard and summary endpoints
router.get('/dashboard', analyticsController.getAnalyticsDashboard as any);
router.get('/trends', analyticsController.getTrends as any);
router.get('/funnel', analyticsController.getConversionFunnel as any);

// Report generation
router.post('/reports', analyticsController.generateCustomReport as any);

// Export functionality
router.get('/export', analyticsController.exportAnalytics as any);

export { router as analyticsRoutes };