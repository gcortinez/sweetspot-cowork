import express from 'express';
import { contractTemplateController } from '../controllers/contractTemplateController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/contract-templates
 * @desc Get contract templates with pagination and filtering
 * @access Private (Admin, Manager)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @query {string} category - Filter by category
 * @query {boolean} isActive - Filter by active status
 * @query {string} searchTerm - Search in name and description
 * @query {string} sortBy - Sort field (default: name)
 * @query {string} sortOrder - Sort order: asc or desc (default: asc)
 */
router.get('/', 
  authorize(['ADMIN', 'MANAGER']),
  contractTemplateController.getTemplates.bind(contractTemplateController)
);

/**
 * @route POST /api/contract-templates
 * @desc Create a new contract template
 * @access Private (Admin, Manager)
 * @body {CreateContractTemplateData} Template data
 */
router.post('/',
  authorize(['ADMIN', 'MANAGER']),
  contractTemplateController.createTemplate.bind(contractTemplateController)
);

/**
 * @route GET /api/contract-templates/categories
 * @desc Get all template categories with counts
 * @access Private (Admin, Manager, Employee)
 */
router.get('/categories',
  authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  contractTemplateController.getTemplateCategories.bind(contractTemplateController)
);

/**
 * @route POST /api/contract-templates/generate
 * @desc Generate a contract from a template
 * @access Private (Admin, Manager, Employee)
 * @body {GenerateContractData} Generation data
 */
router.post('/generate',
  authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  contractTemplateController.generateContract.bind(contractTemplateController)
);

/**
 * @route GET /api/contract-templates/:id
 * @desc Get contract template by ID
 * @access Private (Admin, Manager, Employee)
 * @param {string} id - Template ID
 */
router.get('/:id',
  authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  contractTemplateController.getTemplateById.bind(contractTemplateController)
);

/**
 * @route PUT /api/contract-templates/:id
 * @desc Update contract template
 * @access Private (Admin, Manager)
 * @param {string} id - Template ID
 * @body {UpdateContractTemplateData} Updated template data
 */
router.put('/:id',
  authorize(['ADMIN', 'MANAGER']),
  contractTemplateController.updateTemplate.bind(contractTemplateController)
);

/**
 * @route DELETE /api/contract-templates/:id
 * @desc Delete contract template
 * @access Private (Admin)
 * @param {string} id - Template ID
 */
router.delete('/:id',
  authorize(['ADMIN']),
  contractTemplateController.deleteTemplate.bind(contractTemplateController)
);

/**
 * @route GET /api/contract-templates/:id/validate
 * @desc Validate contract template
 * @access Private (Admin, Manager)
 * @param {string} id - Template ID
 */
router.get('/:id/validate',
  authorize(['ADMIN', 'MANAGER']),
  contractTemplateController.validateTemplate.bind(contractTemplateController)
);

/**
 * @route POST /api/contract-templates/:id/duplicate
 * @desc Duplicate contract template
 * @access Private (Admin, Manager)
 * @param {string} id - Template ID
 * @body {object} { newName: string }
 */
router.post('/:id/duplicate',
  authorize(['ADMIN', 'MANAGER']),
  contractTemplateController.duplicateTemplate.bind(contractTemplateController)
);

/**
 * @route POST /api/contract-templates/:id/preview
 * @desc Generate template preview with sample data
 * @access Private (Admin, Manager, Employee)
 * @param {string} id - Template ID
 * @body {object} { sampleData?: Record<string, any> }
 */
router.post('/:id/preview',
  authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  contractTemplateController.previewTemplate.bind(contractTemplateController)
);

export { router as contractTemplateRoutes };