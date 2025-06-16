import { Router } from 'express';
import { taskController } from '../controllers/taskController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Analytics and special routes (before parameterized routes)
router.get('/stats', taskController.getTaskStats as any);
router.get('/reminders', taskController.getUpcomingReminders as any);
router.get('/my-tasks', taskController.getMyTasks as any);
router.get('/overdue', taskController.getOverdueTasks as any);
router.get('/due-today', taskController.getTasksDueToday as any);
router.get('/dashboard', taskController.getTaskDashboard as any);
router.get('/tags', taskController.getAllTags as any);
router.get('/by-entity/:entityType/:entityId', taskController.getTasksByEntity as any);
router.get('/by-tag/:tag', taskController.getTasksByTag as any);

// Bulk operations
router.post('/bulk-update', taskController.bulkUpdateTasks as any);

// Basic CRUD operations
router.get('/', taskController.getTasks as any);
router.get('/:id', taskController.getTaskById as any);
router.post('/', taskController.createTask as any);
router.put('/:id', taskController.updateTask as any);
router.delete('/:id', taskController.deleteTask as any);

// Task actions
router.post('/:id/complete', taskController.completeTask as any);

export { router as taskRoutes };