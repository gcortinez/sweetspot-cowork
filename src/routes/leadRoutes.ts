import { Router } from 'express';
import { leadController } from '../controllers/leadController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lead management routes
router.get('/stats', leadController.getLeadStats);
router.get('/', leadController.getLeads);
router.get('/:id', leadController.getLeadById);
router.post('/', leadController.createLead);
router.put('/:id', leadController.updateLead);
router.delete('/:id', leadController.deleteLead);

// Lead action routes
router.post('/:id/assign', leadController.assignLead);
router.post('/:id/update-score', leadController.updateLeadScore);
router.post('/:id/add-note', leadController.addLeadNote);

export { router as leadRoutes };