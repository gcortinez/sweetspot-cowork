import express from 'express';
import { contractRenewalController } from '../controllers/contractRenewalController';
import { authenticate, requireRole } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/renewals/rules
 * @desc Get renewal rules
 * @access Private (Admin, Manager)
 */
router.get('/rules', 
  requireRole('COWORK_ADMIN'),
  contractRenewalController.getRenewalRules.bind(contractRenewalController) as any as any
);

/**
 * @route POST /api/renewals/rules
 * @desc Create a new renewal rule
 * @access Private (Admin, Manager)
 * @body {CreateRenewalRuleData} Rule data
 */
router.post('/rules',
  requireRole('COWORK_ADMIN'),
  contractRenewalController.createRenewalRule.bind(contractRenewalController) as any
);

/**
 * @route PUT /api/renewals/rules/:id
 * @desc Update renewal rule
 * @access Private (Admin, Manager)
 * @param {string} id - Rule ID
 * @body {UpdateRenewalRuleData} Updated rule data
 */
router.put('/rules/:id',
  requireRole('COWORK_ADMIN'),
  contractRenewalController.updateRenewalRule.bind(contractRenewalController) as any
);

/**
 * @route DELETE /api/renewals/rules/:id
 * @desc Delete renewal rule
 * @access Private (Admin)
 * @param {string} id - Rule ID
 */
router.delete('/rules/:id',
  requireRole('COWORK_ADMIN'),
  contractRenewalController.deleteRenewalRule.bind(contractRenewalController) as any
);

/**
 * @route PATCH /api/renewals/rules/:id/toggle
 * @desc Toggle renewal rule active status
 * @access Private (Admin, Manager)
 * @param {string} id - Rule ID
 * @body {object} { isActive: boolean }
 */
router.patch('/rules/:id/toggle',
  requireRole('COWORK_ADMIN'),
  contractRenewalController.toggleRuleStatus.bind(contractRenewalController) as any
);

/**
 * @route GET /api/renewals/proposals
 * @desc Get renewal proposals with pagination and filtering
 * @access Private (Admin, Manager, Employee)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @query {string} status - Filter by renewal status
 * @query {string} contractId - Filter by contract ID
 * @query {string} ruleId - Filter by rule ID
 * @query {string} dateFrom - Filter from date (ISO string)
 * @query {string} dateTo - Filter to date (ISO string)
 * @query {string} sortBy - Sort field (default: createdAt)
 * @query {string} sortOrder - Sort order: asc or desc (default: desc)
 */
router.get('/proposals', 
  requireRole('CLIENT_ADMIN'),
  contractRenewalController.getRenewalProposals.bind(contractRenewalController) as any
);

/**
 * @route POST /api/renewals/proposals/contract/:contractId
 * @desc Create a renewal proposal for a specific contract
 * @access Private (Admin, Manager)
 * @param {string} contractId - Contract ID
 * @body {object} { ruleId?: string }
 */
router.post('/proposals/contract/:contractId',
  requireRole('COWORK_ADMIN'),
  contractRenewalController.createRenewalProposal.bind(contractRenewalController) as any
);

/**
 * @route POST /api/renewals/proposals/:id/process
 * @desc Process a renewal proposal (approve or decline)
 * @access Private (Admin, Manager)
 * @param {string} id - Proposal ID
 * @body {ProcessRenewalData} Processing data
 */
router.post('/proposals/:id/process',
  requireRole('COWORK_ADMIN'),
  contractRenewalController.processRenewalProposal.bind(contractRenewalController) as any
);

/**
 * @route POST /api/renewals/check
 * @desc Run renewal check to create proposals for eligible contracts
 * @access Private (Admin)
 */
router.post('/check',
  requireRole('COWORK_ADMIN'),
  contractRenewalController.checkAndCreateRenewals.bind(contractRenewalController) as any
);

/**
 * @route GET /api/renewals/stats
 * @desc Get renewal statistics and metrics
 * @access Private (Admin, Manager)
 */
router.get('/stats',
  requireRole('COWORK_ADMIN'),
  contractRenewalController.getRenewalStats.bind(contractRenewalController) as any
);

export { router as contractRenewalRoutes };