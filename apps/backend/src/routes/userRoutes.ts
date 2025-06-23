import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// User management routes
router.get('/', userController.getUsers as any);
router.get('/:id', userController.getUserById as any);

export { router as userRoutes };