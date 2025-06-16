import { Router } from 'express';
import { conversionController } from '../controllers/conversionController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Analytics and special routes (before parameterized routes)
router.get('/stats', conversionController.getConversionStats as any);
router.get('/conversion-funnel', conversionController.getConversionFunnel as any);
router.get('/qualified-leads', conversionController.getQualifiedLeads as any);
router.get('/performance/:userId', conversionController.getUserConversionPerformance as any);

// Preview conversion before executing
router.post('/preview', conversionController.previewConversion as any);

// Conversion operations
router.post('/lead-to-client', conversionController.convertLeadToClient as any);
router.post('/batch-convert', conversionController.batchConvertLeads as any);

// Basic CRUD operations
router.get('/', conversionController.getConversions as any);
router.get('/:id', conversionController.getConversionById as any);

export { router as conversionRoutes };