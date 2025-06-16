import { Router } from 'express';
import { pricingController } from '../controllers/pricingController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Pricing calculation and preview routes
router.post('/calculate', pricingController.calculatePrice as any);
router.get('/preview/:planType', pricingController.getPreviewPricing as any);
router.get('/plans', pricingController.getPlansWithPricing as any);

// Pricing tier management
router.get('/tiers', pricingController.getPricingTiers as any);
router.get('/tiers/:id', pricingController.getPricingTierById as any);
router.post('/tiers', pricingController.createPricingTier as any);
router.put('/tiers/:id', pricingController.updatePricingTier as any);
router.delete('/tiers/:id', pricingController.deletePricingTier as any);

// Pricing rule management
router.get('/rules', pricingController.getPricingRules as any);
router.get('/tiers/:tierId/rules', pricingController.getRulesByTier as any);
router.post('/rules', pricingController.createPricingRule as any);
router.post('/rules/validate', pricingController.validatePricingRule as any);
router.put('/rules/:id', pricingController.updatePricingRule as any);
router.delete('/rules/:id', pricingController.deletePricingRule as any);

// Bulk operations
router.post('/bulk-update', pricingController.bulkUpdatePrices as any);

export { router as pricingRoutes };