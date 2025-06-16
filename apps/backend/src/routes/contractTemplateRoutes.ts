import express from 'express';
import { contractTemplateController } from '../controllers/contractTemplateController';
import { authenticate, requireRole } from '../middleware/auth';

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
  requireRole('COWORK_ADMIN'),
  contractTemplateController.getTemplates.bind(contractTemplateController) as any
);

/**
 * @route POST /api/contract-templates
 * @desc Create a new contract template
 * @access Private (Admin, Manager)
 * @body {CreateContractTemplateData} Template data
 */
router.post('/',
  requireRole('COWORK_ADMIN'),
  contractTemplateController.createTemplate.bind(contractTemplateController) as any
);

/**
 * @route GET /api/contract-templates/categories
 * @desc Get all template categories with counts
 * @access Private (Admin, Manager, Employee)
 */
router.get('/categories',
  requireRole('CLIENT_ADMIN'),
  contractTemplateController.getTemplateCategories.bind(contractTemplateController) as any
);

/**
 * @route POST /api/contract-templates/generate
 * @desc Generate a contract from a template
 * @access Private (Admin, Manager, Employee)
 * @body {GenerateContractData} Generation data
 */
router.post('/generate',
  requireRole('CLIENT_ADMIN'),
  contractTemplateController.generateContract.bind(contractTemplateController) as any
);

/**
 * @route GET /api/contract-templates/:id
 * @desc Get contract template by ID
 * @access Private (Admin, Manager, Employee)
 * @param {string} id - Template ID
 */
router.get('/:id',
  requireRole('CLIENT_ADMIN'),
  contractTemplateController.getTemplateById.bind(contractTemplateController) as any
);

/**
 * @route PUT /api/contract-templates/:id
 * @desc Update contract template
 * @access Private (Admin, Manager)
 * @param {string} id - Template ID
 * @body {UpdateContractTemplateData} Updated template data
 */
router.put('/:id',
  requireRole('COWORK_ADMIN'),
  contractTemplateController.updateTemplate.bind(contractTemplateController) as any
);

/**
 * @route DELETE /api/contract-templates/:id
 * @desc Delete contract template
 * @access Private (Admin)
 * @param {string} id - Template ID
 */
router.delete('/:id',
  requireRole('COWORK_ADMIN'),
  contractTemplateController.deleteTemplate.bind(contractTemplateController) as any
);

/**
 * @route GET /api/contract-templates/:id/validate
 * @desc Validate contract template
 * @access Private (Admin, Manager)
 * @param {string} id - Template ID
 */
router.get('/:id/validate',
  requireRole('COWORK_ADMIN'),
  contractTemplateController.validateTemplate.bind(contractTemplateController) as any
);

/**
 * @route POST /api/contract-templates/:id/duplicate
 * @desc Duplicate contract template
 * @access Private (Admin, Manager)
 * @param {string} id - Template ID
 * @body {object} { newName: string }
 */
router.post('/:id/duplicate',
  requireRole('COWORK_ADMIN'),
  contractTemplateController.duplicateTemplate.bind(contractTemplateController) as any
);

/**
 * @route POST /api/contract-templates/:id/preview
 * @desc Generate template preview with sample data
 * @access Private (Admin, Manager, Employee)
 * @param {string} id - Template ID
 * @body {object} { sampleData?: Record<string, any> }
 */
router.post('/:id/preview',
  requireRole('CLIENT_ADMIN'),
  contractTemplateController.previewTemplate.bind(contractTemplateController) as any
);

export { router as contractTemplateRoutes };