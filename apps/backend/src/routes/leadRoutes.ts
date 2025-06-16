import { Router } from 'express';
import { leadController } from '../controllers/leadController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lead management routes
router.get('/stats', leadController.getLeadStats as any);
router.get('/', leadController.getLeads as any);
router.get('/:id', leadController.getLeadById as any);
router.post('/', leadController.createLead as any);
router.put('/:id', leadController.updateLead as any);
router.delete('/:id', leadController.deleteLead as any);

// Lead action routes
router.post('/:id/assign', leadController.assignLead as any);
router.post('/:id/update-score', leadController.updateLeadScore as any);
router.post('/:id/add-note', leadController.addLeadNote as any);

export { router as leadRoutes };