import { Router } from 'express';
import { activityController } from '../controllers/activityController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Analytics and special routes (before parameterized routes)
router.get('/stats', activityController.getActivityStats);
router.get('/timeline', activityController.getActivityTimeline);
router.get('/upcoming', activityController.getUpcomingActivities);
router.get('/overdue', activityController.getOverdueActivities);
router.get('/by-entity/:entityType/:entityId', activityController.getActivitiesByEntity);

// Bulk operations
router.post('/bulk', activityController.bulkAction);

// Basic CRUD operations
router.get('/', activityController.getActivities);
router.get('/:id', activityController.getActivityById);
router.post('/', activityController.createActivity);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);

// Activity actions
router.post('/:id/complete', activityController.completeActivity);

export { router as activityRoutes };