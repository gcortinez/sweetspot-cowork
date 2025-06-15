"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractTemplateController = exports.ContractTemplateController = void 0;
const zod_1 = require("zod");
const contractTemplateService_1 = require("../services/contractTemplateService");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const ContractTemplateVariableSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid variable name'),
    type: zod_1.z.enum(['text', 'number', 'date', 'boolean', 'currency', 'list']),
    label: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    required: zod_1.z.boolean(),
    defaultValue: zod_1.z.any().optional(),
    validation: zod_1.z.object({
        min: zod_1.z.number().optional(),
        max: zod_1.z.number().optional(),
        pattern: zod_1.z.string().optional(),
        options: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
});
const ContractTemplateSectionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1),
    order: zod_1.z.number().min(1),
    isOptional: zod_1.z.boolean(),
    variables: zod_1.z.array(zod_1.z.string()),
});
const CreateContractTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().min(1).max(100),
    content: zod_1.z.string().min(1),
    variables: zod_1.z.array(ContractTemplateVariableSchema),
    sections: zod_1.z.array(ContractTemplateSectionSchema),
    isActive: zod_1.z.boolean().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
const UpdateContractTemplateSchema = CreateContractTemplateSchema.partial();
const ContractTemplateQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(10),
    category: zod_1.z.string().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    searchTerm: zod_1.z.string().optional(),
    sortBy: zod_1.z.string().default('name'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc'),
});
const GenerateContractSchema = zod_1.z.object({
    templateId: zod_1.z.string().min(1),
    variableValues: zod_1.z.record(zod_1.z.any()),
    selectedSections: zod_1.z.array(zod_1.z.string()).optional(),
    customSections: zod_1.z.array(ContractTemplateSectionSchema).optional(),
    clientId: zod_1.z.string().optional(),
    quotationId: zod_1.z.string().optional(),
    opportunityId: zod_1.z.string().optional(),
});
const DuplicateTemplateSchema = zod_1.z.object({
    newName: zod_1.z.string().min(1).max(255),
});
class ContractTemplateController {
    async createTemplate(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const createdBy = req.user?.id;
            if (!tenantId || !createdBy) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const validatedData = CreateContractTemplateSchema.parse(req.body);
            logger_1.logger.info('Creating contract template', {
                tenantId,
                createdBy,
                templateName: validatedData.name,
            });
            const template = await contractTemplateService_1.contractTemplateService.createTemplate(tenantId, createdBy, validatedData);
            logger_1.logger.info('Contract template created successfully', {
                tenantId,
                templateId: template.id,
                templateName: template.name,
            });
            return response_1.ResponseHelper.success(res, template, 'Contract template created successfully', 201);
        }
        catch (error) {
            logger_1.logger.error('Error creating contract template', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.ValidationError) {
                return response_1.ResponseHelper.error(res, error.message, 400);
            }
            return response_1.ResponseHelper.error(res, 'Failed to create contract template', 500);
        }
    }
    async getTemplates(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const query = ContractTemplateQuerySchema.parse(req.query);
            logger_1.logger.debug('Fetching contract templates', { tenantId, query });
            const result = await contractTemplateService_1.contractTemplateService.getTemplates(tenantId, query);
            return response_1.ResponseHelper.success(res, result, 'Contract templates retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching contract templates', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Invalid query parameters', 400, error.errors);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch contract templates', 500);
        }
    }
    async getTemplateById(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Fetching contract template by ID', { tenantId, templateId: id });
            const template = await contractTemplateService_1.contractTemplateService.getTemplateById(tenantId, id);
            return response_1.ResponseHelper.success(res, template, 'Contract template retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching contract template', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch contract template', 500);
        }
    }
    async updateTemplate(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const validatedData = UpdateContractTemplateSchema.parse(req.body);
            logger_1.logger.info('Updating contract template', {
                tenantId,
                templateId: id,
                updatedBy: req.user?.id,
            });
            const template = await contractTemplateService_1.contractTemplateService.updateTemplate(tenantId, id, validatedData);
            logger_1.logger.info('Contract template updated successfully', {
                tenantId,
                templateId: id,
            });
            return response_1.ResponseHelper.success(res, template, 'Contract template updated successfully');
        }
        catch (error) {
            logger_1.logger.error('Error updating contract template', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to update contract template', 500);
        }
    }
    async deleteTemplate(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.info('Deleting contract template', {
                tenantId,
                templateId: id,
                deletedBy: req.user?.id,
            });
            const result = await contractTemplateService_1.contractTemplateService.deleteTemplate(tenantId, id);
            logger_1.logger.info('Contract template deleted successfully', {
                tenantId,
                templateId: id,
            });
            return response_1.ResponseHelper.success(res, result, 'Contract template deleted successfully');
        }
        catch (error) {
            logger_1.logger.error('Error deleting contract template', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to delete contract template', 500);
        }
    }
    async generateContract(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const validatedData = GenerateContractSchema.parse(req.body);
            logger_1.logger.info('Generating contract from template', {
                tenantId,
                templateId: validatedData.templateId,
                generatedBy: req.user?.id,
            });
            const contract = await contractTemplateService_1.contractTemplateService.generateContract(tenantId, validatedData);
            logger_1.logger.info('Contract generated successfully', {
                tenantId,
                templateId: validatedData.templateId,
                contractTitle: contract.title,
            });
            return response_1.ResponseHelper.success(res, contract, 'Contract generated successfully');
        }
        catch (error) {
            logger_1.logger.error('Error generating contract', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to generate contract', 500);
        }
    }
    async getTemplateCategories(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Fetching contract template categories', { tenantId });
            const categories = await contractTemplateService_1.contractTemplateService.getTemplateCategories(tenantId);
            return response_1.ResponseHelper.success(res, categories, 'Template categories retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching template categories', { error });
            return response_1.ResponseHelper.error(res, 'Failed to fetch template categories', 500);
        }
    }
    async validateTemplate(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Validating contract template', { tenantId, templateId: id });
            const validation = await contractTemplateService_1.contractTemplateService.validateTemplate(tenantId, id);
            return response_1.ResponseHelper.success(res, validation, 'Template validation completed');
        }
        catch (error) {
            logger_1.logger.error('Error validating template', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to validate template', 500);
        }
    }
    async duplicateTemplate(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const { newName } = DuplicateTemplateSchema.parse(req.body);
            logger_1.logger.info('Duplicating contract template', {
                tenantId,
                originalTemplateId: id,
                newName,
                duplicatedBy: req.user?.id,
            });
            const duplicatedTemplate = await contractTemplateService_1.contractTemplateService.duplicateTemplate(tenantId, id, newName);
            logger_1.logger.info('Contract template duplicated successfully', {
                tenantId,
                originalTemplateId: id,
                newTemplateId: duplicatedTemplate.id,
            });
            return response_1.ResponseHelper.success(res, duplicatedTemplate, 'Contract template duplicated successfully');
        }
        catch (error) {
            logger_1.logger.error('Error duplicating contract template', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to duplicate contract template', 500);
        }
    }
    async previewTemplate(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const sampleData = req.body.sampleData || {};
            logger_1.logger.debug('Generating template preview', { tenantId, templateId: id });
            const preview = await contractTemplateService_1.contractTemplateService.previewTemplate(tenantId, id, sampleData);
            return response_1.ResponseHelper.success(res, preview, 'Template preview generated successfully');
        }
        catch (error) {
            logger_1.logger.error('Error generating template preview', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to generate template preview', 500);
        }
    }
}
exports.ContractTemplateController = ContractTemplateController;
exports.contractTemplateController = new ContractTemplateController();
//# sourceMappingURL=contractTemplateController.js.map