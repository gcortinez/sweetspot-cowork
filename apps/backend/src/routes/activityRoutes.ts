import { Router } from 'express';
import { activityController } from '../controllers/activityController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Analytics and special routes (before parameterized routes)
router.get('/stats', activityController.getActivityStats as any);
router.get('/timeline', activityController.getActivityTimeline as any);
router.get('/upcoming', activityController.getUpcomingActivities as any);
router.get('/overdue', activityController.getOverdueActivities as any);
router.get('/by-entity/:entityType/:entityId', activityController.getActivitiesByEntity as any);

// Bulk operations
router.post('/bulk', activityController.bulkAction as any);

// Basic CRUD operations
router.get('/', activityController.getActivities as any);
router.get('/:id', activityController.getActivityById as any);
router.post('/', activityController.createActivity as any);
router.put('/:id', activityController.updateActivity as any);
router.delete('/:id', activityController.deleteActivity as any);

// Activity actions
router.post('/:id/complete', activityController.completeActivity as any);

export { router as activityRoutes };