import { Router } from 'express';
import { getDashboardMetrics, getCoworkOverview } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { setCoworkContext } from '../middleware/coworkContext';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get dashboard metrics (context-aware)
router.get('/metrics', setCoworkContext as any, getDashboardMetrics as any);

// Get specific cowork overview (Super Admin only)
router.get('/cowork/:coworkId/overview', getCoworkOverview as any);

export default router;