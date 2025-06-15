import { Router } from 'express';
import { pricingController } from '../controllers/pricingController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Pricing calculation and preview routes
router.post('/calculate', pricingController.calculatePrice);
router.get('/preview/:planType', pricingController.getPreviewPricing);
router.get('/plans', pricingController.getPlansWithPricing);

// Pricing tier management
router.get('/tiers', pricingController.getPricingTiers);
router.get('/tiers/:id', pricingController.getPricingTierById);
router.post('/tiers', pricingController.createPricingTier);
router.put('/tiers/:id', pricingController.updatePricingTier);
router.delete('/tiers/:id', pricingController.deletePricingTier);

// Pricing rule management
router.get('/rules', pricingController.getPricingRules);
router.get('/tiers/:tierId/rules', pricingController.getRulesByTier);
router.post('/rules', pricingController.createPricingRule);
router.post('/rules/validate', pricingController.validatePricingRule);
router.put('/rules/:id', pricingController.updatePricingRule);
router.delete('/rules/:id', pricingController.deletePricingRule);

// Bulk operations
router.post('/bulk-update', pricingController.bulkUpdatePrices);

export { router as pricingRoutes };