import { Request, Response } from 'express';
import { z } from 'zod';
import { contractTemplateService } from '../services/contractTemplateService';
import { ResponseHelper } from '../utils/response';
import { logger } from '../utils/logger';
import { AppError, ValidationError } from '../utils/errors';

const ContractTemplateVariableSchema = z.object({
  name: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid variable name'),
  type: z.enum(['text', 'number', 'date', 'boolean', 'currency', 'list']),
  label: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean(),
  defaultValue: z.any().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    options: z.array(z.string()).optional(),
  }).optional(),
});

const ContractTemplateSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  order: z.number().min(1),
  isOptional: z.boolean(),
  variables: z.array(z.string()),
});

const CreateContractTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().min(1).max(100),
  content: z.string().min(1),
  variables: z.array(ContractTemplateVariableSchema),
  sections: z.array(ContractTemplateSectionSchema),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdateContractTemplateSchema = CreateContractTemplateSchema.partial();

const ContractTemplateQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  searchTerm: z.string().optional(),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const GenerateContractSchema = z.object({
  templateId: z.string().min(1),
  variableValues: z.record(z.any()),
  selectedSections: z.array(z.string()).optional(),
  customSections: z.array(ContractTemplateSectionSchema).optional(),
  clientId: z.string().optional(),
  quotationId: z.string().optional(),
  opportunityId: z.string().optional(),
});

const DuplicateTemplateSchema = z.object({
  newName: z.string().min(1).max(255),
});

export class ContractTemplateController {
  async createTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const createdBy = req.user?.id;

      if (!tenantId || !createdBy) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const validatedData = CreateContractTemplateSchema.parse(req.body);

      logger.info('Creating contract template', {
        tenantId,
        createdBy,
        templateName: validatedData.name,
      });

      const template = await contractTemplateService.createTemplate(
        tenantId,
        createdBy,
        validatedData
      );

      logger.info('Contract template created successfully', {
        tenantId,
        templateId: template.id,
        templateName: template.name,
      });

      return ResponseHelper.success(res, template, 'Contract template created successfully', 201);
    } catch (error) {
      logger.error('Error creating contract template', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof ValidationError) {
        return ResponseHelper.error(res, error.message, 400);
      }

      return ResponseHelper.error(res, 'Failed to create contract template', 500);
    }
  }

  async getTemplates(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const query = ContractTemplateQuerySchema.parse(req.query);

      logger.debug('Fetching contract templates', { tenantId, query });

      const result = await contractTemplateService.getTemplates(tenantId, query);

      return ResponseHelper.success(res, result, 'Contract templates retrieved successfully');
    } catch (error) {
      logger.error('Error fetching contract templates', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Invalid query parameters', 400, error.errors);
      }

      return ResponseHelper.error(res, 'Failed to fetch contract templates', 500);
    }
  }

  async getTemplateById(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.debug('Fetching contract template by ID', { tenantId, templateId: id });

      const template = await contractTemplateService.getTemplateById(tenantId, id);

      return ResponseHelper.success(res, template, 'Contract template retrieved successfully');
    } catch (error) {
      logger.error('Error fetching contract template', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to fetch contract template', 500);
    }
  }

  async updateTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const validatedData = UpdateContractTemplateSchema.parse(req.body);

      logger.info('Updating contract template', {
        tenantId,
        templateId: id,
        updatedBy: req.user?.id,
      });

      const template = await contractTemplateService.updateTemplate(
        tenantId,
        id,
        validatedData
      );

      logger.info('Contract template updated successfully', {
        tenantId,
        templateId: id,
      });

      return ResponseHelper.success(res, template, 'Contract template updated successfully');
    } catch (error) {
      logger.error('Error updating contract template', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to update contract template', 500);
    }
  }

  async deleteTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.info('Deleting contract template', {
        tenantId,
        templateId: id,
        deletedBy: req.user?.id,
      });

      const result = await contractTemplateService.deleteTemplate(tenantId, id);

      logger.info('Contract template deleted successfully', {
        tenantId,
        templateId: id,
      });

      return ResponseHelper.success(res, result, 'Contract template deleted successfully');
    } catch (error) {
      logger.error('Error deleting contract template', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to delete contract template', 500);
    }
  }

  async generateContract(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const validatedData = GenerateContractSchema.parse(req.body);

      logger.info('Generating contract from template', {
        tenantId,
        templateId: validatedData.templateId,
        generatedBy: req.user?.id,
      });

      const contract = await contractTemplateService.generateContract(
        tenantId,
        validatedData
      );

      logger.info('Contract generated successfully', {
        tenantId,
        templateId: validatedData.templateId,
        contractTitle: contract.title,
      });

      return ResponseHelper.success(res, contract, 'Contract generated successfully');
    } catch (error) {
      logger.error('Error generating contract', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to generate contract', 500);
    }
  }

  async getTemplateCategories(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.debug('Fetching contract template categories', { tenantId });

      const categories = await contractTemplateService.getTemplateCategories(tenantId);

      return ResponseHelper.success(res, categories, 'Template categories retrieved successfully');
    } catch (error) {
      logger.error('Error fetching template categories', { error });
      return ResponseHelper.error(res, 'Failed to fetch template categories', 500);
    }
  }

  async validateTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.debug('Validating contract template', { tenantId, templateId: id });

      const validation = await contractTemplateService.validateTemplate(tenantId, id);

      return ResponseHelper.success(res, validation, 'Template validation completed');
    } catch (error) {
      logger.error('Error validating template', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to validate template', 500);
    }
  }

  async duplicateTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const { newName } = DuplicateTemplateSchema.parse(req.body);

      logger.info('Duplicating contract template', {
        tenantId,
        originalTemplateId: id,
        newName,
        duplicatedBy: req.user?.id,
      });

      const duplicatedTemplate = await contractTemplateService.duplicateTemplate(
        tenantId,
        id,
        newName
      );

      logger.info('Contract template duplicated successfully', {
        tenantId,
        originalTemplateId: id,
        newTemplateId: duplicatedTemplate.id,
      });

      return ResponseHelper.success(res, duplicatedTemplate, 'Contract template duplicated successfully');
    } catch (error) {
      logger.error('Error duplicating contract template', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to duplicate contract template', 500);
    }
  }

  async previewTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const sampleData = req.body.sampleData || {};

      logger.debug('Generating template preview', { tenantId, templateId: id });

      const preview = await contractTemplateService.previewTemplate(
        tenantId,
        id,
        sampleData
      );

      return ResponseHelper.success(res, preview, 'Template preview generated successfully');
    } catch (error) {
      logger.error('Error generating template preview', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to generate template preview', 500);
    }
  }
}

export const contractTemplateController = new ContractTemplateController();