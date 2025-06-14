import { Router } from 'express';
import { communicationController } from '../controllers/communicationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Analytics and special routes (before parameterized routes)
router.get('/stats', communicationController.getCommunicationStats);
router.get('/thread', communicationController.getCommunicationThread);
router.get('/unread', communicationController.getUnreadCommunications);
router.get('/export', communicationController.exportCommunications);
router.get('/by-entity/:entityType/:entityId', communicationController.getCommunicationsByEntity);

// Bulk operations
router.post('/bulk-delete', communicationController.bulkDelete);

// Basic CRUD operations
router.get('/', communicationController.getCommunications);
router.get('/:id', communicationController.getCommunicationById);
router.post('/', communicationController.createCommunication);
router.put('/:id', communicationController.updateCommunication);
router.delete('/:id', communicationController.deleteCommunication);

// Communication actions
router.post('/:id/mark-read', communicationController.markAsRead);

export { router as communicationRoutes };