import express from 'express';
import { contractLifecycleController } from '../controllers/contractLifecycleController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/contracts
 * @desc Get contracts with pagination and filtering
 * @access Private (Admin, Manager, Employee)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @query {string} status - Filter by contract status
 * @query {string} type - Filter by contract type
 * @query {string} clientId - Filter by client ID
 * @query {string} templateId - Filter by template ID
 * @query {string} dateFrom - Filter from date (ISO string)
 * @query {string} dateTo - Filter to date (ISO string)
 * @query {number} expiringDays - Contracts expiring in X days
 * @query {string} sortBy - Sort field (default: createdAt)
 * @query {string} sortOrder - Sort order: asc or desc (default: desc)
 */
router.get('/', 
  authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  contractLifecycleController.getContracts.bind(contractLifecycleController)
);

/**
 * @route POST /api/contracts
 * @desc Create a new contract
 * @access Private (Admin, Manager)
 * @body {CreateContractData} Contract data
 */
router.post('/',
  authorize(['ADMIN', 'MANAGER']),
  contractLifecycleController.createContract.bind(contractLifecycleController)
);

/**
 * @route GET /api/contracts/stats
 * @desc Get contract statistics
 * @access Private (Admin, Manager)
 */
router.get('/stats',
  authorize(['ADMIN', 'MANAGER']),
  contractLifecycleController.getContractStats.bind(contractLifecycleController)
);

/**
 * @route GET /api/contracts/expiring
 * @desc Get contracts expiring soon
 * @access Private (Admin, Manager, Employee)
 * @query {number} days - Number of days (default: 30, max: 365)
 */
router.get('/expiring',
  authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  contractLifecycleController.getExpiringContracts.bind(contractLifecycleController)
);

/**
 * @route GET /api/contracts/:id
 * @desc Get contract by ID
 * @access Private (Admin, Manager, Employee)
 * @param {string} id - Contract ID
 */
router.get('/:id',
  authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  contractLifecycleController.getContractById.bind(contractLifecycleController)
);

/**
 * @route PUT /api/contracts/:id
 * @desc Update contract
 * @access Private (Admin, Manager)
 * @param {string} id - Contract ID
 * @body {UpdateContractData} Updated contract data
 */
router.put('/:id',
  authorize(['ADMIN', 'MANAGER']),
  contractLifecycleController.updateContract.bind(contractLifecycleController)
);

/**
 * @route POST /api/contracts/:id/activate
 * @desc Activate a contract
 * @access Private (Admin, Manager)
 * @param {string} id - Contract ID
 */
router.post('/:id/activate',
  authorize(['ADMIN', 'MANAGER']),
  contractLifecycleController.activateContract.bind(contractLifecycleController)
);

/**
 * @route POST /api/contracts/:id/suspend
 * @desc Suspend a contract
 * @access Private (Admin, Manager)
 * @param {string} id - Contract ID
 * @body {object} { reason?: string }
 */
router.post('/:id/suspend',
  authorize(['ADMIN', 'MANAGER']),
  contractLifecycleController.suspendContract.bind(contractLifecycleController)
);

/**
 * @route POST /api/contracts/:id/reactivate
 * @desc Reactivate a suspended contract
 * @access Private (Admin, Manager)
 * @param {string} id - Contract ID
 */
router.post('/:id/reactivate',
  authorize(['ADMIN', 'MANAGER']),
  contractLifecycleController.reactivateContract.bind(contractLifecycleController)
);

/**
 * @route POST /api/contracts/:id/terminate
 * @desc Terminate a contract
 * @access Private (Admin)
 * @param {string} id - Contract ID
 * @body {object} { reason?: string, terminationDate?: Date }
 */
router.post('/:id/terminate',
  authorize(['ADMIN']),
  contractLifecycleController.terminateContract.bind(contractLifecycleController)
);

/**
 * @route POST /api/contracts/:id/cancel
 * @desc Cancel a contract
 * @access Private (Admin, Manager)
 * @param {string} id - Contract ID
 * @body {object} { reason?: string }
 */
router.post('/:id/cancel',
  authorize(['ADMIN', 'MANAGER']),
  contractLifecycleController.cancelContract.bind(contractLifecycleController)
);

/**
 * @route GET /api/contracts/:id/activity
 * @desc Get contract activity log
 * @access Private (Admin, Manager, Employee)
 * @param {string} id - Contract ID
 */
router.get('/:id/activity',
  authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  contractLifecycleController.getContractActivity.bind(contractLifecycleController)
);

/**
 * @route POST /api/contracts/:id/send-for-signature
 * @desc Send contract for digital signature
 * @access Private (Admin, Manager)
 * @param {string} id - Contract ID
 */
router.post('/:id/send-for-signature',
  authorize(['ADMIN', 'MANAGER']),
  contractLifecycleController.sendContractForSignature.bind(contractLifecycleController)
);

export { router as contractLifecycleRoutes };