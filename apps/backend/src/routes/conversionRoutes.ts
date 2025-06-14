import { Router } from 'express';
import { conversionController } from '../controllers/conversionController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Analytics and special routes (before parameterized routes)
router.get('/stats', conversionController.getConversionStats);
router.get('/conversion-funnel', conversionController.getConversionFunnel);
router.get('/qualified-leads', conversionController.getQualifiedLeads);
router.get('/performance/:userId', conversionController.getUserConversionPerformance);

// Preview conversion before executing
router.post('/preview', conversionController.previewConversion);

// Conversion operations
router.post('/lead-to-client', conversionController.convertLeadToClient);
router.post('/batch-convert', conversionController.batchConvertLeads);

// Basic CRUD operations
router.get('/', conversionController.getConversions);
router.get('/:id', conversionController.getConversionById);

export { router as conversionRoutes };