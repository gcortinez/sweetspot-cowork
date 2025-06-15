import { Router } from 'express';
import { quotationController } from '../controllers/quotationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Analytics and special routes (before parameterized routes)
router.get('/stats', quotationController.getQuotationStats);
router.get('/expiring', quotationController.getExpiringQuotations);
router.get('/by-client/:clientId', quotationController.getQuotationsByClient);
router.get('/by-opportunity/:opportunityId', quotationController.getQuotationsByOpportunity);

// Basic CRUD operations
router.get('/', quotationController.getQuotations);
router.get('/:id', quotationController.getQuotationById);
router.post('/', quotationController.createQuotation);
router.put('/:id', quotationController.updateQuotation);
router.delete('/:id', quotationController.deleteQuotation);

// Quotation actions
router.post('/:id/send', quotationController.sendQuotation);
router.post('/:id/accept', quotationController.acceptQuotation);
router.post('/:id/reject', quotationController.rejectQuotation);
router.post('/:id/view', quotationController.markAsViewed);
router.post('/:id/convert-to-contract', quotationController.convertToContract);
router.post('/:id/duplicate', quotationController.duplicateQuotation);

export { router as quotationRoutes };