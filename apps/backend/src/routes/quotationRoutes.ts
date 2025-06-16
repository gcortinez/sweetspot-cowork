import { Router } from 'express';
import { quotationController } from '../controllers/quotationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Analytics and special routes (before parameterized routes)
router.get('/stats', quotationController.getQuotationStats as any);
router.get('/expiring', quotationController.getExpiringQuotations as any);
router.get('/by-client/:clientId', quotationController.getQuotationsByClient as any);
router.get('/by-opportunity/:opportunityId', quotationController.getQuotationsByOpportunity as any);

// Basic CRUD operations
router.get('/', quotationController.getQuotations as any);
router.get('/:id', quotationController.getQuotationById as any);
router.post('/', quotationController.createQuotation as any);
router.put('/:id', quotationController.updateQuotation as any);
router.delete('/:id', quotationController.deleteQuotation as any);

// Quotation actions
router.post('/:id/send', quotationController.sendQuotation as any);
router.post('/:id/accept', quotationController.acceptQuotation as any);
router.post('/:id/reject', quotationController.rejectQuotation as any);
router.post('/:id/view', quotationController.markAsViewed as any);
router.post('/:id/convert-to-contract', quotationController.convertToContract as any);
router.post('/:id/duplicate', quotationController.duplicateQuotation as any);

export { router as quotationRoutes };