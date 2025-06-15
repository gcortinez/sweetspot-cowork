import { Router } from 'express';
import { taskController } from '../controllers/taskController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Analytics and special routes (before parameterized routes)
router.get('/stats', taskController.getTaskStats);
router.get('/reminders', taskController.getUpcomingReminders);
router.get('/my-tasks', taskController.getMyTasks);
router.get('/overdue', taskController.getOverdueTasks);
router.get('/due-today', taskController.getTasksDueToday);
router.get('/dashboard', taskController.getTaskDashboard);
router.get('/tags', taskController.getAllTags);
router.get('/by-entity/:entityType/:entityId', taskController.getTasksByEntity);
router.get('/by-tag/:tag', taskController.getTasksByTag);

// Bulk operations
router.post('/bulk-update', taskController.bulkUpdateTasks);

// Basic CRUD operations
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Task actions
router.post('/:id/complete', taskController.completeTask);

export { router as taskRoutes };