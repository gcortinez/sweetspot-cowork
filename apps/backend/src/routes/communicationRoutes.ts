import { Router } from 'express';
import { communicationController } from '../controllers/communicationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Analytics and special routes (before parameterized routes)
router.get('/stats', communicationController.getCommunicationStats as any);
router.get('/thread', communicationController.getCommunicationThread as any);
router.get('/unread', communicationController.getUnreadCommunications as any);
router.get('/export', communicationController.exportCommunications as any);
router.get('/by-entity/:entityType/:entityId', communicationController.getCommunicationsByEntity as any);

// Bulk operations
router.post('/bulk-delete', communicationController.bulkDelete as any);

// Basic CRUD operations
router.get('/', communicationController.getCommunications as any);
router.get('/:id', communicationController.getCommunicationById as any);
router.post('/', communicationController.createCommunication as any);
router.put('/:id', communicationController.updateCommunication as any);
router.delete('/:id', communicationController.deleteCommunication as any);

// Communication actions
router.post('/:id/mark-read', communicationController.markAsRead as any);

export { router as communicationRoutes };