import express from 'express';
import { digitalSignatureController } from '../controllers/digitalSignatureController';
import { authenticate, requireRole } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/signatures
 * @desc Get signature workflows with pagination and filtering
 * @access Private (Admin, Manager, Employee)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @query {string} status - Filter by workflow status
 * @query {string} contractId - Filter by contract ID
 * @query {string} signerId - Filter by signer ID
 * @query {string} dateFrom - Filter from date (ISO string)
 * @query {string} dateTo - Filter to date (ISO string)
 * @query {string} sortBy - Sort field (default: createdAt)
 * @query {string} sortOrder - Sort order: asc or desc (default: desc)
 */
router.get('/', 
  requireRole('CLIENT_ADMIN'),
  digitalSignatureController.getWorkflows.bind(digitalSignatureController) as any
);

/**
 * @route POST /api/signatures
 * @desc Create a new signature workflow
 * @access Private (Admin, Manager)
 * @body {CreateSignatureWorkflowData} Workflow data
 */
router.post('/',
  requireRole('COWORK_ADMIN'),
  digitalSignatureController.createWorkflow.bind(digitalSignatureController) as any
);

/**
 * @route GET /api/signatures/:id
 * @desc Get signature workflow by ID
 * @access Private (Admin, Manager, Employee)
 * @param {string} id - Workflow ID
 */
router.get('/:id',
  requireRole('CLIENT_ADMIN'),
  digitalSignatureController.getWorkflowById.bind(digitalSignatureController) as any
);

/**
 * @route PUT /api/signatures/:id
 * @desc Update signature workflow
 * @access Private (Admin, Manager)
 * @param {string} id - Workflow ID
 * @body {UpdateSignatureWorkflowData} Updated workflow data
 */
router.put('/:id',
  requireRole('COWORK_ADMIN'),
  digitalSignatureController.updateWorkflow.bind(digitalSignatureController) as any
);

/**
 * @route POST /api/signatures/:id/cancel
 * @desc Cancel signature workflow
 * @access Private (Admin, Manager)
 * @param {string} id - Workflow ID
 * @body {object} { reason?: string }
 */
router.post('/:id/cancel',
  requireRole('COWORK_ADMIN'),
  digitalSignatureController.cancelWorkflow.bind(digitalSignatureController) as any
);

/**
 * @route GET /api/signatures/:id/audit
 * @desc Get signature workflow audit trail
 * @access Private (Admin, Manager)
 * @param {string} id - Workflow ID
 */
router.get('/:id/audit',
  requireRole('COWORK_ADMIN'),
  digitalSignatureController.getAuditTrail.bind(digitalSignatureController) as any
);

/**
 * @route GET /api/signatures/:workflowId/signer/:signerId
 * @desc Get signer-specific view of the workflow
 * @access Public (with valid signer token)
 * @param {string} workflowId - Workflow ID
 * @param {string} signerId - Signer ID
 */
router.get('/:workflowId/signer/:signerId',
  // Note: This endpoint might need special authentication for external signers
  digitalSignatureController.getSignerView.bind(digitalSignatureController) as any
);

/**
 * @route POST /api/signatures/:workflowId/signer/:signerId/sign
 * @desc Sign a document
 * @access Public (with valid signer token)
 * @param {string} workflowId - Workflow ID
 * @param {string} signerId - Signer ID
 * @body {SignDocumentData} Signature data
 */
router.post('/:workflowId/signer/:signerId/sign',
  // Note: This endpoint might need special authentication for external signers
  digitalSignatureController.signDocument.bind(digitalSignatureController) as any
);

/**
 * @route POST /api/signatures/:workflowId/signer/:signerId/decline
 * @desc Decline to sign a document
 * @access Public (with valid signer token)
 * @param {string} workflowId - Workflow ID
 * @param {string} signerId - Signer ID
 * @body {object} { reason?: string }
 */
router.post('/:workflowId/signer/:signerId/decline',
  // Note: This endpoint might need special authentication for external signers
  digitalSignatureController.declineSignature.bind(digitalSignatureController) as any
);

/**
 * @route GET /api/signatures/:workflowId/signature/:signatureId/verify
 * @desc Verify a specific signature
 * @access Private (Admin, Manager, Employee)
 * @param {string} workflowId - Workflow ID
 * @param {string} signatureId - Signature ID
 */
router.get('/:workflowId/signature/:signatureId/verify',
  requireRole('CLIENT_ADMIN'),
  digitalSignatureController.verifySignature.bind(digitalSignatureController) as any
);

export { router as digitalSignatureRoutes };