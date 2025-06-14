import { Router } from 'express';
import { opportunityController } from '../controllers/opportunityController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Pipeline analytics routes (before parameterized routes)
router.get('/pipeline/stats', opportunityController.getPipelineStats);
router.get('/pipeline/funnel', opportunityController.getPipelineFunnel);

// Opportunity management routes
router.get('/', opportunityController.getOpportunities);
router.get('/:id', opportunityController.getOpportunityById);
router.post('/', opportunityController.createOpportunity);
router.put('/:id', opportunityController.updateOpportunity);
router.delete('/:id', opportunityController.deleteOpportunity);

// Opportunity action routes
router.post('/:id/stage', opportunityController.updateStage);
router.post('/:id/assign', opportunityController.assignOpportunity);

// Lead conversion routes
router.post('/from-lead/:leadId', opportunityController.createFromLead);

export { router as opportunityRoutes };