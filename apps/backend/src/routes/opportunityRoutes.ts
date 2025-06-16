import { Router } from 'express';
import { opportunityController } from '../controllers/opportunityController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Pipeline analytics routes (before parameterized routes)
router.get('/pipeline/stats', opportunityController.getPipelineStats as any);
router.get('/pipeline/funnel', opportunityController.getPipelineFunnel as any);

// Opportunity management routes
router.get('/', opportunityController.getOpportunities as any);
router.get('/:id', opportunityController.getOpportunityById as any);
router.post('/', opportunityController.createOpportunity as any);
router.put('/:id', opportunityController.updateOpportunity as any);
router.delete('/:id', opportunityController.deleteOpportunity as any);

// Opportunity action routes
router.post('/:id/stage', opportunityController.updateStage as any);
router.post('/:id/assign', opportunityController.assignOpportunity as any);

// Lead conversion routes
router.post('/from-lead/:leadId', opportunityController.createFromLead as any);

export { router as opportunityRoutes };